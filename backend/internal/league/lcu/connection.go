package lcu

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"net/url" // For more specific error checking
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/process"
	"go.uber.org/zap"
)

type Connection struct {
	// client is now lowercase to encourage using GetClient()
	// It's protected by the mutex.
	client  *resty.Client
	logger  *logger.Logger
	ctx     context.Context
	process *process.Process

	// mu protects access to 'client' and 'lastInitErr'
	// for both reads and writes after the initial setup.
	mu          sync.Mutex
	lastInitErr error // Stores the error from the last initialization attempt

	// initOnce ensures the *first* attempt to get credentials and
	// set up the client happens only once automatically on first GetClient call.
	// Subsequent re-initializations will be explicit or triggered.
	initOnce sync.Once
}

func NewConnection(logger *logger.Logger, process *process.Process) *Connection {
	return &Connection{
		process: process,
		logger:  logger,
		ctx:     context.Background(),
	}
}

// performInitialization fetches credentials and creates/updates the resty client.
// This is the core logic for setting up the client.
// It should be called with the mutex (c.mu) HELD.
func (c *Connection) performInitialization() error {
	c.logger.Debug("Attempting to perform LCU client initialization/re-initialization...")
	port, token, _, err := c.GetLeagueCredentials()
	if err != nil {
		c.logger.Error("LCU GetLeagueCredentials failed", zap.Error(err))
		// Don't nil out c.client here, an old client might still be better than none if this is a temp error
		return fmt.Errorf("failed to get league credentials: %w", err)
	}
	encodedAuth := base64.StdEncoding.EncodeToString([]byte("riot:" + token))

	newClient := resty.New().
		SetBaseURL(fmt.Sprintf("https://127.0.0.1:%s", port)).
		SetHeader("Accept", "application/json").
		SetHeader("Authorization", "Basic "+encodedAuth).
		SetTimeout(10 * time.Second) // Sensible default timeout

	newClient.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})

	// Optional: A quick ping to ensure the new client is functional before fully committing.
	// This helps prevent replacing a potentially working old client with a new one that's immediately broken.
	// _, testErr := newClient.R().SetTimeout(3 * time.Second).Get("/lol-settings/v1/local/lol.gameplay") // A very lightweight endpoint
	// if testErr != nil {
	// 	c.logger.Error("Test request with newly initialized LCU client failed", zap.Error(testErr), zap.String("port", port))
	// 	return fmt.Errorf("test request failed with new LCU client: %w", testErr)
	// }

	c.client = newClient
	c.lastInitErr = nil // Clear any previous error on successful initialization
	c.logger.Info("LCU connection client (re)initialized successfully.", zap.String("port", port))
	return nil
}

// GetClient provides access to the LCU client.
// It will attempt to initialize the client on the first call.
// If subsequent calls find the client is nil (e.g., after a failed re-init),
// it can attempt to re-initialize.
func (c *Connection) GetClient() (*resty.Client, error) {
	// Ensure the first initialization attempt happens only once.
	c.initOnce.Do(func() {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.lastInitErr = c.performInitialization()
	})

	c.mu.Lock()
	defer c.mu.Unlock()

	// If there was an error during the last initialization (or the first one via initOnce)
	if c.lastInitErr != nil {
		// Optionally, you could try one more time here if you suspect a transient issue,
		// but be careful about repeated failures.
		// c.logger.Warn("Returning client with last known error, attempting one more re-init", zap.Error(c.lastInitErr))
		// if reInitErr := c.performInitialization(); reInitErr != nil {
		//    c.lastInitErr = reInitErr // Update the error
		// }
		return nil, c.lastInitErr
	}

	// If client is nil even without an error (should be rare after initOnce), try to init.
	if c.client == nil {
		c.logger.Warn("LCU client is nil in GetClient despite no error, attempting initialization.")
		if err := c.performInitialization(); err != nil {
			c.lastInitErr = err // Store the new error
			return nil, c.lastInitErr
		}
		// If still nil, something is very wrong.
		if c.client == nil {
			return nil, errors.New("LCU client remains nil after explicit re-initialization attempt")
		}
	}

	return c.client, nil
}

