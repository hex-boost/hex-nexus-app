package lcu

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"go.uber.org/zap"
	"regexp"
	"strconv"
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
		SetBaseURL(fmt.Sprintf("https://127.0.0.1:%d", port)).
		SetHeader("Accept", "application/json").
		SetHeader("Authorization", "Basic "+encodedAuth).
		SetTimeout(10 * time.Second)

	newClient.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	c.client = newClient
	return nil
}

func (c *Connection) GetClient() (*resty.Client, error) {
	if c.IsClientInitialized() {
		return c.client, nil
	}

	c.mu.Lock()
	err := c.performInitialization()

	defer c.mu.Unlock()
	if err != nil {
		return nil, err
	}
	c.logger.Info("LCU client initialized successfully")
	return c.client, nil
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

type Win32_Process struct {
	ProcessID   uint32
	CommandLine *string
}

func (c *Connection) getProcessesWithCim() ([]Win32_Process, error) {
	cmdRaw := `Get-CimInstance -ClassName Win32_Process -Property ProcessId,CommandLine -ErrorAction SilentlyContinue | Select-Object ProcessId,CommandLine | ConvertTo-Json`

	// Execute the PowerShell command.
	var stdout, stderr bytes.Buffer
	cmd := command.New()
	ps := cmd.Exec("powershell", "-NoProfile", "-NonInteractive", "-Command", cmdRaw)
	ps.Stdout = &stdout
	ps.Stderr = &stderr

	if err := ps.Run(); err != nil {
		return nil, fmt.Errorf("failed to execute PowerShell command: %w, stderr: %s", err, stderr.String())
	}

	// Unmarshal the JSON output into our struct slice.
	var processes []Win32_Process
	if err := json.Unmarshal(stdout.Bytes(), &processes); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON from PowerShell: %w", err)
	}

	return processes, nil
}
func (c *Connection) GetLeagueCredentials() (port int, token string, portStr string, err error) {
	// Get all processes with their command lines
	processes, err := c.getProcessesWithCim()
	if err != nil {
		return 0, "", "", fmt.Errorf("failed to get processes: %w", err)
	}

	// Define regex patterns to extract credentials
	portRegex := regexp.MustCompile(`--app-port=(\d+)`)
	riotTokenRegex := regexp.MustCompile(`--riotclient-auth-token=([\w-]+)`)
	remotingTokenRegex := regexp.MustCompile(`--remoting-auth-token=([\w-]+)`)

	// Search through all processes
	for _, process := range processes {
		if process.CommandLine == nil {
			continue
		}

		cmdLine := *process.CommandLine

		// Check if this is a League client process by looking for riotclient-auth-token
		if !riotTokenRegex.MatchString(cmdLine) {
			continue
		}

		portMatch := portRegex.FindStringSubmatch(cmdLine)
		remotingTokenMatch := remotingTokenRegex.FindStringSubmatch(cmdLine)

		// Verify all required credentials are found
		if len(portMatch) < 2 || len(remotingTokenMatch) < 2 {
			c.logger.Debug("Found League Client process but couldn't extract all credentials",
				zap.Uint32("processId", process.ProcessID),
				zap.Bool("hasPort", len(portMatch) >= 2),
				zap.Bool("hasRemotingToken", len(remotingTokenMatch) >= 2))
			continue
		}

		// Parse port to integer
		portInt, err := strconv.Atoi(portMatch[1])
		if err != nil {
			c.logger.Warn("Found League Client but failed to parse port", zap.Error(err))
			continue
		}

		return portInt, remotingTokenMatch[1], portMatch[1], nil
	}

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
