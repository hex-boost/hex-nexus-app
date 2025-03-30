package riot

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/inkeliz/gowebview"

	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/mitchellh/go-ps"
	"go.uber.org/zap"
)

// RiotClient provides methods for interacting with Riot authentication services
type Client struct {
	client           *resty.Client
	logger           *utils.Logger
	hcaptchaResponse chan string
	ctx              context.Context
	captchaData      string
}

// NewRiotClient creates a new Riot client for authentication
func NewRiotClient(logger *utils.Logger) *Client {
	return &Client{
		client:           nil, // Will be initialized during authentication
		logger:           logger,
		ctx:              context.Background(),
		hcaptchaResponse: make(chan string),
	}
}

func (c *Client) getRiotProcess() (pid int, err error) {
	processes, err := ps.Processes()
	if err != nil {
		return 0, fmt.Errorf("failed to list processes: %w", err)
	}

	// Find the League Client or Riot Client process ID
	for _, process := range processes {
		exe := process.Executable()
		if exe == "LeagueClient.exe" || exe == "LeagueClientUx.exe" || exe == "Riot Client.exe" {
			return process.Pid(), nil
		}
	}

	return 0, errors.New("unable to find League Client or Riot Client process")
}

func (c *Client) getClientCredentials(riotClientPid int) (port string, authToken string, err error) {
	var cmdLine string

	cmd := exec.Command("wmic", "process", "where", fmt.Sprintf("ProcessId=%d", riotClientPid), "get", "CommandLine", "/format:list")
	output, err := cmd.Output()
	if err != nil {
		return "", "", fmt.Errorf("failed to get command line: %w", err)
	}
	cmdLine = string(output)
	cmdLineParts := strings.SplitN(cmdLine, "=", 2)
	if len(cmdLineParts) > 1 {
		cmdLine = strings.TrimSpace(cmdLineParts[1])
	}
	// Parse command line for port and auth token
	portRegex := regexp.MustCompile(`--app-port=(\d+)`)
	authRegex := regexp.MustCompile(`--remoting-auth-token=([\w-]+)`)

	portMatch := portRegex.FindStringSubmatch(cmdLine)
	authMatch := authRegex.FindStringSubmatch(cmdLine)
	if len(portMatch) > 1 && len(authMatch) > 1 {
		token := authMatch[1]
		authHeader := base64.StdEncoding.EncodeToString([]byte("riot:" + token))
		return portMatch[1], authHeader, nil
	}
	return "", "", fmt.Errorf("unable to extract credentials from process %s (PID: %d)", riotClientPid)
}

// LoginWithCaptcha authenticates with a completed captcha token
func (c *Client) loginWithCaptcha(username, password, captchaToken string) (string, error) {
	c.logger.Info("Authenticating with captcha token", zap.String("token_length", fmt.Sprintf("%d", len(captchaToken))))

	authPayload := types.Authentication{
		Campaign: nil,
		Language: "pt_BR",
		Remember: true,
		RiotIdentity: types.RiotIdentity{
			Captcha:  fmt.Sprintf("hcaptcha %s", captchaToken),
			Password: password,
			State:    nil,
			Username: username,
		},
		Type: "auth",
	}

	var loginResult types.RiotIdentityResponse
	_, err := c.client.R().
		SetBody(authPayload).
		SetResult(&loginResult).
		Put("/rso-authenticator/v1/authentication")
	if err != nil {
		c.logger.Error("Authentication with captcha failed", zap.Error(err))
		return "", fmt.Errorf("authentication request failed: %w", err)
	}

	if loginResult.Type == "multifactor" {
		c.logger.Info("multifactor required for authentication")
		return "", errors.New("captcha required")
	}
	if loginResult.Type == "success" {
		c.logger.Info("Authentication with captcha successful")
		return loginResult.Success.LoginToken, nil
	}

	c.logger.Error("Authentication with captcha failed", zap.Any("response", loginResult))
	return "", errors.New("authentication with captcha failed")
}

