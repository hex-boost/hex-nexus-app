package league

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"go.uber.org/zap"
	"os/exec"
	"regexp"
	"time"
)

// LCUConnection handles the connection to the League of Legends client
type LCUConnection struct {
	client *resty.Client
	logger *utils.Logger
	ctx    context.Context
}

// NewLCUConnection creates a new League client connection
func NewLCUConnection(logger *utils.Logger) *LCUConnection {
	return &LCUConnection{
		client: nil,
		logger: logger,
		ctx:    context.Background(),
	}
}

// InitializeConnection finds and connects to the League client
func (c *LCUConnection) InitializeConnection() error {
	c.logger.Info("Initializing League client connection")

	// Find League client process and get connection details
	port, token, _, err := c.getLeagueCredentials()
	if err != nil {
		return err
	}
	encodedAuth := base64.StdEncoding.EncodeToString([]byte("riotClient:" + token))

	client := resty.New().
		SetBaseURL(fmt.Sprintf("https://127.0.0.1:%s", port)).
		SetHeader("Accept", "application/json").
		SetHeader("Authorization", "Basic "+encodedAuth)

	// League client uses self-signed cert
	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})

	c.client = client
	c.logger.Info("Client connection initialized successfully")

	return nil
}
func (c *LCUConnection) getProcessCommandLine() ([]byte, error) {

	c.logger.Debug("Looking for League client process")
	cmd := exec.Command("wmic", "process", "where", "name='LeagueClientUx.exe'", "get", "commandline")
	cmd = utils.HideConsoleWindow(cmd)
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	return output, nil
}

// getLeagueCredentials locates the League client process and extracts connection details
func (c *LCUConnection) getLeagueCredentials() (port, token, pid string, err error) {
	output, err := c.getProcessCommandLine()
	// Extract port and auth token using regex
	portRegex := regexp.MustCompile(`--app-port=(\d+)`)
	tokenRegex := regexp.MustCompile(`--remoting-auth-token=([\w-]+)`)
	pidRegex := regexp.MustCompile(`--app-pid=(\d+)`)

	portMatches := portRegex.FindStringSubmatch(string(output))
	tokenMatches := tokenRegex.FindStringSubmatch(string(output))
	pidMatches := pidRegex.FindStringSubmatch(string(output))

	if len(portMatches) < 2 || len(tokenMatches) < 2 || len(pidMatches) < 2 {
		return "", "", "", errors.New("league client not found or missing required parameters")
	}
	if portMatches[1] == "" {
		return "", "", "", errors.New("league client port parameter is empty")
	}
	if tokenMatches[1] == "" {
		return "", "", "", errors.New("league client auth token parameter is empty")
	}
	if pidMatches[1] == "" {
		return "", "", "", errors.New("league client pid parameter is empty")
	}

	port = portMatches[1]
	token = tokenMatches[1]
	pid = pidMatches[1]

	c.logger.Info("Found League client",
		zap.String("port", port),
		zap.String("pid", pid))

	return port, token, pid, nil
}
func (c *LCUConnection) WaitInventoryIsReady() {
	c.logger.Info("Waiting for inventory system to be ready")

	attempts := 0
	for {
		if c.IsInventoryReady() {
			c.logger.Info("Inventory system is ready", zap.Int("attempts", attempts))
			return
		}

		attempts++
		if attempts%10 == 0 {
			c.logger.Debug("Still waiting for inventory system to be ready", zap.Int("attempts", attempts))
		}

		// Sleep to avoid hammering the client
		time.Sleep(1 * time.Second)
	}
}

// IsInventoryReady checks if the League client is ready to accept API requests
func (c *LCUConnection) IsInventoryReady() bool {
	// Check if client is properly initialized
	if c.client == nil {
		c.logger.Debug("LCU client not initialized")
		return false
	}

	var result bool
	resp, err := c.client.R().SetResult(&result).Get("/lol-inventory/v1/initial-configuration-complete")

	if err != nil {
		c.logger.Debug("LCU client connection test failed", zap.Error(err))
		return false
	}

	// Check if we got a successful response
	if resp.IsError() {
		c.logger.Debug("LCU client ready and accepting API requests")
		return false
	}
	c.logger.Debug("LCU client not ready", zap.Int("statusCode", resp.StatusCode()))
	return result
}

// WaitUntilReady waits for the League client to be ready with a timeout
func (c *LCUConnection) WaitUntilReady() error {
	timeout := 60 * time.Second
	c.logger.Info("Waiting for League client to be ready", zap.Duration("timeout", timeout))

	ctx, cancel := context.WithTimeout(c.ctx, timeout)
	defer cancel()

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	attempts := 0
	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("timeout waiting for League client to be ready after attempts")
		case <-ticker.C:
			attempts++
			if _, _, _, err := c.getLeagueCredentials(); err == nil {
				c.logger.Info("League client process is ready", zap.Int("attempts", attempts))
				return nil
			}
			if attempts%10 == 0 {
				c.logger.Debug("Still waiting for League client to be ready", zap.Int("attempts", attempts))
			}

		}
	}
}
