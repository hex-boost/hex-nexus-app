package league

import (
	"context"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/league/account"
	websocketEvents "github.com/hex-boost/hex-nexus-app/backend/league/websocket/event"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/riot/auth"
	"github.com/hex-boost/hex-nexus-app/backend/riot/captcha"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"go.uber.org/zap"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

type LeagueClientStateType string
type AccountUpdateStatus struct {
	Username  string
	IsUpdated bool
}

// Define client state constants
const (
	ClientStateNone LeagueClientStateType = ""

	ClientStateClosed         LeagueClientStateType = "CLOSED"
	ClientStateLoginReady     LeagueClientStateType = "LOGIN_READY"
	ClientStateLoggedIn       LeagueClientStateType = "LOGGED_IN"
	ClientStateWaitingCaptcha LeagueClientStateType = "WAITING_CAPTCHA"
	ClientStateWaitingLogin   LeagueClientStateType = "WAITING_LOGIN"
)

// Define auth state constants

type LeagueClientState struct {
	ClientState LeagueClientStateType `json:"clientState"`
}

const (
	EventLeagueStateChanged = "league:state:changed"
)

type LeagueServicer interface {
	IsLCUConnectionReady() bool
	UpdateFromLCU(username string) error
	IsRunning() bool
	IsPlaying() bool
}

type AccountMonitorer interface {
	GetLoggedInUsername() string
	IsNexusAccount() bool
}
type AppEmitter interface {
	EmitEvent(name string, data ...any)
}
type Monitor struct {
	accountUpdateStatus   AccountUpdateStatus
	app                   AppEmitter
	riotAuth              auth.Authenticator
	isRunning             bool
	done                  chan struct{}
	pollingTicker         *time.Ticker
	logger                *logger.Logger
	captcha               *captcha.Captcha
	accountMonitor        AccountMonitorer
	leagueService         LeagueServicer
	stateMutex            sync.RWMutex
	captchaFlowInProgress atomic.Bool
	currentState          *LeagueClientState
	isCheckingState       atomic.Bool
	riotService           *riot.Service
}

func NewMonitor(logger *logger.Logger, accountMonitor *account.Monitor, leagueService LeagueServicer, riotAuth auth.Authenticator, captcha *captcha.Captcha) *Monitor {
	logger.Info("Creating new client monitor")
	initialState := &LeagueClientState{
		ClientState: ClientStateNone,
	}

	monitor := &Monitor{
		accountUpdateStatus: AccountUpdateStatus{
			Username:  "",
			IsUpdated: false,
		},
		app:            nil,
		done:           make(chan struct{}),
		accountMonitor: accountMonitor,
		captcha:        captcha,
		logger:         logger,
		leagueService:  leagueService,
		riotAuth:       riotAuth,
		isRunning:      false,
		currentState:   initialState,
		stateMutex:     sync.RWMutex{},
	}
	monitor.isCheckingState.Store(false)
	return monitor
}

// GetCurrentState returns the current state (thread-safe)
func (cm *Monitor) GetCurrentState() *LeagueClientState {
	cm.stateMutex.RLock()
	defer cm.stateMutex.RUnlock()

	// Return a copy to prevent race conditions
	stateCopy := *cm.currentState
	return &stateCopy
}

// updateState updates the state and emits an event if changed
func (cm *Monitor) updateState(newState *LeagueClientState) {
	cm.stateMutex.Lock()
	defer cm.stateMutex.Unlock()

	stateChanged := cm.currentState.ClientState != newState.ClientState

	if stateChanged {
		// Change from Info to Infow for structured logging
		cm.logger.Sugar().Infow("State changed",
			"prevClientState", cm.currentState.ClientState,
			"newClientState", newState.ClientState,
		)

		cm.currentState = newState

		// Emit event to frontend
		if cm.app != nil {
			cm.app.EmitEvent(EventLeagueStateChanged, newState)
		}
	}
}

// checkClientState coordinates the client state checking process
func (cm *Monitor) checkClientState() {
	if !cm.isCheckingState.CompareAndSwap(false, true) {
		return
	}
	defer cm.isCheckingState.Store(false)
	previousState := cm.GetCurrentState()
	// Get system state
	isRiotClientRunning := cm.riotService.IsRunning()
	isLeagueClientRunning := cm.leagueService.IsRunning()
	isPlayingLeague := cm.leagueService.IsPlaying()

	var authType string
	if isRiotClientRunning {
		if !cm.riotAuth.IsClientInitialized() {
			cm.initializeRiotClient()
		}
		authState, _ := cm.riotAuth.GetAuthenticationState()
		if authState != nil {
			authType = authState.Type
		}
	}

	isLoggedIn := isPlayingLeague || isLeagueClientRunning || authType == "success"
	isLoginReady := isRiotClientRunning && cm.riotAuth.IsAuthStateValid() == nil && !isLoggedIn

	// Determine client state
	newState := cm.determineClientState(
		isRiotClientRunning,
		isLeagueClientRunning,
		isLoggedIn,
		isLoginReady,
		isPlayingLeague,
		previousState,
	)

	cm.updateState(newState)
	if isLeagueClientRunning && !cm.accountUpdateStatus.IsUpdated {
		cm.checkAndUpdateAccount()
	} else if cm.currentState.ClientState != ClientStateLoggedIn && cm.accountUpdateStatus.IsUpdated {
		cm.resetAccountUpdateStatus()
	}
}

func (cm *Monitor) WaitUntilAuthenticationIsReady(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	checkInterval := 100 * time.Millisecond

	for time.Now().Before(deadline) {
		currentState := cm.GetCurrentState()
		if currentState.ClientState != ClientStateLoginReady {
			continue
		}
		time.Sleep(checkInterval)
		return nil
	}

	return errors.New("timeout waiting for Riot client to initialize")
}

// determineClientState determines the current client state based on system conditions
func (cm *Monitor) determineClientState(
	isRiotClientRunning bool,
	isLeagueClientRunning bool,
	isLoggedIn bool,
	isLoginReady bool,
	isPlayingLeague bool,
	previousState *LeagueClientState,
) *LeagueClientState {
	currentState := cm.GetCurrentState()
	newState := &LeagueClientState{
		ClientState: currentState.ClientState,
	}

	newState.ClientState = cm.calculateClientState(
		isRiotClientRunning,
		isLeagueClientRunning,
		isLoggedIn,
		isPlayingLeague,
		isLoginReady,
		currentState,
		previousState,
	)

	return newState
}

// calculateClientState determines the client state based on inputs
func (cm *Monitor) calculateClientState(
	isRiotClientRunning bool,

	isLeagueClientRunning bool,
	isLoggedIn bool,
	isPlayingLeague bool,
	isLoginReady bool,
	currentState *LeagueClientState,
	previousState *LeagueClientState,
) LeagueClientStateType {
	if currentState.ClientState == ClientStateWaitingLogin {
		if isRiotClientRunning && !cm.riotAuth.IsClientInitialized() {
			err := cm.riotAuth.InitializeClient()
			if err != nil {
				cm.logger.Error("Error initializing client", zap.Error(err))
				return ClientStateWaitingLogin
			}
		}
		authState, err := cm.riotAuth.GetAuthenticationState()
		if err != nil {
			return ClientStateWaitingLogin
		}
		if authState.Type == "success" {
			cm.logger.Info("Auth state success, user is logged in")
			return ClientStateLoggedIn
		}

	}
	if currentState.ClientState == ClientStateWaitingCaptcha {
		cm.logger.Info("Waiting for captcha response")
		return ClientStateWaitingCaptcha
	}
	if isLoggedIn || isPlayingLeague || isLeagueClientRunning {

		return ClientStateLoggedIn
	}
	if isLoginReady && previousState.ClientState == ClientStateClosed {
		time.Sleep(4 * time.Second)
		return ClientStateLoginReady
	} else if isLoginReady && previousState.ClientState == ClientStateLoggedIn {
		time.Sleep(1 * time.Second)
		return ClientStateLoginReady
	} else if isLoginReady {
		return ClientStateLoginReady
	}
	return ClientStateClosed
}

// initializeRiotClient initializes the Riot client if needed
func (cm *Monitor) initializeRiotClient() {
	cm.logger.Debug("Client running but not initialized, initializing...")
	err := cm.riotAuth.InitializeClient()
	if err != nil {
		cm.logger.Error("Error initializing client", zap.Error(err))
		return
	}
	cm.logger.Info("Client initialized successfully")
}

// checkAndUpdateAccount checks and updates account information if needed
func (cm *Monitor) checkAndUpdateAccount() {
	if !cm.leagueService.IsLCUConnectionReady() || !cm.accountMonitor.IsNexusAccount() {
		return
	}

	loggedInUsername := cm.accountMonitor.GetLoggedInUsername()
	if loggedInUsername == "" {
		return
	}

	// Check if we need to update
	if cm.accountUpdateStatus.IsUpdated &&
		strings.ToLower(cm.accountUpdateStatus.Username) == loggedInUsername {
		return
	}

	cm.logger.Sugar().Infow("Checking account update status",
		"currentUsername", loggedInUsername,
		"lastUpdatedUsername", cm.accountUpdateStatus.Username,
		"isUpdated", cm.accountUpdateStatus.IsUpdated)

	err := cm.leagueService.UpdateFromLCU(loggedInUsername)
	if err != nil {
		cm.logger.Error("Error updating account from LCU", zap.Error(err))
		return
	}

	// Update status
	cm.stateMutex.Lock()
	cm.accountUpdateStatus.IsUpdated = true
	cm.accountUpdateStatus.Username = strings.ToLower(loggedInUsername)
	cm.app.EmitEvent(websocketEvents.LeagueWebsocketStart)
	cm.stateMutex.Unlock()

	cm.logger.Info("Account successfully updated", zap.String("username", loggedInUsername))
}

// resetAccountUpdateStatus resets the account update status
func (cm *Monitor) resetAccountUpdateStatus() {
	cm.logger.Info("Resetting account update status",
		zap.Any("oldUpdateStatus", cm.accountUpdateStatus))

	cm.stateMutex.Lock()
	cm.accountUpdateStatus.IsUpdated = false
	cm.accountUpdateStatus.Username = ""
	cm.app.EmitEvent(websocketEvents.LeagueWebsocketStop)
	cm.stateMutex.Unlock()
}
func (cm *Monitor) Start() {
	if cm.isRunning {
		return
	}

	cm.logger.Info("Starting Service client monitor")

	// Use a done channel for signaling shutdown
	done := make(chan struct{})
	cm.pollingTicker = time.NewTicker(500 * time.Millisecond)

	cm.stateMutex.Lock()
	cm.isRunning = true
	cm.done = done
	cm.stateMutex.Unlock()

	go func() {
		for {
			select {
			case <-cm.pollingTicker.C:
				cm.checkClientState()
			case <-done:
				cm.logger.Debug("Client monitor polling stopped")
				return
			}
		}
	}()
}

func (cm *Monitor) Stop() {
	cm.stateMutex.Lock()
	defer cm.stateMutex.Unlock()

	if !cm.isRunning {
		return
	}

	cm.logger.Info("Stopping Service client monitor")
	close(cm.done)
	cm.pollingTicker.Stop()
	cm.isRunning = false
}

// OpenWebviewAndGetToken opens a webview for captcha and returns the token
func (cm *Monitor) OpenWebviewAndGetToken() (string, error) {
	// Check if captcha flow is already in progress
	if !cm.captchaFlowInProgress.CompareAndSwap(false, true) {
		cm.logger.Warn("Captcha flow already in progress")
		return "", errors.New("captcha_already_in_progress")
	}
	cleanup := func() {
		cm.captchaFlowInProgress.Store(false)
	}
	defer cleanup()
	newState := &LeagueClientState{
		ClientState: ClientStateWaitingCaptcha,
	}
	cm.updateState(newState)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Initialize captcha handling
	if err := cm.setupCaptcha(); err != nil {
		return "", err
	}

	// Get or create webview
	webview, err := cm.prepareWebview()
	if err != nil {
		return "", err
	}
	cancelEvent := webview.OnWindowEvent(events.Windows.WebViewNavigationCompleted, func(event *application.WindowEvent) {
		cm.logger.Info("Webview navigation completed")
		time.Sleep(500 * time.Millisecond)
		webview.Show()
		webview.Focus()
	})
	defer cancelEvent()

	webview.Reload()
	response, err := cm.executeCaptchaFlow(ctx, webview)
	if err != nil {

		cm.captcha.Reset()
		return "", err
	}
	return response, nil
}

// setupCaptcha initializes captcha handling
func (cm *Monitor) setupCaptcha() error {
	err := cm.riotAuth.SetupCaptchaVerification()
	if err != nil {
		cm.updateState(&LeagueClientState{
			ClientState: ClientStateLoginReady,
		})
		return err
	}
	return nil
}

// prepareWebview prepares the webview for captcha
func (cm *Monitor) prepareWebview() (*application.WebviewWindow, error) {
	webview, err := cm.captcha.GetWebView()
	if err != nil {
		cm.logger.Error("Error getting captcha webview", zap.Error(err))
		cm.updateState(&LeagueClientState{
			ClientState: ClientStateLoginReady,
		})
		return nil, err
	}
	return webview, nil
}

// executeCaptchaFlow executes the captcha flow and returns the token
func (cm *Monitor) executeCaptchaFlow(ctx context.Context, webview *application.WebviewWindow) (string, error) {
	tokenChan := make(chan string)
	errChan := make(chan error, 1)

	// Register window closing handler
	cancel := webview.RegisterHook(events.Windows.WindowClosing, func(eventCtx *application.WindowEvent) {
		cm.logger.Info("Window closing event triggered")
		eventCtx.Cancel()
		errChan <- errors.New("captcha_cancelled")
		webview.Hide()
	})
	defer cancel()

	go cm.handleCaptchaProcess(ctx, webview, tokenChan, errChan)

	// Wait for results
	select {
	case <-ctx.Done():
		cm.logger.Info("Captcha flow timed out")
		return "", errors.New("captcha_timeout")
	case err := <-errChan:
		cm.handleCaptchaCancellation()
		if err.Error() == "captcha_cancelled" {
			cm.logger.Info("Captcha flow cancelled by user")
			return "", err
		}
		return "", err
	case token := <-tokenChan:
		return token, nil
	}
}

// handleCaptchaProcess handles the captcha process
func (cm *Monitor) handleCaptchaProcess(ctx context.Context, webview *application.WebviewWindow, tokenChan chan string, errChan chan error) {
	captchaResponse, err := cm.captcha.WaitAndGetCaptchaResponse(ctx, 15*time.Second)
	webview.Hide()

	if err != nil {
		cm.logger.Error("Error in captcha flow", zap.Error(err))
		cm.updateState(&LeagueClientState{
			ClientState: ClientStateLoginReady,
		})
		errChan <- err
		return
	}

	tokenChan <- captchaResponse
}

// handleCaptchaCancellation handles captcha cancellation
func (cm *Monitor) handleCaptchaCancellation() {
	cm.logger.Info("Webview was closed by user")
	cm.updateState(&LeagueClientState{
		ClientState: ClientStateLoginReady,
	})
}
func (cm *Monitor) SetWindow(app *application.App) {
	cm.app = app
}

func (cm *Monitor) HandleLogin(username string, password string, captchaToken string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	newState := &LeagueClientState{
		ClientState: ClientStateWaitingLogin,
	}
	cm.updateState(newState)
	_, err := cm.riotAuth.LoginWithCaptcha(ctx, username, password, captchaToken)

	// Reset authentication state if there's any error (including timeout)
	if err != nil {
		cm.logger.Error("Login failed", zap.Error(err))

		newState := &LeagueClientState{
			ClientState: ClientStateLoginReady,
		}

		cm.updateState(newState)

		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			return fmt.Errorf("login operation timed out: %w", err)
		}

		return err
	}

	return nil
}

func (lc *Service) IsLCUConnectionReady() bool {
	// Ensure client is initialized
	if !lc.LCUconnection.IsClientInitialized() {
		err := lc.LCUconnection.Initialize()
		if err != nil {
			return false
		}
	}

	return lc.LCUconnection.IsClientInitialized()
}