// getCaptchaData retrieves captcha data from the Riot authentication service
func (c *Client) getCaptchaData() (string, error) {
	var getCurrentAuthResult types.RiotIdentityResponse

	_, err := c.client.R().SetResult(&getCurrentAuthResult).Get("/rso-authenticator/v1/authentication")
	if err != nil {
		return "", err
	}
	if getCurrentAuthResult.Type == "auth" && getCurrentAuthResult.Captcha.Hcaptcha.Data != "" {
		return getCurrentAuthResult.Captcha.Hcaptcha.Data, nil
	}

	var startAuthResult types.RiotIdentityResponse
	startAuthRes, err := c.client.R().
		SetBody(getRiotIdentityStartPayload()).
		SetResult(&startAuthResult).
		Post("/rso-authenticator/v1/authentication/riot-identity/start")
	if err != nil {
		c.logger.Error("Error in authentication start request", zap.Error(err))
		return "", err
	}

	if startAuthRes.IsError() {
		var errorResponse types.ErrorResponse
		if err := json.Unmarshal(startAuthRes.Body(), &errorResponse); err != nil {
			c.logger.Error("Failed to parse error response", zap.Error(err))
		}
		c.logger.Error("Authentication failed", zap.String("message", errorResponse.Message))
		return "", errors.New(errorResponse.Message)
	}

	if startAuthResult.Captcha.Hcaptcha.Data == "" {
		return "", errors.New("no captcha data")
	}
	return startAuthResult.Captcha.Hcaptcha.Data, nil
}

// HandleCaptcha gets captcha data and waits for token submission
func (c *Client) handleCaptcha() error {
	c.logger.Info("Starting captcha handling")

	// Get captcha data
	captchaData, err := c.getCaptchaData()
	if err != nil {
		c.logger.Error("Failed to get captcha data", zap.Error(err))
		return err
	}

	c.captchaData = captchaData

	// Return captcha data so it can be rendered
	return nil
}

func (c *Client) waitForClientReady(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	checkInterval := 100 * time.Millisecond

	for time.Now().Before(deadline) {
		pid, err := c.getRiotProcess()
		if err == nil {
			// Found the process, now try to get credentials to verify it's ready
			port, authToken, err := c.getClientCredentials(pid)
			if err == nil && port != "" && authToken != "" {
				c.logger.Info("Riot client is running and ready",
					zap.Int("pid", pid),
					zap.String("port", port))
				return nil
			}
			// Process exists but not ready yet
			c.logger.Debug("Riot client process found but not fully initialized")
		}
		time.Sleep(checkInterval)
	}

	return errors.New("timeout waiting for Riot client to initialize")
}

// launchRiotClient finds and launches the Riot client
func (c *Client) launchRiotClient() error {
	c.logger.Info("Attempting to launch Riot client")

	// Determine the path to RiotClientInstalls.json based on OS
	var riotClientPath string
	programData := os.Getenv("PROGRAMDATA")
	if programData == "" {
		programData = "C:\\ProgramData"
	}
	riotClientPath = filepath.Join(programData, "Riot Games", "RiotClientInstalls.json")

	// Read the client path from the JSON file
	fileContent, err := os.ReadFile(riotClientPath)
	if err != nil {
		c.logger.Error("Failed to read Riot client installs file", zap.Error(err))
		return fmt.Errorf("failed to read Riot client installs file: %w", err)
	}

	var clientInstalls struct {
		RcDefault string `json:"rc_default"`
	}

	if err := json.Unmarshal(fileContent, &clientInstalls); err != nil {
		c.logger.Error("Failed to parse Riot client installs file", zap.Error(err))
		return fmt.Errorf("failed to parse Riot client installs file: %w", err)
	}

	if clientInstalls.RcDefault == "" {
		return errors.New("could not find Riot client path in installs file")
	}

	// Default region and arguments

	// Add appropriate arguments based on client type
	// Add specific arguments regardless of client type
	args := []string{"--launch-product=league_of_legends", "--launch-patchline=live"}

	c.logger.Info("Launching Riot client",
		zap.String("path", clientInstalls.RcDefault),
		zap.Strings("args", args))

	// Launch the process
	cmd := exec.Command(clientInstalls.RcDefault, args...)
	c.logger.Info("Starting Riot client process")
	if err := cmd.Start(); err != nil {
		c.logger.Error("Failed to start Riot client", zap.Error(err))
		return fmt.Errorf("failed to start Riot client: %w", err)
	}
	return nil
}

func (c *Client) IsRunning() bool {
	processes, err := ps.Processes()
	if err != nil {
		c.logger.Error("Failed to list processes", zap.Error(err))
		return false
	}

	// Find the League Client or Riot Client process
	for _, process := range processes {
		exe := process.Executable()
		if exe == "LeagueClient.exe" || exe == "LeagueClientUx.exe" || exe == "Riot Client.exe" {
			return true
		}
	}

	return false
}

