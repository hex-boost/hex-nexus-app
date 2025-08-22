package riot

import (
	"context"
	"crypto/tls"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/process"
	"regexp"
	"runtime"

	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/sysquery"
	"github.com/hex-boost/hex-nexus-app/backend/riot/captcha"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"go.uber.org/zap"
)

// Helper function to get the current function name for mutex logging
func getFunctionName() string {
	pc, _, _, _ := runtime.Caller(2)
	return runtime.FuncForPC(pc).Name()
}

type Service struct {
	client      *resty.Client
	clientMutex sync.RWMutex // Add this mutex

	// Add a dedicated mutex for authentication operations
	authMutex sync.RWMutex

	logger        *logger.Logger
	captcha       *captcha.Captcha
	ctx           context.Context
	proc          *process.Process
	cmd           *command.Command
	sysquery      *sysquery.SysQuery
	accountClient *account.Client
}

func NewService(logger *logger.Logger, captcha *captcha.Captcha, accountClient *account.Client) *Service {
	return &Service{
		client:        nil,
		cmd:           command.New(),
		sysquery:      sysquery.New(),
		logger:        logger,
		proc:          process.New(command.New()),
		captcha:       captcha,
		ctx:           context.Background(),
		accountClient: accountClient,
	}
}

func (s *Service) ResetRestyClient() {
	s.clientMutex.Lock()
	defer s.clientMutex.Unlock()
	s.client = nil
}
func (s *Service) IsRiotClientExeRunning() bool {
	_, err := s.proc.GetCommandLineByName("RiotClient.exe")
	return err == nil
}

