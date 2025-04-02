package riot

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
	cmdUtils "github.com/hex-boost/hex-nexus-app/backend/cmd"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/inkeliz/gowebview"
	"github.com/mitchellh/go-ps"
	"go.uber.org/zap"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

// RiotClient provides methods for interacting with Riot authentication services
type RiotClient struct {
	client           *resty.Client
	logger           *utils.Logger
	hcaptchaResponse chan string
	ctx              context.Context
	captchaData      string
	webview          gowebview.WebView
}

// NewRiotClient creates a new Riot client for authentication
func NewRiotClient(logger *utils.Logger) *RiotClient {
	return &RiotClient{
		client:           nil, // Will be initialized during authentication
		logger:           logger,
		ctx:              context.Background(),
		hcaptchaResponse: make(chan string),
	}
}
func (rc *RiotClient) ResetRestyClient() {
	rc.client = nil
}

// ForceCloseAllClients closes all Riot-related processes
func (rc *RiotClient) ForceCloseAllClients() error {
	rc.logger.Info("Forcing close of all Riot clients")

	riotProcesses := []string{
		"RiotClientCrashHandler.exe",
		"RiotClientServices.exe",
		"RiotClientUx.exe",
		"RiotClientUxRender.exe",
		"Riot Client.exe",
		"LeagueCrashHandler.exe",
		"LeagueCrashHandler64.exe",
		"LeagueClient.exe",
		"LeagueClientUx.exe",
		"LeagueClientUxRender.exe",
		"VALORANT.exe",
		"VALORANT-Win64-Shipping.exe",
	}

	processes, err := ps.Processes()
	if err != nil {
		rc.logger.Error("Failed to list processes", zap.Error(err))
		return fmt.Errorf("failed to list processes: %w", err)
	}

	for _, process := range processes {
		processName := process.Executable()
		for _, riotProcess := range riotProcesses {
			if processName == riotProcess {
				cmd := exec.Command("taskkill", "/F", "/PID", fmt.Sprintf("%d", process.Pid()))
				cmd = cmdUtils.HideConsoleWindow(cmd)
				if err := cmd.Run(); err != nil {
					rc.logger.Error("Failed to kill process",
						zap.String("process", processName),
						zap.Int("pid", process.Pid()),
						zap.Error(err))
				} else {
					rc.logger.Info("Successfully killed process",
						zap.String("process", processName),
						zap.Int("pid", process.Pid()))
				}
				break
			}
		}
	}
	rc.ResetRestyClient()
	return nil
}
func (rc *RiotClient) getProcess() (pid int, err error) {
	processes, err := ps.Processes()
	if err != nil {
		return 0, fmt.Errorf("failed to list processes: %w", err)
	}
	riotProcessNames := []string{
		"RiotClient.exe",
		"RiotClient",
		"Riot Client",
		"Riot Client.exe",
	}
	// Find the League RiotClient or Riot RiotClient process ID
	for _, process := range processes {
		exe := process.Executable()
		for _, name := range riotProcessNames {
			if exe == name {
				return process.Pid(), nil
			}
		}
	}
	return 0, errors.New("unable to find League RiotClient or Riot RiotClient process")
}