// InitializeClient sets up the client with connection to the League Client
func (c *Client) initializeClient() error {
	if !c.IsRunning() {
		c.logger.Info("Riot client not running, attempting to launch it")
		if err := c.launchRiotClient(); err != nil {
			return fmt.Errorf("failed to launch Riot client: %w", err)
		}
		err := c.waitForClientReady(30 * time.Second)
		if err != nil {
			c.logger.Error("Failed to wait for Riot client to be ready", zap.Error(err))
			return err
		}

	}

	riotClientPid, err := c.getRiotProcess()
	if err != nil {
		c.logger.Error("Failed to get Riot client pid", zap.Error(err))
		return err
	}
	port, authToken, err := c.getClientCredentials(riotClientPid)
	if err != nil {
		c.logger.Error("Failed to get client credentials", zap.Error(err))
		return err
	}

	c.logger.Info("Credentials obtained", zap.String("port", port), zap.Any("authToken", authToken))

	client := resty.New().
		SetBaseURL("https://127.0.0.1:"+port).
		SetHeader("Authorization", "Basic "+authToken)
	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})

	c.client = client
	return nil
}

// CompleteAuthentication completes the authentication flow with a login token
func (c *Client) completeAuthentication(loginToken string) error {
	var loginTokenResp types.LoginTokenResponse
	putResp, err := c.client.R().
		SetBody(types.LoginTokenRequest{
			AuthenticationType: "RiotAuth",
			CodeVerifier:       "",
			LoginToken:         loginToken,
			PersistLogin:       false,
		}).
		SetResult(&loginTokenResp).
		Put("/rso-auth/v1/session/login-token")
	if err != nil {
		c.logger.Error("Error sending login token", zap.Error(err))
		return err
	}

	if putResp.IsError() {
		c.logger.Error("Login token response error", zap.Any("response", putResp))
		return errors.New("login token request failed")
	}

	if loginTokenResp.Type != "authenticated" {
		c.logger.Error("Authentication failed", zap.String("type", loginTokenResp.Type))
		return errors.New("authentication not successful")
	}

	c.logger.Info("Successfully authenticated with login token")
	return nil
}

// GetAuthorization gets the authorization token
func (c *Client) getAuthorization() (map[string]interface{}, error) {
	var authResult map[string]interface{}
	postResp, err := c.client.R().
		SetBody(getAuthorizationRequestPayload()).
		SetResult(&authResult).
		Post("/rso-auth/v2/authorizations/riot-client")
	if err != nil {
		c.logger.Error("Authorization request failed", zap.Error(err))
		return nil, err
	}

	if postResp.IsError() {
		c.logger.Error("Authorization response error", zap.Any("response", postResp))
		return nil, errors.New("authorization request failed")
	}

	c.logger.Info("Authorization successful")
	return authResult, nil
}

func (c *Client) getWebView() (gowebview.WebView, error) {
	webview, err := gowebview.New(&gowebview.Config{URL: "http://127.0.0.1:6969/index.html"})
	if err != nil {
		return nil, err
	}

	return webview, nil
}

// waitForReadyState verifica repetidamente o estado de prontidão da API
func (c *Client) waitForReadyState(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	interval := 200 * time.Millisecond

	c.logger.Info("Verificando disponibilidade do serviço de autenticação", zap.Duration("timeout", timeout))

	for time.Now().Before(deadline) {
		resp, err := c.client.R().Get("/rso-auth/configuration/v3/ready-state")

		if err == nil && resp.StatusCode() == 200 {
			c.logger.Info("Serviço de autenticação está pronto")
			return nil
		}

		// Registra o status da tentativa
		status := "erro"
		if err != nil {
			status = err.Error()
		} else {
			status = fmt.Sprintf("status %d", resp.StatusCode())
		}
		c.logger.Debug("Aguardando serviço ficar pronto", zap.String("status", status))

		// Aguarda antes da próxima tentativa
		time.Sleep(interval)
	}

	return errors.New("timeout ao aguardar serviço de autenticação ficar pronto")
}

// AuthenticateWithCaptcha handles the complete captcha authentication flow
func (c *Client) Authenticate(username string, password string) error {
	// Initialize the client
	if err := c.initializeClient(); err != nil {
		return err
	}
	if err := c.waitForReadyState(20 * time.Second); err != nil {
		return err
	}
	err := c.handleCaptcha()
	if err != nil {
		return err
	}

	c.logger.Info("Captcha server started")
	c.startCaptchaServer()

	webview, err := c.getWebView()
	if err != nil {
		return errors.New("failed to open captcha webview")
	}
	go func() {
		c.logger.Info("webview start opening for user to complete captcha")
		webview.Run()
	}()
	captchaToken := <-c.hcaptchaResponse
	c.logger.Info("Captcha response received")

	webview.Terminate()
	webview.Destroy()

	loginToken, err := c.loginWithCaptcha(username, password, captchaToken)
	if err != nil {
		return err
	}
	c.logger.Info("Login with captcha succeeded")

	// Complete the authentication flow
	if err := c.completeAuthentication(loginToken); err != nil {
		return err
	}

	// Get authorization
	_, err = c.getAuthorization()
	return err
}
