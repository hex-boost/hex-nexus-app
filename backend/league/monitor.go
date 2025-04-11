package league

import (
	"context"
	"errors"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"go.uber.org/zap"
	"sync"
	"sync/atomic"
	"time"
)

type LeagueClientStateType string
type LeagueAuthStateType string
type AccountUpdateStatus struct {
	Username  string
	IsUpdated bool
}

// Define client state constants
const (
	ClientStateClosed     LeagueClientStateType = "CLOSED"
	ClientStateOpen       LeagueClientStateType = "OPEN"
	ClientStateLoginReady LeagueClientStateType = "LOGIN_READY"
	ClientStateLoggedIn   LeagueClientStateType = "LOGGED_IN"
)

// Define auth state constants
const (
	AuthStateNone           LeagueAuthStateType = ""
	AuthStateWaitingCaptcha LeagueAuthStateType = "WAITING_CAPTCHA"
	AuthStateWaitingLogin   LeagueAuthStateType = "WAITING_LOGIN"
	AuthStateLoginSuccess   LeagueAuthStateType = "LOGIN_SUCCESS"
)

type LeagueClientState struct {
	ClientState  LeagueClientStateType `json:"clientState"`
	AuthState    LeagueAuthStateType   `json:"authState"`
	ErrorMessage string                `json:"errorMessage,omitempty"`
	LastUpdated  time.Time             `json:"lastUpdated"`
	Username     string                `json:"username,omitempty"`
}

// State mapping between backend and frontend states
const (
	EventLeagueStateChanged = "league:state:changed"
)

type ClientMonitor struct {
	accountUpdateStatus AccountUpdateStatus
	app                 *application.WebviewWindow
	riotClient          *riot.RiotClient
	isRunning           bool
	pollingTicker       *time.Ticker
	logger              *utils.Logger
	captcha             *riot.Captcha
	accountMonitor      *AccountMonitor
	leagueService       *LeagueService
	// State management
	stateMutex   sync.RWMutex
	currentState *LeagueClientState
}

func NewClientMonitor(logger *utils.Logger, accountMonitor *AccountMonitor, leagueService *LeagueService, riotClient *riot.RiotClient, captcha *riot.Captcha) *ClientMonitor {
	logger.Info("Creating new client monitor")
	initialState := &LeagueClientState{
		ClientState: ClientStateClosed,
		AuthState:   AuthStateNone,
		LastUpdated: time.Now(),
	}

	return &ClientMonitor{
		accountUpdateStatus: AccountUpdateStatus{
			Username:  "",
			IsUpdated: false,
		},
		app:            nil,
		accountMonitor: accountMonitor,
		captcha:        captcha,
		logger:         logger,
		leagueService:  leagueService,
		riotClient:     riotClient,
		isRunning:      false,
		currentState:   initialState,
		stateMutex:     sync.RWMutex{},
	}
}

// GetCurrentState returns the current state (thread-safe)
func (cm *ClientMonitor) GetCurrentState() *LeagueClientState {
	cm.stateMutex.RLock()
	defer cm.stateMutex.RUnlock()

	// Return a copy to prevent race conditions
	stateCopy := *cm.currentState
	return &stateCopy
}

// updateState updates the state and emits an event if changed
func (cm *ClientMonitor) updateState(newState *LeagueClientState) {
	cm.stateMutex.Lock()
	defer cm.stateMutex.Unlock()

	stateChanged := cm.currentState.ClientState != newState.ClientState ||
		cm.currentState.AuthState != newState.AuthState

	if stateChanged {
		// Change from Info to Infow for structured logging
		cm.logger.Sugar().Infow("State changed",
			"prevClientState", cm.currentState.ClientState,
			"newClientState", newState.ClientState,
			"prevAuthState", cm.currentState.AuthState,
			"newAuthState", newState.AuthState)

		newState.LastUpdated = time.Now()
		cm.currentState = newState

		// Emit event to frontend
		if cm.app != nil {
			cm.app.EmitEvent(EventLeagueStateChanged, newState)
		}
	}
}

// UpdateAuthState updates the authentication state
func (cm *ClientMonitor) UpdateAuthState(authState LeagueAuthStateType, errorMsg string, username string) {
	currentState := cm.GetCurrentState()

	newState := &LeagueClientState{
		ClientState:  currentState.ClientState,
		AuthState:    authState,
		ErrorMessage: errorMsg,
		Username:     username,
		LastUpdated:  time.Now(),
	}

	cm.updateState(newState)
}

