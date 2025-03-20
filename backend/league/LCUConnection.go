package league

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"go.uber.org/zap"
	"os/exec"
	"regexp"
	"runtime"
)

// LCUConnection handles the connection to the League of Legends client
type LCUConnection struct {
	client *resty.Client
	logger *utils.Logger
	ctx    context.Context
	port   string
	token  string
	pid    string
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
func (c *LCUConnection) InitializeConnection(username string) error {
	c.logger.Info("Initializing League client connection", zap.String("username", username))

	// Find League client process and get connection details
	if err := c.findLeagueClient(); err != nil {
		return err
	}

	// Initialize HTTP client
	client := resty.New().
		SetBaseURL(fmt.Sprintf("https://127.0.0.1:%s", c.port)).
		SetHeader("Accept", "application/json").
		SetBasicAuth("riot", c.token)

	// League client uses self-signed cert
	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})

	c.client = client
	return nil
}

// findLeagueClient locates the League client process and extracts connection details
func (c *LCUConnection) findLeagueClient() error {
	var cmd *exec.Cmd
	var output []byte
	var err error

	c.logger.Debug("Looking for League client process")

	if runtime.GOOS == "windows" {
		cmd = exec.Command("wmic", "process", "where", "name='LeagueClientUx.exe'", "get", "commandline")
		output, err = cmd.Output()
	} else {
		cmd = exec.Command("ps", "-A", "-o", "command")
		output, err = cmd.Output()
	}

	if err != nil {
		return fmt.Errorf("failed to execute process command: %w", err)
	}

	// Extract port and auth token using regex
	portRegex := regexp.MustCompile(`--app-port=(\d+)`)
	tokenRegex := regexp.MustCompile(`--remoting-auth-token=([\w-]+)`)
	pidRegex := regexp.MustCompile(`--app-pid=(\d+)`)

	portMatches := portRegex.FindStringSubmatch(string(output))
	tokenMatches := tokenRegex.FindStringSubmatch(string(output))
	pidMatches := pidRegex.FindStringSubmatch(string(output))

	if len(portMatches) < 2 || len(tokenMatches) < 2 || len(pidMatches) < 2 {
		return errors.New("league client not found or missing required parameters")
	}

	c.port = portMatches[1]
	c.token = tokenMatches[1]
	c.pid = pidMatches[1]

	c.logger.Info("Found League client",
		zap.String("port", c.port),
		zap.String("pid", c.pid))

	return nil
}
