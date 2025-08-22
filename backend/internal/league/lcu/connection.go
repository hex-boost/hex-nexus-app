package lcu

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/sysquery"
	"golang.org/x/sync/singleflight"
	"regexp"
	"strconv"
	"sync"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/process"
)

type cachedCreds struct {
	pid     uint32
	port    int
	portStr string
	token   string
}
type Connection struct {
	client   *resty.Client
	ctx      context.Context
	process  *process.Process
	sysquery *sysquery.SysQuery
	creds    *cachedCreds
	mu       sync.RWMutex       // <- RWMutex
	sf       singleflight.Group // <- dedupe concurrent refreshes (optional but nice)

	logger *logger.Logger
}

func NewConnection(logger *logger.Logger, process *process.Process, sysQuery *sysquery.SysQuery) *Connection {
	return &Connection{
		process:  process,
		logger:   logger,
		ctx:      context.Background(),
		sysquery: sysQuery,
	}
}
func (c *Connection) initializeWithCredsLocked() {
	if c.creds == nil {
		return
	}
	encodedAuth := base64.StdEncoding.EncodeToString([]byte("riot:" + c.creds.token))

	newClient := resty.New().
		SetBaseURL(fmt.Sprintf("https://127.0.0.1:%d", c.creds.port)).
		SetHeader("Accept", "application/json").
		SetHeader("Authorization", "Basic "+encodedAuth).
		SetTimeout(10 * time.Second)

	newClient.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	c.client = newClient
}
func (c *Connection) performInitialization() error {
	port, token, _, err := c.GetLeagueCredentials()
	if err != nil {
		return fmt.Errorf("failed to get league credentials: %w", err)
	}
	encodedAuth := base64.StdEncoding.EncodeToString([]byte("riot:" + token))

	newClient := resty.New().
		SetBaseURL(fmt.Sprintf("https://127.0.0.1:%d", port)).
		SetHeader("Accept", "application/json").
		SetHeader("Authorization", "Basic "+encodedAuth).
		SetTimeout(10 * time.Second)

	newClient.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	c.client = newClient
	return nil
}

func (c *Connection) GetClient() (*resty.Client, error) {
	// fast path: already good
	if c.IsClientInitialized() {
		c.mu.RLock()
		cli := c.client
		c.mu.RUnlock()
		return cli, nil
	}

	// slow path: re-init via singleflight to avoid dogpile
	v, err, _ := c.sf.Do("init-client", func() (any, error) {
		// build/refresh creds + client
		_, _, _, err := c.refreshCredsAndClient()
		if err != nil {
			return nil, err
		}
		c.mu.RLock()
		cli := c.client
		c.mu.RUnlock()
		return cli, nil
	})
	if err != nil {
		return nil, err
	}
	return v.(*resty.Client), nil
}
func (c *Connection) refreshCredsAndClient() (int, string, string, error) {
	port, token, portStr, err := c.GetLeagueCredentials()
	if err != nil {
		return 0, "", "", err
	}
	return port, token, portStr, nil
}

func (c *Connection) IsClientInitialized() bool {
	c.mu.RLock()
	currentClient := c.client
	c.mu.RUnlock()

	if currentClient == nil {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	resp, err := currentClient.R().SetContext(ctx).Get("/lol-summoner/v1/status")
	if err != nil {
		return false
	}
	return resp.IsSuccess()
}
func (c *Connection) extractCredsFromCmdLine(cmdLine string) (*cachedCreds, error) {
	// Tokens can be quoted or unquoted; capture until a quote or whitespace
	portRegex := regexp.MustCompile(`--app-port=(\d+)`)
	riotTokenRegex := regexp.MustCompile(`--riotclient-auth-token=([^"'\s]+)`)
	remotingTokenRegex := regexp.MustCompile(`--remoting-auth-token=([^"'\s]+)`)

	portMatch := portRegex.FindStringSubmatch(cmdLine)
	if len(portMatch) < 2 {
		return nil, fmt.Errorf("app-port not found")
	}
	portInt, err := strconv.Atoi(portMatch[1])
	if err != nil {
		return nil, fmt.Errorf("invalid app-port: %w", err)
	}

	remotingMatch := remotingTokenRegex.FindStringSubmatch(cmdLine)
	if len(remotingMatch) < 2 {
		return nil, fmt.Errorf("remoting-auth-token not found")
	}

	_ = riotTokenRegex.FindStringSubmatch(cmdLine)

	return &cachedCreds{
		pid:     0,
		port:    portInt,
		portStr: portMatch[1],
		token:   remotingMatch[1],
	}, nil
}
func (c *Connection) GetLeagueCredentials() (port int, token, portStr string, err error) {

	// fast path: if client is up and we have cached creds, reuse
	if c.IsClientInitialized() {
		c.mu.RLock()
		cc := c.creds
		c.mu.RUnlock()
		if cc != nil {
			return cc.port, cc.token, cc.portStr, nil
		}
	}

	// slow path: compute creds without touching shared state yet
	// 1) try direct LeagueClientUx.exe
	if leagueCmdLine, leagueCmdLineErr := c.process.GetCommandLineByName("LeagueClientUx.exe"); leagueCmdLineErr == nil {
		if creds, exErr := c.extractCredsFromCmdLine(*leagueCmdLine.CommandLine); exErr == nil {
			// write under lock and init client
			c.mu.Lock()
			c.creds = creds
			c.initializeWithCredsLocked()
			c.mu.Unlock()
			return creds.port, creds.token, creds.portStr, nil
		}
	}

	// 2) fallback: iterate processes
	processes, perr := c.sysquery.GetProcessesWithCim()
	if perr != nil {
		return 0, "", "", fmt.Errorf("failed to get processes: %w", perr)
	}
	for _, p := range processes {
		if p.CommandLine == nil {
			continue
		}
		if creds, exErr := c.extractCredsFromCmdLine(*p.CommandLine); exErr == nil {
			creds.pid = p.ProcessID
			c.mu.Lock()
			c.creds = creds
			c.initializeWithCredsLocked()
			c.mu.Unlock()
			return creds.port, creds.token, creds.portStr, nil
		}
	}

	// miss
	c.mu.Lock()
	c.creds = nil
	c.mu.Unlock()
	return 0, "", "", errors.New("League Client process not found or credentials not available")
}
func (c *Connection) WaitUntilReady() error {
	timeout := 60 * time.Second
	ctx, cancel := context.WithTimeout(c.ctx, timeout)
	defer cancel()

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return errors.New("timeout waiting for LeagueService client to be ready")
		case <-ticker.C:
			if _, _, _, err := c.GetLeagueCredentials(); err == nil {
				return nil
			}
		}
	}
}