func (rc *RiotClient) getCredentials(riotClientPid int) (port string, authToken string, err error) {
	var cmdLine string

	cmd := exec.Command("wmic", "process", "where", fmt.Sprintf("ProcessId=%d", riotClientPid), "get", "CommandLine", "/format:list")
	cmd = cmdUtils.HideConsoleWindow(cmd)
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
func (rc *RiotClient) LoginWithCaptcha(username, password, captchaToken string) (string, error) {
	rc.logger.Info("Authenticating with captcha token", zap.String("token_length", fmt.Sprintf("%d", len(captchaToken))))

	authPayload := types.Authentication{
		Campaign: nil,
		Language: "pt_BR",
		Remember: false,
		RiotIdentity: types.RiotIdentity{
			Captcha:  fmt.Sprintf("hcaptcha %s", captchaToken),
			Password: password,
			State:    nil,
			Username: username,
		},
		Type: "auth",
	}

	var loginResult types.RiotIdentityResponse
	_, err := rc.client.R().
		SetBody(authPayload).
		SetResult(&loginResult).
		Put("/rso-authenticator/v1/authentication")
	if err != nil {
		rc.logger.Error("Authentication with captcha failed", zap.Error(err))
		return "", fmt.Errorf("authentication request failed: %w", err)
	}

	if loginResult.Type == "multifactor" {
		rc.logger.Info("multifactor required for authentication")
		return "", errors.New("captcha required")
	}
	if loginResult.Type == "success" {
		rc.logger.Info("Authentication with captcha successful")
		err := rc.completeAuthentication(loginResult.Success.LoginToken)
		if err != nil {
			return "", err
		}
		_, err = rc.getAuthorization()
		if err != nil {
			return "", err
		}
		return "", nil
	}
	if loginResult.Error == "captcha_not_allowed" {
		return loginResult.Captcha.Hcaptcha.Data, errors.New(loginResult.Error)
	}

	rc.logger.Error("Authentication with captcha failed", zap.Any("response", loginResult))
	return "", errors.New("authentication with captcha failed")
}

func (rc *RiotClient) Launch() error {
	rc.ResetRestyClient()
	rc.logger.Info("Attempting to launch Riot client")
	var riotClientPath string
	programData := os.Getenv("PROGRAMDATA")
	if programData == "" {
		programData = "C:\\ProgramData"
	}
	riotClientPath = filepath.Join(programData, "Riot Games", "RiotClientInstalls.json")
	fileContent, err := os.ReadFile(riotClientPath)
	if err != nil {
		rc.logger.Error("Failed to read Riot client installs file", zap.Error(err))
		return fmt.Errorf("failed to read Riot client installs file: %w", err)
	}
	var clientInstalls struct {
		RcDefault string `json:"rc_default"`
	}
	if err := json.Unmarshal(fileContent, &clientInstalls); err != nil {
		rc.logger.Error("Failed to parse Riot client installs file", zap.Error(err))
		return fmt.Errorf("failed to parse Riot client installs file: %w", err)
	}
	if clientInstalls.RcDefault == "" {
		return errors.New("could not find Riot client path in installs file")
	}
	args := []string{"--launch-product=league_of_legends", "--launch-patchline=live"}
	rc.logger.Info("Launching Riot client",
		zap.String("path", clientInstalls.RcDefault),
		zap.Strings("args", args))
	cmd := exec.Command(clientInstalls.RcDefault, args...)
	rc.logger.Info("Starting Riot client process")
	cmd = cmdUtils.HideConsoleWindow(cmd)
	if err := cmd.Start(); err != nil {
		rc.logger.Error("Failed to start Riot client", zap.Error(err))
		return fmt.Errorf("failed to start Riot client: %w", err)
	}
	return nil
}

func (rc *RiotClient) InitializeRestyClient() error {
	riotClientPid, err := rc.getProcess()
	if err != nil {
		rc.logger.Error("Failed to get Riot client pid", zap.Error(err))
		return err
	}
	port, authToken, err := rc.getCredentials(riotClientPid)
	if err != nil {
		rc.logger.Error("Failed to get client credentials", zap.Error(err))
		return err
	}
	rc.logger.Info("Credentials obtained", zap.String("port", port), zap.Any("authToken", authToken))
	client := resty.New().
		SetBaseURL("https://127.0.0.1:"+port).
		SetHeader("Authorization", "Basic "+authToken)
	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	rc.client = client
	return nil
}
func (rc *RiotClient) InitializeCaptchaHandling() error {
	// Inicializa o cliente
	if err := rc.InitializeRestyClient(); err != nil {
		return err
	}
	if err := rc.handleCaptcha(); err != nil {
		return err
	}
	rc.startCaptchaServer()
	return nil
}

func (rc *RiotClient) completeAuthentication(loginToken string) error {
	var loginTokenResp types.LoginTokenResponse
	putResp, err := rc.client.R().
		SetBody(types.LoginTokenRequest{
			AuthenticationType: "RiotAuth",
			CodeVerifier:       "",
			LoginToken:         loginToken,
			PersistLogin:       false,
		}).
		SetResult(&loginTokenResp).
		Put("/rso-auth/v1/session/login-token")
	if err != nil {
		rc.logger.Error("Error sending login token", zap.Error(err))
		return err
	}
	if putResp.IsError() {
		rc.logger.Error("Login token response error", zap.Any("response", putResp))
		return errors.New("login token request failed")
	}
	if loginTokenResp.Type != "authenticated" {
		rc.logger.Error("Authentication failed", zap.String("type", loginTokenResp.Type))
		return errors.New("authentication not successful")
	}
	rc.logger.Info("Successfully authenticated with login token")
	return nil
}

// GetAuthorization gets the authorization token
func (rc *RiotClient) getAuthorization() (map[string]interface{}, error) {
	var authResult map[string]interface{}
	postResp, err := rc.client.R().
		SetBody(getAuthorizationRequestPayload()).
		SetResult(&authResult).
		Post("/rso-auth/v2/authorizations/riot-client")
	if err != nil {
		rc.logger.Error("Authorization request failed", zap.Error(err))
		return nil, err
	}

	if postResp.IsError() {
		rc.logger.Error("Authorization response error", zap.Any("response", postResp))
		return nil, errors.New("authorization request failed")
	}

	rc.logger.Info("Authorization successful")
	return authResult, nil
}

//func (c *RiotClient) Authenticate(username string, password string) error {
//	// Initialize the client
//	if err := c.initialize(); err != nil {
//		return err
//	}
//	if err := c.waitForReadyState(20 * time.Second); err != nil {
//		return err
//	}
//	err := c.handleCaptcha()
//	if err != nil {
//		return err
//	}
//
//	c.logger.Info("Captcha server started")
//	c.startCaptchaServer()
//
//	webview, err := c.GetWebView()
//	if err != nil {
//		return errors.New("failed to open captcha webview")
//	}
//	go func() {
//		c.logger.Info("webview start opening for user to complete captcha")
//		webview.Run()
//	}()
//	captchaToken := <-c.hcaptchaResponse
//	c.logger.Info("Captcha response received")
//
//	webview.Terminate()
//	webview.Destroy()
//
//	loginToken, err := c.LoginWithCaptcha(username, password, captchaToken)
//	if err != nil {
//		return err
//	}
//	c.logger.Info("Login with captcha succeeded")
//
//	// Complete the authentication flow
//	if err := c.completeAuthentication(loginToken); err != nil {
//		return err
//	}
//
//	// Get authorization
//	_, err = c.getAuthorization()
//	return err
//}
