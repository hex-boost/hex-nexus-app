package riot

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/sysquery"
	"github.com/hex-boost/hex-nexus-app/backend/riot/captcha"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/mitchellh/go-ps"
	"go.uber.org/zap"
)

type Service struct {
	client   *resty.Client
	logger   *logger.Logger
	captcha  *captcha.Captcha
	ctx      context.Context
	cmd      *command.Command
	sysquery *sysquery.SysQuery
}

func NewService(logger *logger.Logger, captcha *captcha.Captcha) *Service {
	return &Service{
		client:   nil,
		cmd:      command.New(),
		sysquery: sysquery.New(),
		logger:   logger,
		captcha:  captcha,
		ctx:      context.Background(),
	}
}

func (s *Service) ResetRestyClient() {
	s.client = nil
}

func (s *Service) getProcess() (pid int, err error) {
	processes, err := ps.Processes()
	if err != nil {
		return 0, fmt.Errorf("failed to list processes: %w", err)
	}
	riotProcessNames := []string{
		"Service.exe",
		"Service",
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
	return 0, errors.New("unable to find League Service or Riot Service process")
}

func (s *Service) getCredentials(riotClientPid int) (port string, authToken string, err error) {
	var cmdLine string

	cmdlineOutput, err := s.sysquery.GetProcessCommandLineByPID(uint32(riotClientPid))
	if err != nil {
		return "", "", fmt.Errorf("failed to get command line: %w", err)
	}
	cmdLine = cmdlineOutput

	// Keep the existing parsing logic
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
	return "", "", fmt.Errorf("unable to extract credentials from process (PID: %d)", riotClientPid)
}

func (s *Service) LoginWithCaptcha(ctx context.Context, username, password, captchaToken string) (string, error) {
	s.logger.Info("Authenticating with captcha token", zap.String("token_length", fmt.Sprintf("%d", len(captchaToken))))

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
	req := s.client.R().
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
		s.logger.Error("Authentication timed out", zap.Error(ctx.Err()))
		return "", fmt.Errorf("authentication timed out: %w", ctx.Err())
	case err := <-done:
		if err != nil {
			s.logger.Error("Authentication with captcha failed", zap.Error(err))
			return "", fmt.Errorf("authentication request failed: %w", err)
		}
	}

	if loginResult.Type == "multifactor" {
		s.logger.Info("multifactor required for authentication")
		return "", errors.New("captcha required")
	}
	if loginResult.Type == "success" {
		s.logger.Info("Authentication with captcha successful")
		err := s.completeAuthentication(loginResult.Success.LoginToken)
		if err != nil {
			return "", err
		}
		_, err = s.getAuthorization()
		if err != nil {
			return "", err
		}
		return "", nil
	}
	if loginResult.Error == "captcha_not_allowed" {
		return loginResult.Captcha.Hcaptcha.Data, errors.New(loginResult.Error)
	}

	s.logger.Error("Authentication with captcha failed", zap.Any("response", loginResult))
	return "", errors.New("authentication with captcha failed")
}
func (s *Service) Launch() error {
	s.ResetRestyClient()
	s.logger.Info("Attempting to launch Riot client")
	var riotClientPath string
	programData := os.Getenv("PROGRAMDATA")
	if programData == "" {
		programData = "C:\\ProgramData"
	}
	riotClientPath = filepath.Join(programData, "Riot Games", "RiotClientInstalls.json")
	fileContent, err := os.ReadFile(riotClientPath)
	if err != nil {
		s.logger.Error("Failed to read Riot client installs file", zap.Error(err))
		return fmt.Errorf("failed to read Riot client installs file: %w", err)
	}
	var clientInstalls struct {
		RcDefault string `json:"rc_default"`
	}
	if err := json.Unmarshal(fileContent, &clientInstalls); err != nil {
		s.logger.Error("Failed to parse Riot client installs file", zap.Error(err))
		return fmt.Errorf("failed to parse Riot client installs file: %w", err)
	}
	if clientInstalls.RcDefault == "" {
		return errors.New("could not find Riot client path in installs file")
	}
	args := []string{"--launch-product=league_of_legends", "--launch-patchline=live"}
	s.logger.Info("Launching Riot client",
		zap.String("path", clientInstalls.RcDefault),
		zap.Strings("args", args))

	s.logger.Info("Starting Riot client process")
	_, err = s.cmd.Start(clientInstalls.RcDefault, args...)
	if err != nil {
		s.logger.Error("Failed to start Riot client", zap.Error(err))
		return fmt.Errorf("failed to start Riot client: %w", err)
	}
	return nil
}

func (s *Service) InitializeClient() error {
	riotClientPid, err := s.getProcess()
	if err != nil {
		s.logger.Error("Failed to get Riot client pid", zap.Error(err))
		return err
	}
	port, authToken, err := s.getCredentials(riotClientPid)
	if err != nil {
		s.logger.Error("Failed to get client credentials", zap.Error(err))
		return err
	}
	s.logger.Debug("Credentials obtained", zap.String("port", port), zap.Any("authToken", authToken))
	client := resty.New().
		SetBaseURL("https://127.0.0.1:"+port).
		SetHeader("Authorization", "Basic "+authToken)
	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	s.client = client
	return nil
}

