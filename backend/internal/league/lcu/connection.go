package lcu

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"regexp"
	"sync"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/process"
)

type Connection struct {
	client  *resty.Client
	ctx     context.Context
	process *process.Process
	mu      sync.Mutex
	logger  *logger.Logger
}

func NewConnection(logger *logger.Logger, process *process.Process) *Connection {
	return &Connection{
		process: process,
		logger:  logger,
		ctx:     context.Background(),
	}
}

func (c *Connection) performInitialization() error {
	port, token, _, err := c.GetLeagueCredentials()
	if err != nil {
		return fmt.Errorf("failed to get league credentials: %w", err)
	}
	encodedAuth := base64.StdEncoding.EncodeToString([]byte("riot:" + token))

	newClient := resty.New().
		SetBaseURL(fmt.Sprintf("https://127.0.0.1:%s", port)).
		SetHeader("Accept", "application/json").
		SetHeader("Authorization", "Basic "+encodedAuth).
		SetTimeout(10 * time.Second)

	newClient.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	c.client = newClient
	return nil
}

func (c *Connection) IsLCUConnectionReady() bool {
	port, token, _, err := c.GetLeagueCredentials()
	if err != nil || port == "" || token == "" {
		return false
	}

	encodedAuth := base64.StdEncoding.EncodeToString([]byte("riot:" + token))
	tempClient := resty.New().
		SetBaseURL(fmt.Sprintf("https://127.0.0.1:%s", port)).
		SetHeader("Accept", "application/json").
		SetHeader("Authorization", "Basic "+encodedAuth).
		SetTimeout(3 * time.Second).
		SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	resp, err := tempClient.R().
		SetContext(ctx).
		Get("/lol-summoner/v1/status")

	if err != nil {
		return false
	}
	return resp.IsSuccess()
}

func (c *Connection) GetClient() (*resty.Client, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.client != nil {
		return c.client, nil
	}

	if c.client != nil {
		return c.client, nil
	}

	err := c.performInitialization()
	if err != nil {
		return nil, err
	}

	if c.client == nil {
		return nil, errors.New("LCU client remains nil after initialization attempt")
	}
	return c.client, nil
}

func (c *Connection) ForceReinitialize() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.performInitialization()
}

func (c *Connection) Initialize() error {
	_, err := c.GetClient()
	return err
}

func (c *Connection) IsClientInitialized() bool {
	c.mu.Lock()
	currentClient := c.client
	c.mu.Unlock()

	if currentClient == nil {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	resp, err := currentClient.R().
		SetContext(ctx).
		Get("/lol-summoner/v1/status")

	if err != nil {
		return false
	}
	return resp.IsSuccess()
}

func (c *Connection) GetLeagueCredentials() (port, token, pid string, err error) {
	output, err := c.process.GetCommandLineByName("LeagueClientUx.exe")
	if err != nil {
		return "", "", "", fmt.Errorf("failed to get command line for LeagueClientUx.exe: %w", err)
	}

	portRegex := regexp.MustCompile(`--app-port=(\d+)`)
	tokenRegex := regexp.MustCompile(`--remoting-auth-token=([\w-]+)`)
	pidRegex := regexp.MustCompile(`--app-pid=(\d+)`)

	portMatches := portRegex.FindStringSubmatch(string(output))
	tokenMatches := tokenRegex.FindStringSubmatch(string(output))
	pidMatches := pidRegex.FindStringSubmatch(string(output))

	if len(portMatches) < 2 || len(tokenMatches) < 2 || len(pidMatches) < 2 {
		return "", "", "", errors.New("league client not found or missing required parameters (port/token/pid)")
	}
	port = portMatches[1]
	token = tokenMatches[1]
	pid = pidMatches[1]

	if port == "" || token == "" || pid == "" {
		return "", "", "", errors.New("league client parameters (port/token/pid) are empty")
	}
	return port, token, pid, nil
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
