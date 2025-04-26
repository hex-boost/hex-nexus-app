package lcu

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"regexp"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/process"
	"go.uber.org/zap"
)

type Connection struct {
	Client  *resty.Client
	logger  *logger.Logger
	ctx     context.Context
	process *process.Process
}

func NewConnection(logger *logger.Logger, process *process.Process) *Connection {
	return &Connection{
		Client:  nil,
		process: process,
		logger:  logger,
		ctx:     context.Background(),
	}
}

func (c *Connection) Initialize() error {
	port, token, _, err := c.GetLeagueCredentials()
	if err != nil {
		return err
	}
	encodedAuth := base64.StdEncoding.EncodeToString([]byte("riot:" + token))

	client := resty.New().
		SetBaseURL(fmt.Sprintf("https://127.0.0.1:%s", port)).
		SetHeader("Accept", "application/json").
		SetHeader("Authorization", "Basic "+encodedAuth)

	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})

	c.Client = client

	return nil
}

func (c *Connection) GetLeagueCredentials() (port, token, pid string, err error) {
	output, err := c.process.GetCommandLineByName("LeagueClientUx.exe")

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

	return port, token, pid, nil
}

func (c *Connection) WaitUntilReady() error {
	timeout := 60 * time.Second
	c.logger.Info("Waiting for LeagueService client to be ready", zap.Duration("timeout", timeout))

	ctx, cancel := context.WithTimeout(c.ctx, timeout)
	defer cancel()

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	attempts := 0
	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("timeout waiting for LeagueService client to be ready after attempts")
		case <-ticker.C:
			attempts++
			if _, _, _, err := c.GetLeagueCredentials(); err == nil {
				c.logger.Info("LeagueService client process is ready", zap.Int("attempts", attempts))
				return nil
			}
			if attempts%10 == 0 {
				c.logger.Debug("Still waiting for LeagueService client to be ready", zap.Int("attempts", attempts))
			}

		}
	}
}

func (c *Connection) IsClientInitialized() bool {
	if c.Client == nil {
		return false
	}

	// Create a context with short timeout for the test request
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Test the connection with a lightweight endpoint
	resp, err := c.Client.R().
		SetContext(ctx).
		Get("/lol-summoner/v1/current-summoner")
		// If we get any error (including TLS handshake timeout), connection is not valid
	if err != nil {
		return false
	}

	// Check for valid HTTP status code
	statusOK := resp.StatusCode() >= 200 && resp.StatusCode() < 300
	return statusOK
}