// HasBeenUpdatedBefore checks if the account with the given username has been updated in this session

func (cm *ClientMonitor) checkClientState() {
	// Check if client is running
	isRiotClientRunning := cm.riotClient.IsRunning()
	isLeagueClientRunning := cm.leagueService.IsRunning()
	isLoggedIn := false
	isLoginReady := false

	currentState := cm.GetCurrentState()
	newState := &LeagueClientState{
		ClientState:  currentState.ClientState,
		AuthState:    currentState.AuthState,
		ErrorMessage: currentState.ErrorMessage,
		Username:     currentState.Username,
	}

	if isLeagueClientRunning {

		loggedInUsername := cm.accountMonitor.GetLoggedInUsername()

		if cm.accountUpdateStatus.Username != loggedInUsername {
			cm.accountUpdateStatus.IsUpdated = false
		}
		if !cm.accountUpdateStatus.IsUpdated && cm.leagueService.IsLCUConnectionReady() {
			cm.logger.Info("Updating account for first time",
				zap.String("username", loggedInUsername), zap.Any("updateStatus", cm.accountUpdateStatus))

			err := cm.leagueService.UpdateFromLCU(loggedInUsername)
			if err != nil {
				cm.logger.Error("Error updating account from LCU", zap.Error(err))
			} else {
				// Only mark as updated on success
				cm.accountUpdateStatus.IsUpdated = true
				cm.accountUpdateStatus.Username = loggedInUsername
				cm.logger.Info("Account successfully updated on first login",
					zap.String("username", cm.accountUpdateStatus.Username))
			}
		}
	} else if cm.accountUpdateStatus.Username != "" && cm.accountUpdateStatus.IsUpdated {
		cm.logger.Info("reseting account update status",
			zap.Any("oldUpdateStatus", cm.accountUpdateStatus))
		cm.accountUpdateStatus.IsUpdated = false
		cm.accountUpdateStatus.Username = ""
	}

	// Get detailed client state if running
	if isRiotClientRunning {
		if !cm.riotClient.IsClientInitialized() {
			cm.logger.Debug("Client running but not initialized, initializing...")
			err := cm.riotClient.InitializeRestyClient()
			if err != nil {
				// Change from Error to Errorw for structured logging
				cm.logger.Error("Error initializing client", zap.Error(err))
				return
			}
			cm.logger.Info("Client initialized successfully")
		}

		userinfo, userinfoErr := cm.riotClient.GetUserinfo()
		isLoggedIn = userinfoErr == nil

		if isLoggedIn && userinfo != nil {
			newState.Username = userinfo.Username
		}

		authError := cm.riotClient.IsAuthStateValid()
		isLoginReady = authError == nil
	}

	// Determine current client state
	var clientState LeagueClientStateType
	if !isRiotClientRunning && !isLeagueClientRunning {
		clientState = ClientStateClosed
	} else if isLoggedIn || (isLeagueClientRunning && currentState.ClientState == ClientStateLoggedIn) {
		clientState = ClientStateLoggedIn
	} else if isLoginReady {
		clientState = ClientStateLoginReady
	} else {
		clientState = ClientStateOpen
	}

	// Handle state transitions and auth state resets
	previousClientState := currentState.ClientState

	// Special case: Reset auth state when transitioning from LOGGED_IN to any other state
	// But only if LeagueService client is not running
	if previousClientState == ClientStateLoggedIn && clientState != ClientStateLoggedIn && !isLeagueClientRunning {
		cm.logger.Debug("Client was logged in but now requires login again, resetting auth state")
		newState.AuthState = AuthStateNone
	} else if previousClientState == ClientStateClosed && clientState == ClientStateLoginReady {
		time.Sleep(3 * time.Second)

	} else if (currentState.AuthState == AuthStateWaitingLogin ||
		currentState.AuthState == AuthStateWaitingCaptcha) &&
		clientState == ClientStateOpen {
		// Keep the auth state as is during auth flow
	} else if clientState == ClientStateLoggedIn &&
		currentState.AuthState != AuthStateLoginSuccess {
		newState.AuthState = AuthStateLoginSuccess
	} else if clientState == ClientStateClosed {
		// Reset auth state when client is closed
		newState.AuthState = AuthStateNone
	}

	newState.ClientState = clientState
	cm.updateState(newState)
}