func (s *Service) SetupCaptchaVerification() error {
	if err := s.InitializeClient(); err != nil {
		return err
	}
	rqdata, err := s.getCaptchaData()
	if err != nil {
		return err
	}
	s.captcha.SetRQData(rqdata)
	if err := s.captcha.StartServer(); err != nil {
		return err
	}

	return nil
}

func (s *Service) completeAuthentication(loginToken string) error {
	var loginTokenResp types.LoginTokenResponse
	putResp, err := s.client.R().
		SetBody(types.LoginTokenRequest{
			AuthenticationType: "RiotAuth",
			CodeVerifier:       "",
			LoginToken:         loginToken,
			PersistLogin:       false,
		}).
		SetResult(&loginTokenResp).
		Put("/rso-auth/v1/session/login-token")
	if err != nil {
		s.logger.Error("Error sending login token", zap.Error(err))
		return err
	}
	if putResp.IsError() {
		s.logger.Error("Login token response error", zap.Any("response", putResp))
		return errors.New("login token request failed")
	}
	if loginTokenResp.Type != "authenticated" {
		s.logger.Error("Authentication failed", zap.String("type", loginTokenResp.Type))
		return errors.New("authentication not successful")
	}
	s.logger.Info("Successfully authenticated with login token")
	return nil
}

func (s *Service) getAuthorization() (map[string]interface{}, error) {
	var authResult map[string]interface{}
	postResp, err := s.client.R().
		SetBody(getAuthorizationRequestPayload()).
		SetResult(&authResult).
		Post("/rso-auth/v2/authorizations/riot-client")
	if err != nil {
		s.logger.Error("Authorization request failed", zap.Error(err))
		return nil, err
	}

	if postResp.IsError() {
		s.logger.Error("Authorization response error", zap.Any("response", postResp))
		return nil, errors.New("authorization request failed")
	}

	s.logger.Info("Authorization successful")
	return authResult, nil
}

func (s *Service) Logout() error {
	res, err := s.client.R().Delete("/rso-authenticator/v1/authentication")
	if err != nil {
		s.logger.Error("Error logging out", zap.Error(err))
		return err
	}
	if res.IsError() {
		s.logger.Error("Error logging out", zap.String("response", string(res.Body())))
		return err
	}
	return err
}

func (s *Service) GetAuthenticationState() (*types.RiotIdentityResponse, error) {
	if s.client == nil {
		return nil, errors.New("client is not initialized")
	}
	var getCurrentAuthResult types.RiotIdentityResponse
	result, err := s.client.R().SetResult(&getCurrentAuthResult).Get("/rso-authenticator/v1/authentication")
	if err != nil {
		s.logger.Error("Authentication failed", zap.Error(err))
		return nil, err
	}

	if result.IsError() {
		s.logger.Error("Authentication failed",
			zap.String("message", string(result.Body())),
			zap.Int("status_code", result.StatusCode()))

		// Parse error response to check for CREDENTIALS_INVALID
		var errorResponse types.ErrorResponse
		if err := json.Unmarshal(result.Body(), &errorResponse); err == nil {
			if errorResponse.ErrorCode == "CREDENTIALS_INVALID" {
				s.logger.Info("Detected invalid credentials, attempting to re-initialize client")
				if err := s.InitializeClient(); err != nil {
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

func (s *Service) IsAuthStateValid() error {
	currentAuth, err := s.GetAuthenticationState()
	if err != nil {
		s.logger.Error("Failed to get authentication state", zap.Error(err))
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

func (s *Service) getCaptchaData() (string, error) {
	err := s.IsAuthStateValid()
	if err != nil {
		s.logger.Error("Invalid authentication state", zap.Error(err))
		return "", err
	}
	_, err = s.client.R().
		Delete("/rso-authenticator/v1/authentication")
	if err != nil {
		s.logger.Error("Error in authentication delete session", zap.Error(err))
		return "", err
	}
	var startAuthResult types.RiotIdentityResponse
	startAuthRes, err := s.client.R().
		SetBody(getRiotIdentityStartPayload()).
		SetResult(&startAuthResult).
		Post("/rso-authenticator/v1/authentication/riot-identity/start")
	if err != nil {
		s.logger.Error("Error in authentication start request", zap.Error(err))
		return "", err
	}
	if startAuthRes.IsError() {
		var errorResponse types.ErrorResponse
		if err := json.Unmarshal(startAuthRes.Body(), &errorResponse); err != nil {
			s.logger.Error("Failed to parse error response", zap.Error(err))
		}
		s.logger.Error("Authentication failed", zap.String("message", errorResponse.Message))
		return "", errors.New(errorResponse.Message)
	}
	if startAuthResult.Captcha.Hcaptcha.Data == "" {
		return "", errors.New("no captcha data")
	}
	return startAuthResult.Captcha.Hcaptcha.Data, nil
}