// ForceReinitialize explicitly tells the connection to re-fetch credentials
// and set up a new client. This is useful if you detect the LCU has restarted.
func (c *Connection) ForceReinitialize() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.logger.Info("ForceReinitialize called for LCU connection.")
	// Clear the initOnce so that if GetClient is called and fails, it can try again.
	// This is a bit of a reset. More robustly, just call performInitialization.
	// c.initOnce = sync.Once{} // This would allow initOnce.Do to run again, but performInitialization is better.
	return c.performInitialization()
}

// Initialize is a convenience wrapper to attempt initialization.
func (c *Connection) Initialize() error {
	// This will trigger initOnce.Do if it hasn't run, or use existing client/error.
	// To ensure it tries to *actually* initialize if already attempted and failed,
	// it might be better to call ForceReinitialize or a more nuanced internal method.
	// For now, let GetClient handle the logic.
	_, err := c.GetClient()
	return err
}

// IsClientInitialized checks if the current client is responsive.
func (c *Connection) IsClientInitialized() bool {
	c.mu.Lock()
	// Get a snapshot of the client and error under lock
	currentClient := c.client
	currentErr := c.lastInitErr
	c.mu.Unlock()

	if currentErr != nil {
		c.logger.Debug("IsClientInitialized: false due to stored initialization error", zap.Error(currentErr))
		return false
	}
	if currentClient == nil {
		c.logger.Debug("IsClientInitialized: false because client is nil")
		// This implies initOnce hasn't run or performInitialization failed silently (which it shouldn't)
		return false
	}

	// Perform a lightweight check
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	type Response struct {
		Ready bool `json:"ready"`
	}
	var response Response
	// Use the snapshot of the client
	resp, err := currentClient.R().
		SetContext(ctx).SetResult(&response).
		Get("/lol-summoner/v1/status") // A very lightweight, stable endpoint
	if err != nil {
		// Log specific errors that might indicate a stale connection (port changed, client closed)
		var urlErr *url.Error
		if errors.As(err, &urlErr) {
			if urlErr.Timeout() {
				c.logger.Warn("IsClientInitialized: LCU client ping timed out", zap.Error(err))
			} else if strings.Contains(urlErr.Err.Error(), "connection refused") {
				c.logger.Warn("IsClientInitialized: LCU client ping connection refused (likely stale)", zap.Error(err))
			} else {
				c.logger.Warn("IsClientInitialized: LCU client ping failed with network error", zap.Error(err))
			}
		} else {
			c.logger.Warn("IsClientInitialized: LCU client ping failed", zap.Error(err))
		}
		return false
	}

	if !resp.IsSuccess() {
		c.logger.Warn("IsClientInitialized: LCU client ping returned non-success status",
			zap.Int("status_code", resp.StatusCode()),
			zap.String("body", resp.String()))
		return false
	}

	if response.Ready {
		return true
	}
	return true
}

// GetLeagueCredentials remains largely the same.
func (c *Connection) GetLeagueCredentials() (port, token, pid string, err error) {
	// ... (implementation as before)
	output, err := c.process.GetCommandLineByName("LeagueClientUx.exe")
	if err != nil {
		return "", "", "", fmt.Errorf("failed to get command line for LeagueClientUx.exe: %w", err)
	}

	portRegex := regexp.MustCompile(`--app-port=(\d+)`)
	tokenRegex := regexp.MustCompile(`--remoting-auth-token=([\w-]+)`)
	pidRegex := regexp.MustCompile(`--app-pid=(\d+)`) // Added PID extraction

	portMatches := portRegex.FindStringSubmatch(string(output))
	tokenMatches := tokenRegex.FindStringSubmatch(string(output))
	pidMatches := pidRegex.FindStringSubmatch(string(output)) // Added PID extraction

	if len(portMatches) < 2 || len(tokenMatches) < 2 || len(pidMatches) < 2 {
		return "", "", "", errors.New("league client not found or missing required parameters (port/token/pid)")
	}
	port = portMatches[1]
	token = tokenMatches[1]
	pid = pidMatches[1] // Added PID extraction

	if port == "" || token == "" || pid == "" { // Added PID check
		return "", "", "", errors.New("league client parameters (port/token/pid) are empty")
	}
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