func (cm *ClientMonitor) Start() {
	if cm.isRunning {
		return
	}

	cm.logger.Info("Starting LeagueService client monitor")
	cm.isRunning = true
	cm.pollingTicker = time.NewTicker(200 * time.Millisecond)

	go func() {
		for {
			select {
			case <-cm.pollingTicker.C:
				cm.checkClientState()
			}
		}
	}()
}

// Backend methods for frontend actions
func (cm *ClientMonitor) OpenWebviewAndGetToken(username string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Minute)
	defer cancel()

	cm.UpdateAuthState(AuthStateWaitingCaptcha, "", username)
	err := cm.riotClient.InitializeCaptchaHandling(ctx)
	if err != nil {
		cm.UpdateAuthState(AuthStateNone, "Error while opening server", username)
		return "", err
	}

	webview, err := cm.captcha.GetWebView()
	if err != nil {
		cm.logger.Error("Error opening captcha webview", zap.Error(err))
		cm.UpdateAuthState(AuthStateNone, "", username)
		return "", err
	}

	// Create a channel to signal when the webview closes
	closedChan := make(chan struct{})

	// Track if the channel has been closed to prevent double close
	var channelClosed atomic.Bool

	// Register closing hook with safer channel handling
	webview.RegisterHook(events.Windows.WindowClosing, func(eventCtx *application.WindowEvent) {
		cm.logger.Info("Window closing event triggered")
		eventCtx.Cancel()
		webview.Hide()

		// Only close the channel if it hasn't been closed already
		if !channelClosed.Swap(true) {
			close(closedChan)
		}
	})

	tokenChan := make(chan string)
	errChan := make(chan error, 1)
	go func() {
		webview.Run()
		captchaResponse, err := cm.captcha.WaitAndGetCaptchaResponse(30 * time.Second)
		webview.Hide()
		if err != nil {
			cm.logger.Error("Error or cancellation in captcha flow", zap.Error(err))
			cm.UpdateAuthState(AuthStateNone, "", username)
			errChan <- err
			return
		}
		tokenChan <- captchaResponse
	}()

	// Wait for either a token, contexts timeout, or webview close
	select {
	case <-ctx.Done():
		cm.logger.Info("Captcha flow timed out, shutting down server")
		return "", errors.New("captcha_timeout")
	case err := <-errChan:
		return "", err
	case token := <-tokenChan:
		return token, nil
	case <-closedChan:
		// Handle the case when webview is closed by the user
		cm.logger.Info("Webview was closed by user, canceling captcha flow")
		cancel() // Cancel the contexts
		cm.UpdateAuthState(AuthStateNone, "Captcha window closed", username)
		return "", errors.New("captcha_cancelled_by_user")
	}
}
func (cm *ClientMonitor) SetWindow(window *application.WebviewWindow) {
	cm.app = window
}
func (cm *ClientMonitor) Stop() {
	if !cm.isRunning {
		return
	}

	cm.logger.Info("Stopping LeagueService client monitor")
	cm.pollingTicker.Stop()
	cm.isRunning = false
}
func (cm *ClientMonitor) HandleLogin(username string, password string, captchaToken string) error {
	cm.UpdateAuthState(AuthStateWaitingLogin, "", username)

	// Existing login logic...
	_, err := cm.riotClient.LoginWithCaptcha(username, password, captchaToken)
	if err != nil {
		return err
	}

	return nil
}

func (cm *ClientMonitor) LaunchClient() error {
	cm.UpdateAuthState(AuthStateNone, "", "")

	// Existing launch logic...
	err := cm.riotClient.Launch()
	if err != nil {
		return err
	}

	return nil
}

// IsLCUConnectionReady checks if the League Client connection is fully established and ready
func (lc *LeagueService) IsLCUConnectionReady() bool {
	// Ensure client is initialized
	if lc.LCUconnection.client == nil {
		err := lc.LCUconnection.InitializeConnection()
		if err != nil {
			lc.logger.Debug("Failed to initialize LCU connection", zap.Error(err))
			return false
		}
	}

	// Test connection with a simple endpoint
	resp, err := lc.LCUconnection.client.R().Get("/lol-summoner/v1/current-summoner")
	if err != nil {
		lc.logger.Debug("LCU connection test failed", zap.Error(err))
		return false
	}

	// Check if we got a valid response (2xx status)
	if resp.StatusCode() >= 200 && resp.StatusCode() < 300 {
		return true
	}

	lc.logger.Debug("LCU connection not ready", zap.Int("statusCode", resp.StatusCode()))
	return false
}
