package league

import (
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"sync"
	"time"
)

type LeagueClientStateType string
type LeagueAuthStateType string

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
	AuthStateLoginFailed    LeagueAuthStateType = "LOGIN_FAILED"
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
	app           *application.WebviewWindow
	riotClient    *riot.RiotClient
	isRunning     bool
	pollingTicker *time.Ticker
	logger        *utils.Logger

	leagueService *LeagueService
	// State management
	stateMutex   sync.RWMutex
	currentState *LeagueClientState
}

func NewClientMonitor(leagueService *LeagueService, riotClient *riot.RiotClient, logger *utils.Logger) *ClientMonitor {
	logger.Info("Creating new client monitor")
	initialState := &LeagueClientState{
		ClientState: ClientStateClosed,
		AuthState:   AuthStateNone,
		LastUpdated: time.Now(),
	}

	return &ClientMonitor{
		app:           nil,
		logger:        logger,
		leagueService: leagueService,
		riotClient:    riotClient,
		isRunning:     false,
		currentState:  initialState,
		stateMutex:    sync.RWMutex{},
	}
}

// GetCurrentState returns the current state (thread-safe)
func (m *ClientMonitor) GetCurrentState() *LeagueClientState {
	m.stateMutex.RLock()
	defer m.stateMutex.RUnlock()

	// Return a copy to prevent race conditions
	stateCopy := *m.currentState
	return &stateCopy
}

// updateState updates the state and emits an event if changed
func (m *ClientMonitor) updateState(newState *LeagueClientState) {
	m.stateMutex.Lock()
	defer m.stateMutex.Unlock()

	stateChanged := m.currentState.ClientState != newState.ClientState ||
		m.currentState.AuthState != newState.AuthState

	if stateChanged {
		// Change from Info to Infow for structured logging
		m.logger.Sugar().Infof("State changed",
			"prevClientState", m.currentState.ClientState,
			"newClientState", newState.ClientState,
			"prevAuthState", m.currentState.AuthState,
			"newAuthState", newState.AuthState)

		newState.LastUpdated = time.Now()
		m.currentState = newState

		// Emit event to frontend
		if m.app != nil {
			m.app.EmitEvent(EventLeagueStateChanged, newState)
		}
	}
}

// UpdateAuthState updates the authentication state
func (m *ClientMonitor) UpdateAuthState(authState LeagueAuthStateType, errorMsg string, username string) {
	currentState := m.GetCurrentState()

	newState := &LeagueClientState{
		ClientState:  currentState.ClientState,
		AuthState:    authState,
		ErrorMessage: errorMsg,
		Username:     username,
		LastUpdated:  time.Now(),
	}

	m.updateState(newState)
}

func (m *ClientMonitor) checkClientState() {
	// Check if client is running
	isRiotClientRunning := m.riotClient.IsRunning()
	isLeagueClientRunning := m.leagueService.IsRunning()
	isLoggedIn := false
	isLoginReady := false

	currentState := m.GetCurrentState()
	newState := &LeagueClientState{
		ClientState:  currentState.ClientState,
		AuthState:    currentState.AuthState,
		ErrorMessage: currentState.ErrorMessage,
		Username:     currentState.Username,
	}

	// Special case: If LeagueService client is running and we were previously logged in,
	// maintain the logged in state even if Riot client is closed
	if isLeagueClientRunning && currentState.ClientState == ClientStateLoggedIn {
		m.logger.Sugar().Infof("LeagueService client running with previous logged-in state, maintaining state",
			"leagueClientRunning", isLeagueClientRunning,
			"riotClientRunning", isRiotClientRunning)
		return
	}

	// Get detailed client state if running
	if isRiotClientRunning {
		if !m.riotClient.IsClientInitialized() {
			m.logger.Info("Client running but not initialized, initializing...")
			err := m.riotClient.InitializeRestyClient()
			if err != nil {
				// Change from Error to Errorw for structured logging
				m.logger.Error("Error initializing client", zap.Error(err))
				return
			}
			m.logger.Info("Client initialized successfully")
		}

		userinfo, userinfoErr := m.riotClient.GetUserinfo()
		isLoggedIn = userinfoErr == nil

		if isLoggedIn && userinfo != nil {
			newState.Username = userinfo.Username
		}

		authError := m.riotClient.IsAuthStateValid()
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
		m.logger.Info("Client was logged in but now requires login again, resetting auth state")
		newState.AuthState = AuthStateNone
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
	m.updateState(newState)
}

func (m *ClientMonitor) Start() {
	if m.isRunning {
		return
	}

	m.logger.Info("Starting LeagueService client monitor")
	m.isRunning = true
	m.pollingTicker = time.NewTicker(200 * time.Millisecond)

	go func() {
		for {
			select {
			case <-m.pollingTicker.C:
				m.checkClientState()
			}
		}
	}()
}

// Backend methods for frontend actions
func (m *ClientMonitor) HandleCaptcha(username string, password string) error {
	m.UpdateAuthState(AuthStateWaitingCaptcha, "", username)

	// Existing captcha handling logic...
	err := m.riotClient.InitializeCaptchaHandling()
	if err != nil {
		m.UpdateAuthState(AuthStateLoginFailed, err.Error(), username)
		return err
	}

	return nil
}
func (m *ClientMonitor) SetWindow(window *application.WebviewWindow) {
	m.app = window
}
func (m *ClientMonitor) Stop() {
	if !m.isRunning {
		return
	}

	m.logger.Info("Stopping LeagueService client monitor")
	m.pollingTicker.Stop()
	m.isRunning = false
}
func (m *ClientMonitor) HandleLogin(username string, password string, captchaToken string) error {
	m.UpdateAuthState(AuthStateWaitingLogin, "", username)

	// Existing login logic...
	_, err := m.riotClient.LoginWithCaptcha(username, password, captchaToken)
	if err != nil {
		m.UpdateAuthState(AuthStateLoginFailed, err.Error(), username)
		return err
	}

	// Update state will happen in the polling routine once login is detected
	return nil
}

func (m *ClientMonitor) LaunchClient() error {
	m.UpdateAuthState(AuthStateNone, "", "")

	// Existing launch logic...
	err := m.riotClient.Launch()
	if err != nil {
		return err
	}

	return nil
}