func (s *Service) getProcess() (pid int, err error) {
	proc, err := s.proc.GetCommandLineByName("RiotClient.exe")
	if err == nil {
		return int(proc.ProcessID), nil
	}
	processes, err := s.sysquery.GetProcessesWithCim()
	if err != nil {
		return 0, fmt.Errorf("failed to get processes using Get-CimInstance: %w", err)
	}

	// Use a context to signal early exit to all workers once a result is found.
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Channel to receive the found PID. Buffered to prevent blocking.
	foundPID := make(chan int, 1)
	var wg sync.WaitGroup

	numWorkers := runtime.NumCPU()
	chunkSize := (len(processes) + numWorkers - 1) / numWorkers

	for i := 0; i < numWorkers; i++ {
		start := i * chunkSize
		end := start + chunkSize
		if end > len(processes) {
			end = len(processes)
		}
		if start >= end {
			continue
		}

		wg.Add(1)
		go func(procs []sysquery.Win32_Process) {
			defer wg.Done()
			for _, p := range procs {
				select {
				case <-ctx.Done(): // Check if another worker has found the process.
					return
				default:
					if p.CommandLine != nil {
						cmdLine := *p.CommandLine
						if strings.Contains(cmdLine, "--app-port=") && strings.Contains(cmdLine, "--remoting-auth-token=") {
							// Found it. Send the PID and cancel other workers.
							foundPID <- int(p.ProcessID)
							cancel()
							return
						}
					}
				}
			}
		}(processes[start:end])
	}

	// Wait for all workers to finish in a separate goroutine to not block receiving from the channel.
	go func() {
		wg.Wait()
		close(foundPID)
	}()

	// Wait for the first PID to come through.
	if pid, ok := <-foundPID; ok {
		s.logger.Info("Found Riot Client process via parallel WMI scan", zap.Int("pid", pid))
		return pid, nil
	}

	return 0, errors.New("unable to find Riot Client process")
}
func (s *Service) LockFileExists() bool {
	_, err := s.getLockFile()
	return err == nil
}
func (s *Service) getLockFile() ([]byte, error) {

	s.logger.Debug("Attempting to get credentials from lockfile")

	// Find the Riot Client install path from RiotClientInstalls.json
	programData := os.Getenv("PROGRAMDATA")
	if programData == "" {
		programData = "C:\\ProgramData"
	}

	riotClientInstallsPath := filepath.Join(programData, "Riot Games", "RiotClientInstalls.json")
	fileContent, err := os.ReadFile(riotClientInstallsPath)
	if err != nil {
		s.logger.Debug("Failed to read Riot client installs file, trying standard locations", zap.Error(err))
		// Continue with default paths as fallback
	}

	// Parse the install path from the config
	var clientInstallDir string
	if err == nil {
		var clientInstalls struct {
			RcDefault string `json:"rc_default"`
		}
		if err := json.Unmarshal(fileContent, &clientInstalls); err == nil && clientInstalls.RcDefault != "" {
			// Extract the directory from the executable path
			clientInstallDir = filepath.Dir(clientInstalls.RcDefault)
			s.logger.Debug("Found Riot client install directory from config", zap.String("dir", clientInstallDir))
		}
	}

	// Try lockfile locations in order of preference
	var lockfilePaths []string

	// 1. If we found the install path from config, check there first
	if clientInstallDir != "" {
		lockfilePaths = append(lockfilePaths, filepath.Join(clientInstallDir, "Config", "lockfile"))
	}

	// 2. Check standard location in LocalAppData
	localAppData := os.Getenv("LOCALAPPDATA")
	if localAppData != "" {
		lockfilePaths = append(lockfilePaths, filepath.Join(localAppData, "Riot Games", "Riot Client", "Config", "lockfile"))
	} else {
		// Fallback if LOCALAPPDATA is not available
		homeDir, err := os.UserHomeDir()
		if err == nil {
			lockfilePaths = append(lockfilePaths, filepath.Join(homeDir, "AppData", "Local", "Riot Games", "Riot Client", "Config", "lockfile"))
		}
	}

	var lockfileContent []byte
	for _, path := range lockfilePaths {
		s.logger.Debug("Trying lockfile path", zap.String("path", path))
		content, err := os.ReadFile(path)
		if err == nil {
			lockfileContent = content
			s.logger.Debug("Found lockfile", zap.String("path", path))
			break
		}

	}
	if len(lockfileContent) == 0 {
		return nil, errors.New("lockfile not found")
	}
	return lockfileContent, nil
}
func (s *Service) getCredentials() (port string, authToken string, err error) {
	lockfileContent, err := s.getLockFile()

	if err == nil && len(lockfileContent) > 0 {
		// Parse lockfile content: name:pid:port:password:protocol
		parts := strings.Split(strings.TrimSpace(string(lockfileContent)), ":")
		if len(parts) >= 5 {
			port = parts[2]
			password := parts[3]
			authHeader := base64.StdEncoding.EncodeToString([]byte("riot:" + password))
			s.logger.Debug("Got credentials from lockfile")
			return port, authHeader, nil
		}
	}

	riotClientPid, pidErr := s.getProcess()
	if pidErr != nil {
		s.logger.Sugar().Errorf("Failed to get Riot Client process PID: %v", pidErr)
		return "", "", fmt.Errorf("failed to get Riot Client process PID: %w", pidErr)
	}
	// Fallback: Get from process command line
	s.logger.Debug("Lockfile method failed, falling back to process command line")
	cmdlineOutput, err := s.sysquery.GetProcessCommandLineByPID(uint32(riotClientPid))
	if err != nil {
		return "", "", fmt.Errorf("failed to get command line and lockfile method also failed: %w", err)
	}

	portRegex := regexp.MustCompile(`--app-port[=\s](\d+)`)
	authRegex := regexp.MustCompile(`--remoting-auth-token[=\s]([\w-]+)`)

	portMatch := portRegex.FindStringSubmatch(cmdlineOutput)
	authMatch := authRegex.FindStringSubmatch(cmdlineOutput)

	if len(portMatch) > 1 && len(authMatch) > 1 {
		token := authMatch[1]
		authHeader := base64.StdEncoding.EncodeToString([]byte("riot:" + token))
		s.logger.Debug("Got credentials from process command line")
		return portMatch[1], authHeader, nil
	}

	return "", "", fmt.Errorf("unable to extract credentials from either lockfile or process (PID: %d)", riotClientPid)
}
func (s *Service) LoginWithCaptcha(ctx context.Context, username, password, captchaToken string) (string, error) {
	s.clientMutex.RLock()
	defer s.clientMutex.RUnlock()

	s.logger.Sugar().Infof("Authenticating with captcha token of length %d", len(captchaToken))

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

	s.logger.Sugar().Debugf("Preparing to send authentication request with captcha for username: %s", username)

	// Create a channel to handle async response
	done := make(chan error, 1)

	// Execute request in goroutine to handle context cancellation
	go func() {
		var err error
		resp, err := req.Put("/rso-authenticator/v1/authentication")
		if err == nil {
			s.logger.Sugar().Debugf("Authentication API response received: status %d, size %d bytes",
				resp.StatusCode(), string(resp.Body()))
		}
		done <- err
	}()

	// Wait for either context cancellation or request completion
	select {
	case <-ctx.Done():
		s.logger.Sugar().Errorf("Authentication timed out: %v", ctx.Err())
		return "", fmt.Errorf("authentication timed out: %w", ctx.Err())
	case err := <-done:
		if err != nil {
			s.logger.Sugar().Errorf("Authentication with captcha failed: %v", err)
			return "", fmt.Errorf("authentication request failed: %w", err)
		}
	}

	s.logger.Sugar().Debugf("Processing authentication response type: %s", loginResult.Type)

	if loginResult.Type == "multifactor" {
		s.logger.Info("multifactor required for authentication")
		return "", errors.New("multifactor")
	}
	if loginResult.Type == "success" {
		tokenPreview := fmt.Sprintf("%s...%s", loginResult.Success.LoginToken[:10], loginResult.Success.LoginToken[len(loginResult.Success.LoginToken)-10:])
		s.logger.Sugar().Infof("Authentication with captcha successful, login token: %s", tokenPreview)

		s.logger.Debug("Starting completeAuthentication with login token")
		err := s.completeAuthentication(loginResult.Success.LoginToken)
		s.logger.Sugar().Debugf("completeAuthentication finished: %v", err)
		if err != nil {
			s.logger.Sugar().Errorf("Failed to complete authentication with login token: %v", err)
			return "", fmt.Errorf("complete authentication failed: %w", err)
		}

		s.logger.Debug("Starting getAuthorization")
		authResult, err := s.getAuthorization()

		if err != nil {
			s.logger.Sugar().Errorf("Failed to get authorization after successful authentication: %v", err)
			return "", fmt.Errorf("authorization failed: %w", err)
		}

		keys := make([]string, 0)
		if authResult != nil {
			for k := range authResult {
				keys = append(keys, k)
			}
			s.logger.Sugar().Debugf("getAuthorization finished with error: %v, authResult keys: %v", err, keys)
		} else {
			s.logger.Sugar().Debugf("getAuthorization finished with error: %v, authResult is nil", err)
		}

		s.logger.Info("Full authentication flow completed successfully")
		return "", nil
	}
	if loginResult.Type == "auth" && loginResult.Error == "auth_failure" {
		s.logger.Sugar().Errorf("Authentication failed with auth_failure: %+v", loginResult)
		return "", errors.New(loginResult.Error)
	}
	if loginResult.Error == "captcha_not_allowed" {
		s.logger.Sugar().Errorf("Captcha not allowed: %+v", loginResult.Captcha)
		return loginResult.Captcha.Hcaptcha.Data, errors.New(loginResult.Error)
	}

	s.logger.Sugar().Errorf("Authentication with captcha failed with unknown error: %+v", loginResult)
	return "", errors.New("authentication with captcha failed")
}

