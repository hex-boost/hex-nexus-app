package riot

import (
	"bytes"
	"context"
	"regexp"
	"runtime"

	"crypto/tls"
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

type Service struct {
	client      *resty.Client
	clientMutex sync.RWMutex // Add this mutex

	logger        *logger.Logger
	captcha       *captcha.Captcha
	ctx           context.Context
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

type Win32_Process struct {
	ProcessID   uint32
	CommandLine *string
}

func (s *Service) getProcessesWithCim() ([]Win32_Process, error) {
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
func (s *Service) getProcess() (pid int, err error) {
	processes, err := s.getProcessesWithCim()
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
		go func(procs []Win32_Process) {
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
func (s *Service) getCredentials(riotClientPid int) (port string, authToken string, err error) {
	// First try: Read from lockfile
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

	// Try each path in order
	var lockfileContent []byte
	var lockfilePath string
	for _, path := range lockfilePaths {
		s.logger.Debug("Trying lockfile path", zap.String("path", path))
		content, err := os.ReadFile(path)
		if err == nil {
			lockfileContent = content
			lockfilePath = path
			s.logger.Debug("Found lockfile", zap.String("path", path))
			break
		}
	}

	if lockfileContent != nil {
		// Parse lockfile content: name:pid:port:password:protocol
		parts := strings.Split(strings.TrimSpace(string(lockfileContent)), ":")
		if len(parts) >= 5 {
			port = parts[2]
			password := parts[3]
			authHeader := base64.StdEncoding.EncodeToString([]byte("riot:" + password))
			s.logger.Debug("Got credentials from lockfile", zap.String("port", port), zap.String("path", lockfilePath))
			return port, authHeader, nil
		}
		s.logger.Debug("Lockfile found but has invalid format", zap.String("path", lockfilePath))
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
		return "", errors.New("multifactor")
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
	if loginResult.Type == "auth" && loginResult.Error == "auth_failure" {
		return "", errors.New(loginResult.Error)
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

	_, err = s.cmd.Start(clientInstalls.RcDefault, args...)
	if err != nil {
		s.logger.Error("Failed to start Riot client", zap.Error(err))
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
	riotClientPid, err := s.getProcess()
	if err != nil {
		s.logger.Warn("Failed to get Riot client pid", zap.Error(err))
		return err
	}
	port, authToken, err := s.getCredentials(riotClientPid)
	if err != nil {
		s.logger.Warn("Failed to get client credentials", zap.Error(err))
		return err
	}
	s.logger.Debug("Credentials obtained", zap.String("port", port), zap.Any("authToken", authToken))
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

func (s *Service) completeAuthentication(loginToken string) error {
	s.clientMutex.RLock()
	defer s.clientMutex.RUnlock()

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
	s.clientMutex.RLock()
	defer s.clientMutex.RUnlock()
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
	s.clientMutex.RLock()
	if s.client == nil {
		s.clientMutex.RUnlock()
		return nil, errors.New("client is not initialized")
	}

	var getCurrentAuthResult types.RiotIdentityResponse
	result, err := s.client.R().SetResult(&getCurrentAuthResult).Get("/rso-authenticator/v1/authentication")
	s.clientMutex.RUnlock() // Release the lock after the request is made

	if err != nil {
		s.logger.Error(fmt.Sprintf("Failed while trying to get authentication state %v", err))
		// Check for network errors, including timeouts
		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			s.logger.Info("Detected network timeout, attempting to re-initialize client")
			if initErr := s.InitializeClient(); initErr != nil {
				return nil, fmt.Errorf("failed to re-initialize client after timeout: %w", initErr)
			}
			// Return a specific error to indicate re-initialization happened
			return nil, errors.New("client re-initialized after network timeout")
		}
		return nil, err
	}

	if result.IsError() {
		s.logger.Error("Authentication failed",
			zap.String("message", string(result.Body())),
			zap.Int("status_code", result.StatusCode()))

		var errorResponse types.ErrorResponse
		if err := json.Unmarshal(result.Body(), &errorResponse); err == nil {
			if errorResponse.ErrorCode == "CREDENTIALS_INVALID" {
				s.logger.Info("Detected invalid credentials, attempting to re-initialize client")
				if initErr := s.InitializeClient(); initErr != nil {
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
			s.logger.Error("Failed to initialize client", zap.Error(err))
			return err
		}
	}
	currentAuth, err := s.GetAuthenticationState()
	if err != nil {
		s.logger.Sugar().Errorf("Failed to get authentication state %v", err)
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

func (s *Service) CheckAccountBanned(username string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if !s.IsClientInitialized() {
		err := s.InitializeClient()
		if err != nil {
			s.logger.Error("Failed to initialize client", zap.Error(err))
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
				s.logger.Error("Failed to get user info for ban check", zap.Error(err))
				return err
			}

			// Check if the user has restrictions
			if len(userInfo.Ban.Restrictions) > 0 {
				s.logger.Warn("Account has restrictions",
					zap.Int("count", len(userInfo.Ban.Restrictions)),
					zap.Any("restrictions", userInfo.Ban.Restrictions))

				for _, restriction := range userInfo.Ban.Restrictions {
					if restriction.Type == "PERMANENT_BAN" && (restriction.Scope == "riot" || restriction.Scope == "lol" || restriction.Scope == "") {
						_, saveErr := s.accountClient.Save(types.PartialSummonerRented{
							Username: username,
							Ban:      &userInfo.Ban,
						})
						if saveErr != nil {
							s.logger.Error("Error saving summoner with multifactor restriction", zap.Error(err))
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
