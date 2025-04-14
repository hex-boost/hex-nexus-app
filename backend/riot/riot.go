package riot

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
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

type RiotClient struct {
	client           *resty.Client
	logger           *utils.Logger
	captcha          *Captcha
	hcaptchaResponse chan string
	ctx              context.Context
	captchaData      string
	webview          gowebview.WebView
	utils            *utils.Utils
}

func NewRiotClient(logger *utils.Logger, captcha *Captcha) *RiotClient {
	return &RiotClient{
		utils:            utils.NewUtils(),
		client:           nil,
		logger:           logger,
		captcha:          captcha,
		ctx:              context.Background(),
		hcaptchaResponse: make(chan string),
	}
}
func (rc *RiotClient) ResetRestyClient() {
	rc.client = nil
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
	cmd = rc.utils.HideConsoleWindow(cmd)
	output, err := cmd.Output()
	if err != nil {
		return "", "", fmt.Errorf("failed to get command line: %w", err)
	}
	cmdLine = string(output)
	cmdLineParts := strings.SplitN(cmdLine, "=", 2)
	if len(cmdLineParts) > 1 {
		cmdLine = strings.TrimSpace(cmdLineParts[1])
	}

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

func (rc *RiotClient) LoginWithCaptcha(ctx context.Context, username, password, captchaToken string) (string, error) {
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
	req := rc.client.R().
		SetBody(authPayload).
		SetResult(&loginResult)

	// Create a channel to handle async response
	done := make(chan error, 1)

	// Execute request in goroutine to handle context cancellation
	go func() {
		var err error
		_, err = req.Put("/rso-authenticator/v1/authentication")
		done <- err
	}()

	// Wait for either context cancellation or request completion
	select {
	case <-ctx.Done():
		rc.logger.Error("Authentication timed out", zap.Error(ctx.Err()))
		return "", fmt.Errorf("authentication timed out: %w", ctx.Err())
	case err := <-done:
		if err != nil {
			rc.logger.Error("Authentication with captcha failed", zap.Error(err))
			return "", fmt.Errorf("authentication request failed: %w", err)
		}
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
	cmd = rc.utils.HideConsoleWindow(cmd)
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

	if err := rc.InitializeRestyClient(); err != nil {
		return err
	}
	rqdata, err := rc.getCaptchaData()
	if err != nil {
		return err
	}
	rc.captcha.setRqData(rqdata)
	if err := rc.captcha.startServer(); err != nil {
		return err
	}

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

func (rc *RiotClient) Logout() error {
	res, err := rc.client.R().Delete("/rso-authenticator/v1/authentication")
	if err != nil {
		rc.logger.Error("Error logging out", zap.Error(err))
		return err
	}
	if res.IsError() {
		rc.logger.Error("Error logging out", zap.String("response", string(res.Body())))
		return err
	}
	return err

}
func (rc *RiotClient) GetAuthenticationState() (*types.RiotIdentityResponse, error) {
	if rc.client == nil {
		return nil, errors.New("client is not initialized")
	}
	var getCurrentAuthResult types.RiotIdentityResponse
	result, err := rc.client.R().SetResult(&getCurrentAuthResult).Get("/rso-authenticator/v1/authentication")

	if err != nil {
		rc.logger.Error("Authentication failed", zap.Error(err))
		return nil, err
	}

	if result.IsError() {
		rc.logger.Error("Authentication failed",
			zap.String("message", string(result.Body())),
			zap.Int("status_code", result.StatusCode()))

		// Parse error response to check for CREDENTIALS_INVALID
		var errorResponse types.ErrorResponse
		if err := json.Unmarshal(result.Body(), &errorResponse); err == nil {
			if errorResponse.ErrorCode == "CREDENTIALS_INVALID" {
				rc.logger.Info("Detected invalid credentials, attempting to re-initialize client")
				if err := rc.InitializeRestyClient(); err != nil {
					return nil, fmt.Errorf("failed to re-initialize client: %w", err)
				}
				return nil, errors.New("client re-initialized after invalid credentials")
			}
		}

		return nil, fmt.Errorf("authentication failed with status code %d: %s",
			result.StatusCode(), string(result.Body()))
	}
	return &getCurrentAuthResult, nil
}
func (rc *RiotClient) IsAuthStateValid() error {
	currentAuth, err := rc.GetAuthenticationState()
	if err != nil {
		rc.logger.Error("Failed to get authentication state", zap.Error(err))
		return err
	}
	if currentAuth.Type == "auth" {
		return nil
	}
	if currentAuth.Type == "error" && currentAuth.Captcha.Hcaptcha.Data != "" {
		return nil
	}

	return nil
}

func (rc *RiotClient) getCaptchaData() (string, error) {
	err := rc.IsAuthStateValid()
	if err != nil {
		rc.logger.Error("Invalid authentication state", zap.Error(err))
		return "", err
	}
	_, err = rc.client.R().
		Delete("/rso-authenticator/v1/authentication")
	if err != nil {
		rc.logger.Error("Error in authentication delete session", zap.Error(err))
		return "", err
	}
	var startAuthResult types.RiotIdentityResponse
	startAuthRes, err := rc.client.R().
		SetBody(getRiotIdentityStartPayload()).
		SetResult(&startAuthResult).
		Post("/rso-authenticator/v1/authentication/riot-identity/start")
	if err != nil {
		rc.logger.Error("Error in authentication start request", zap.Error(err))
		return "", err
	}
	if startAuthRes.IsError() {
		var errorResponse types.ErrorResponse
		if err := json.Unmarshal(startAuthRes.Body(), &errorResponse); err != nil {
			rc.logger.Error("Failed to parse error response", zap.Error(err))
		}
		rc.logger.Error("Authentication failed", zap.String("message", errorResponse.Message))
		return "", errors.New(errorResponse.Message)
	}
	if startAuthResult.Captcha.Hcaptcha.Data == "" {
		return "", errors.New("no captcha data")
	}
	return startAuthResult.Captcha.Hcaptcha.Data, nil
}
