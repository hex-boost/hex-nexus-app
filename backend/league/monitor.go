package league

import (
	"context"
	"errors"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"go.uber.org/zap"
	"strings"
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
	app                 *application.App
	riotClient          *riot.RiotClient
	isRunning           bool
	pollingTicker       *time.Ticker
	logger              *utils.Logger
	captcha             *riot.Captcha
	accountMonitor      *AccountMonitor
	leagueService       *LeagueService
	// State management
	stateMutex            sync.RWMutex
	captchaWebview        *application.WebviewWindow
	captchaWebviewMutex   sync.Mutex
	captchaFlowInProgress atomic.Bool
	currentState          *LeagueClientState
	isCheckingState       atomic.Bool // Tracks if checkClientState is already running

}

func NewClientMonitor(logger *utils.Logger, accountMonitor *AccountMonitor, leagueService *LeagueService, riotClient *riot.RiotClient, captcha *riot.Captcha) *ClientMonitor {
	logger.Info("Creating new client monitor")
	initialState := &LeagueClientState{
		ClientState: ClientStateClosed,
		AuthState:   AuthStateNone,
		LastUpdated: time.Now(),
	}

	monitor := &ClientMonitor{
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
	monitor.isCheckingState.Store(false)
	return monitor
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

	isLoggedIn := cm.leagueService.IsRunning()
	isLeagueClientRunning := isLoggedIn
	isPlayingLeague := cm.leagueService.IsPlaying()

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

		if cm.leagueService.IsLCUConnectionReady() &&
			loggedInUsername != "" &&
			(!cm.accountUpdateStatus.IsUpdated ||
				strings.ToLower(cm.accountUpdateStatus.Username) != loggedInUsername) {
			cm.logger.Sugar().Infow("Checking account update status",
				"currentUsername", loggedInUsername,
				"lastUpdatedUsername", cm.accountUpdateStatus.Username,
				"isUpdated", cm.accountUpdateStatus.IsUpdated)

			// Only update if this is a different account or not already updated
			if strings.ToLower(cm.accountUpdateStatus.Username) != loggedInUsername || !cm.accountUpdateStatus.IsUpdated {
				cm.logger.Info("Updating account",
					zap.String("username", loggedInUsername),
					zap.Any("updateStatus", cm.accountUpdateStatus))

				err := cm.leagueService.UpdateFromLCU(loggedInUsername)
				if err != nil {
					cm.logger.Error("Error updating account from LCU", zap.Error(err))
					// Don't update status on failure so we can retry
				} else {
					// Store both values atomically to prevent race condition
					cm.stateMutex.Lock()
					cm.accountUpdateStatus.IsUpdated = true
					cm.accountUpdateStatus.Username = strings.ToLower(loggedInUsername)
					cm.app.EmitEvent(LeagueWebsocketStartHandlers)
					cm.stateMutex.Unlock()

					cm.logger.Info("Account successfully updated",
						zap.String("username", loggedInUsername))
				}
			}
		}
	} else if cm.accountUpdateStatus.IsUpdated {
		// Reset update status when league client is closed
		cm.logger.Info("Resetting account update status",
			zap.Any("oldUpdateStatus", cm.accountUpdateStatus))

		cm.stateMutex.Lock()
		cm.accountUpdateStatus.IsUpdated = false
		cm.accountUpdateStatus.Username = ""
		cm.app.EmitEvent(LeagueWebsocketStopHandlers)
		cm.stateMutex.Unlock()
	}
	// Get detailed client state if running
	if isRiotClientRunning {
		if !cm.riotClient.IsClientInitialized() {
			cm.logger.Debug("Client running but not initialized, initializing...")
			err := cm.riotClient.InitializeRestyClient()
			if err != nil {
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
	} else if isLoggedIn || isPlayingLeague || (isLeagueClientRunning && currentState.ClientState == ClientStateOpen) {
		clientState = ClientStateLoggedIn
	} else if isLoginReady {
		clientState = ClientStateLoginReady
	} else {
		clientState = ClientStateOpen
	}

	previousClientState := currentState.ClientState

	if previousClientState == ClientStateLoggedIn && clientState != ClientStateLoggedIn && !isLeagueClientRunning {
		newState.AuthState = AuthStateNone
	} else if currentState.AuthState == AuthStateWaitingCaptcha {
		newState.AuthState = AuthStateWaitingCaptcha
		newState.ClientState = currentState.ClientState
		cm.updateState(newState)
		return
	} else if previousClientState == ClientStateClosed && clientState == ClientStateLoginReady {
		time.Sleep(4 * time.Second)
	} else if (currentState.AuthState == AuthStateWaitingLogin ||
		currentState.AuthState == AuthStateWaitingCaptcha) &&
		(clientState == ClientStateOpen || clientState == ClientStateLoginReady) {
		// Keep the auth state as is during auth flow
	} else if clientState == ClientStateLoggedIn &&
		currentState.AuthState != AuthStateLoginSuccess {
		newState.AuthState = AuthStateLoginSuccess
	} else if clientState == ClientStateClosed {
		// Reset auth state when client is closed
		newState.AuthState = AuthStateNone
	} else {
		newState.AuthState = currentState.AuthState
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

func (cm *ClientMonitor) OpenWebviewAndGetToken(username string) (string, error) {
	// Ensure only one captcha flow runs at a time
	cm.UpdateAuthState(AuthStateWaitingCaptcha, "", username)
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Minute)
	defer cancel()
	err := cm.riotClient.InitializeCaptchaHandling()
	if err != nil {
		cm.updateState(&LeagueClientState{
			ClientState:  ClientStateLoginReady,
			AuthState:    AuthStateNone,
			ErrorMessage: err.Error(),
			Username:     username,
			LastUpdated:  time.Now(),
		})
		return "", err
	}

	// Get or create the shared webview
	cm.captchaWebviewMutex.Lock()
	if cm.captchaWebview == nil {
		webview, err := cm.captcha.GetWebView()
		if err != nil {
			cm.captchaWebviewMutex.Unlock()
			cm.logger.Error("Error opening captcha webview", zap.Error(err))
			cm.updateState(&LeagueClientState{
				ClientState:  ClientStateLoginReady,
				AuthState:    AuthStateNone,
				ErrorMessage: err.Error(),
				Username:     username,
				LastUpdated:  time.Now(),
			})
			return "", err
		}
		cm.captchaWebview = webview
	}
	webview := cm.captchaWebview
	cm.captchaWebviewMutex.Unlock()

	// Create function-local channels for this specific invocation
	closedChan := make(chan struct{})
	tokenChan := make(chan string)
	errChan := make(chan error, 1)

	// Create a context-specific "closed" flag
	var thisFlowClosed atomic.Bool

	// Register window closing handler that's specific to this invocation
	webview.RegisterHook(events.Windows.WindowClosing, func(eventCtx *application.WindowEvent) {
		cm.logger.Info("Window closing event triggered")
		eventCtx.Cancel()

		// Only signal this specific invocation
		if !thisFlowClosed.Swap(true) {
			close(closedChan)
		}

		webview.Hide()
	})
	go func() {
		webview.Show()
		webview.Focus()
		captchaResponse, err := cm.captcha.WaitAndGetCaptchaResponse(15 * time.Second)
		webview.Hide()
		if err != nil {
			cm.logger.Error("Error in captcha flow", zap.Error(err))
			cm.updateState(&LeagueClientState{
				ClientState:  ClientStateLoginReady,
				AuthState:    AuthStateNone,
				ErrorMessage: err.Error(),
				Username:     username,
				LastUpdated:  time.Now(),
			})
			errChan <- err
			return
		}
		tokenChan <- captchaResponse
	}()

	// Wait for results while keeping all channels local to this invocation
	select {
	case <-ctx.Done():
		cm.logger.Info("Captcha flow timed out")
		return "", errors.New("captcha_timeout")
	case err := <-errChan:
		return "", err
	case token := <-tokenChan:
		return token, nil
	case <-closedChan:
		cm.logger.Info("Webview was closed by user")
		cancel()
		cm.updateState(&LeagueClientState{
			ClientState:  ClientStateLoginReady,
			AuthState:    AuthStateNone,
			ErrorMessage: "Captcha window closed by user",
			Username:     username,
			LastUpdated:  time.Now(),
		})
		return "", errors.New("captcha_cancelled_by_user")
	}
}

func (cm *ClientMonitor) SetWindow(app *application.App) {
	cm.app = app
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
		newState := &LeagueClientState{
			ClientState:  ClientStateLoginReady,
			AuthState:    AuthStateNone,
			ErrorMessage: err.Error(),
			Username:     username,
			LastUpdated:  time.Now(),
		}

		cm.updateState(newState)

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