func (s *Service) completeAuthentication(loginToken string) error {
	s.authMutex.Lock()
	defer s.authMutex.Unlock()

	startTime := time.Now()
	tokenPreview := fmt.Sprintf("%s...%s", loginToken[:10], loginToken[len(loginToken)-10:])
	requestID := fmt.Sprintf("auth-%d", startTime.UnixNano())

	s.logger.Info("CompleteAuthentication started",
		zap.String("request_id", requestID),
		zap.String("token_preview", tokenPreview),
		zap.Time("start_time", startTime))

	var loginTokenResp types.LoginTokenResponse

	requestBody := types.LoginTokenRequest{
		AuthenticationType: "RiotAuth",
		CodeVerifier:       "",
		LoginToken:         loginToken,
		PersistLogin:       false,
	}

	s.logger.Info("Preparing login token request",
		zap.String("request_id", requestID),
		zap.String("authentication_type", requestBody.AuthenticationType),
		zap.Bool("persist_login", requestBody.PersistLogin),
		zap.Duration("elapsed_ms", time.Since(startTime)))

	// Create the request but don't send it yet
	req := s.client.R().
		SetBody(requestBody).
		SetResult(&loginTokenResp)

	s.logger.Info("Sending login token request",
		zap.String("request_id", requestID),
		zap.String("url", "/rso-auth/v1/session/login-token"),
		zap.String("method", "PUT"),
		zap.Duration("elapsed_ms", time.Since(startTime)))

	requestStartTime := time.Now()
	putResp, err := req.Put("/rso-auth/v1/session/login-token")
	requestDuration := time.Since(requestStartTime)

	if err != nil {
		s.logger.Sugar().Errorf("Network error sending login token request [request_id=%s]: %v (request_duration_ms=%v, total_elapsed_ms=%v)",
			requestID, err, requestDuration, time.Since(startTime))
		return fmt.Errorf("network error in login token request: %w", err)
	}

	s.logger.Info("Login token request completed",
		zap.String("request_id", requestID),
		zap.Int("status_code", putResp.StatusCode()),
		zap.Int("body_size_bytes", len(putResp.Body())),
		zap.Duration("request_duration_ms", requestDuration),
		zap.Duration("total_elapsed_ms", time.Since(startTime)))

	// Log response headers in debug level
	headerFields := []zap.Field{}
	for k, v := range putResp.Header() {
		if len(v) > 0 {
			headerFields = append(headerFields, zap.Strings(fmt.Sprintf("header_%s", k), v))
		}
	}
	s.logger.Debug("Response headers", append([]zap.Field{
		zap.String("request_id", requestID),
	}, headerFields...)...)

	// Log response body in debug level
	s.logger.Debug("Response body",
		zap.String("request_id", requestID),
		zap.String("body", string(putResp.Body())))

	if putResp.IsError() {
		s.logger.Sugar().Errorf("Login token response returned error [request_id=%s]: status_code=%d, body=%s, total_elapsed_ms=%v",
			requestID, putResp.StatusCode(), string(putResp.Body()), time.Since(startTime))
		return fmt.Errorf("login token request failed with status %d: %s",
			putResp.StatusCode(), string(putResp.Body()))
	}

	s.logger.Info("Login token response parsed",
		zap.String("request_id", requestID),
		zap.String("response_type", loginTokenResp.Type),
		zap.Duration("total_elapsed_ms", time.Since(startTime)))

	if loginTokenResp.Type != "authenticated" {
		s.logger.Sugar().Errorf("Login token authentication failed [request_id=%s]: expected_type=authenticated, actual_type=%s, full_response=%+v, total_elapsed_ms=%v",
			requestID, loginTokenResp.Type, loginTokenResp, time.Since(startTime))
		return fmt.Errorf("authentication not successful: got type %s", loginTokenResp.Type)
	}

	s.logger.Info("Authentication successful",
		zap.String("request_id", requestID),
		zap.Duration("total_elapsed_ms", time.Since(startTime)))
	return nil
}

func (s *Service) getAuthorization() (map[string]interface{}, error) {
	s.authMutex.RLock()
	defer s.authMutex.RUnlock()

	s.logger.Info("Starting authorization request")

	var authResult map[string]interface{}

	requestPayload := getAuthorizationRequestPayload()
	s.logger.Debug("Preparing authorization request", zap.Any("payload", requestPayload))

	postResp, err := s.client.R().
		SetBody(requestPayload).
		SetResult(&authResult).
		Post("/rso-auth/v2/authorizations/riot-client")
	if err != nil {
		s.logger.Sugar().Errorf("Authorization request failed: %v", err)
		return nil, err
	}

	if postResp.IsError() {
		s.logger.Sugar().Errorf("Authorization response error: %+v", postResp)
		return nil, errors.New("authorization request failed")
	}

	s.logger.Info("Authorization successful")
	return authResult, nil
}

func (s *Service) Logout() error {
	res, err := s.client.R().Delete("/rso-authenticator/v1/authentication")
	if err != nil {
		s.logger.Sugar().Errorf("Error logging out: %v", err)
		return err
	}
	if res.IsError() {
		s.logger.Sugar().Errorf("Error logging out: response=%s", string(res.Body()))
		return err
	}
	return err
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
		s.logger.Sugar().Errorf("Failed to read Riot client installs file: %v", err)
		return fmt.Errorf("failed to read Riot client installs file: %w", err)
	}
	var clientInstalls struct {
		RcDefault string `json:"rc_default"`
	}
	if err := json.Unmarshal(fileContent, &clientInstalls); err != nil {
		s.logger.Sugar().Errorf("Failed to parse Riot client installs file: %v", err)
		return fmt.Errorf("failed to parse Riot client installs file: %w", err)
	}
	if clientInstalls.RcDefault == "" {
		return errors.New("could not find Riot client path in installs file")
	}
	args := []string{"--launch-product=league_of_legends", "--launch-patchline=live"}
	s.logger.Info("Launching Riot client",
		zap.String("path", clientInstalls.RcDefault),
		zap.Strings("args", args))

	_, err = s.cmd.Start(clientInstalls.RcDefault, args...)
	if err != nil {
		s.logger.Sugar().Errorf("Failed to start Riot client: %v", err)
		return fmt.Errorf("failed to start Riot client: %w", err)
	}
	return nil
}
func (s *Service) isProcessRunning() bool {
	_, err := s.getProcess()
	if err != nil {
		return false
	}
	return true

}
func (s *Service) InitializeClient() error {
	s.clientMutex.Lock()
	defer s.clientMutex.Unlock()

	port, authToken, err := s.getCredentials()
	if err != nil {
		s.logger.Sugar().Warnf("Failed to get client credentials: %v", err)
		return err
	}
	s.logger.Sugar().Debugf("Credentials obtained: port %s, authToken %v", port, authToken)
	client := resty.New().
		SetBaseURL("https://127.0.0.1:"+port).
		SetHeader("Authorization", "Basic "+authToken).
		SetTimeout(10 * time.Second) // Add a 10-second timeout
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

func (s *Service) GetAuthenticationState() (*types.RiotIdentityResponse, error) {
	s.clientMutex.RLock()

	if s.client == nil {
		s.clientMutex.RUnlock()
		return nil, errors.New("client is not initialized")
	}

	var getCurrentAuthResult types.RiotIdentityResponse
	result, err := s.client.R().SetResult(&getCurrentAuthResult).Get("/rso-authenticator/v1/authentication")

	// Release the lock after the request is made
	s.clientMutex.RUnlock()

	if err != nil {
		s.logger.Sugar().Errorf("Failed while trying to get authentication state: %v", err)
		// Check for network errors, including timeouts
		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			s.logger.Info("Detected network timeout, attempting to re-initialize client")
			if initErr := s.InitializeClient(); initErr != nil {
				s.logger.Sugar().Errorf("Failed to re-initialize client after timeout: %v", initErr)
				return nil, fmt.Errorf("failed to re-initialize client after timeout: %w", initErr)
			}
			// Return a specific error to indicate re-initialization happened
			return nil, errors.New("client re-initialized after network timeout")
		}
		return nil, err
	}

	if result.IsError() {
		s.logger.Sugar().Errorf("Authentication failed: status code %d, message: %s",
			result.StatusCode(), string(result.Body()))

		var errorResponse types.ErrorResponse
		if err := json.Unmarshal(result.Body(), &errorResponse); err == nil {
			if errorResponse.ErrorCode == "CREDENTIALS_INVALID" {
				s.logger.Info("Detected invalid credentials, attempting to re-initialize client")
				if initErr := s.InitializeClient(); initErr != nil {
					s.logger.Sugar().Errorf("Failed to re-initialize client: %v", initErr)
					return nil, fmt.Errorf("failed to re-initialize client: %w", initErr)
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
	if !s.IsClientInitialized() {
		err := s.InitializeClient()
		if err != nil {
			s.logger.Sugar().Errorf("Failed to initialize client: %v", err)
			return err
		}
	}
	currentAuth, err := s.GetAuthenticationState()
	if err != nil {
		s.logger.Sugar().Errorf("Failed to get authentication state: %v", err)
		return err
	}

	if currentAuth.Type != "auth" && currentAuth.Error != "invalid_request" {
		return errors.New("authentication in invalid state: " + currentAuth.Type)
	}
	if currentAuth.Type == "error" && currentAuth.Captcha.Hcaptcha.Data == "" {
		return errors.New("authentication error without captcha data")
	}

	return nil
}

func (s *Service) getCaptchaData() (string, error) {
	err := s.IsAuthStateValid()
	if err != nil {
		s.logger.Sugar().Errorf("Invalid authentication state: %v", err)
		return "", err
	}
	_, err = s.client.R().
		Delete("/rso-authenticator/v1/authentication")
	if err != nil {
		s.logger.Sugar().Errorf("Error in authentication delete session: %v", err)
		return "", err
	}
	var startAuthResult types.RiotIdentityResponse
	startAuthRes, err := s.client.R().
		SetBody(getRiotIdentityStartPayload()).
		SetResult(&startAuthResult).
		Post("/rso-authenticator/v1/authentication/riot-identity/start")
	if err != nil {
		s.logger.Sugar().Errorf("Error in authentication start request: %v", err)
		return "", err
	}
	if startAuthRes.IsError() {
		var errorResponse types.ErrorResponse
		if err := json.Unmarshal(startAuthRes.Body(), &errorResponse); err != nil {
			s.logger.Sugar().Errorf("Failed to parse error response: %v", err)
		}
		s.logger.Sugar().Errorf("Authentication failed: %s", errorResponse.Message)
		return "", errors.New(errorResponse.Message)
	}
	if startAuthResult.Captcha.Hcaptcha.Data == "" {
		return "", errors.New("no captcha data")
	}
	return startAuthResult.Captcha.Hcaptcha.Data, nil
}

func (s *Service) CheckAccountBanned(username string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if !s.IsClientInitialized() {
		err := s.InitializeClient()
		if err != nil {
			s.logger.Sugar().Errorf("Failed to initialize client: %v", err)
			return err
		}
	}
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			userInfo, err := s.GetUserinfo()
			if err != nil {
				s.logger.Sugar().Errorf("Failed to get user info for ban check: %v", err)
				return err
			}

			// Check if the user has restrictions
			if len(userInfo.Ban.Restrictions) > 0 {
				s.logger.Sugar().Warnf("Account has %d restrictions: %+v",
					len(userInfo.Ban.Restrictions), userInfo.Ban.Restrictions)

				for _, restriction := range userInfo.Ban.Restrictions {
					if restriction.Type == "PERMANENT_BAN" && (restriction.Scope == "riot" || restriction.Scope == "lol" || restriction.Scope == "") {
						_, saveErr := s.accountClient.Save(types.PartialSummonerRented{
							Username: username,
							Ban:      &userInfo.Ban,
						})
						if saveErr != nil {
							s.logger.Sugar().Errorf("Error saving summoner with ban restriction: %v", saveErr)
							return saveErr
						}
						return fmt.Errorf("permanent_banned")
					}
				}
				return nil
			}

			s.logger.Debug("No account restrictions found")
			return nil
		}
	}
}
