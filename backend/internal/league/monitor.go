package league

import (
	"context"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	websocketEvents "github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/event"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"go.uber.org/zap"
)

type (
	LeagueClientStateType string
)

// Define client state constants
const (
	ClientStateNone LeagueClientStateType = ""

	ClientStateClosed         LeagueClientStateType = "CLOSED"
	ClientStateLoginReady     LeagueClientStateType = "LOGIN_READY"
	ClientStateLoggedIn       LeagueClientStateType = "LOGGED_IN"
	ClientStateWaitingCaptcha LeagueClientStateType = "WAITING_CAPTCHA"
	ClientStateWaitingLogin   LeagueClientStateType = "WAITING_LOGIN"
)

// WebviewWindower defines the interface for WebviewWindow operations used in the League Monitor
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
	GetLoggedInUsername(lastUsername string) string
	IsNexusAccount() bool
}
type AppEmitter interface {
	EmitEvent(name string, data ...any)
}

type AccountState interface {
	Get() *types.PartialSummonerRented
	Update(update *types.PartialSummonerRented) (*types.PartialSummonerRented, error)
}

type Authenticator interface {
	LoginWithCaptcha(ctx context.Context, username string, password string, captchaToken string) (string, error)
	GetAuthenticationState() (*types.RiotIdentityResponse, error)
	IsAuthStateValid() error
	Logout() error

	SetupCaptchaVerification() error

	IsClientInitialized() bool
	InitializeClient() error
}

// Captcha Add this interface to monitor.go
// Captcha interface in monitor.go
type Captcha interface {
	GetWebView() (types.WebviewWindower, error)
	WaitAndGetCaptchaResponse(ctx context.Context, timeout time.Duration) (string, error)
	Reset()
}
type Monitor struct {
	isFirstUpdated        bool
	app                   AppEmitter
	riotAuth              Authenticator
	isRunning             bool
	done                  chan struct{}
	pollingTicker         *time.Ticker
	logger                *logger.Logger
	captcha               Captcha
	accountMonitor        AccountMonitorer
	leagueService         LeagueServicer
	stateMutex            sync.RWMutex
	accountState          AccountState
	captchaFlowInProgress atomic.Bool
	currentState          *LeagueClientState
	eventMutex            sync.Mutex
	isCheckingState       atomic.Bool
	riotService           *riot.Service
}

func NewMonitor(logger *logger.Logger, accountMonitor AccountMonitorer, leagueService LeagueServicer, riotAuth Authenticator, captcha Captcha, accountState AccountState) *Monitor {
	logger.Info("Creating new client monitor")
	initialState := &LeagueClientState{
		ClientState: ClientStateNone,
	}

	monitor := &Monitor{
		isFirstUpdated: false,
		done:           make(chan struct{}),
		accountMonitor: accountMonitor,
		accountState:   accountState,
		captcha:        captcha,
		logger:         logger,
		leagueService:  leagueService,
		riotAuth:       riotAuth,
		isRunning:      false,
		currentState:   initialState,
		stateMutex:     sync.RWMutex{},
		eventMutex:     sync.Mutex{},
	}
	monitor.isCheckingState.Store(false)

	logger.Info("Creating new client monitor")
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
		cm.logger.Sugar().Infow("State changed",
			"prevClientState", cm.currentState.ClientState,
			"newClientState", newState.ClientState,
		)

		cm.currentState = newState

		// Emit event to frontend
		if cm.app != nil {
			cm.emitEvent(EventLeagueStateChanged, newState)
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

	// Handle account state updates based on client state changes
	if newState.ClientState == ClientStateLoggedIn && isLeagueClientRunning && !cm.isFirstUpdated {
		// Only update account once when logged in
		cm.checkAndUpdateAccount()
	} else if newState.ClientState != ClientStateLoggedIn && cm.isFirstUpdated {
		// Reset when logged out
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

	// Only proceed if League client connection is ready
	if !cm.leagueService.IsLCUConnectionReady() {
		return
	}
	accountState := cm.accountState.Get()

	loggedInUsername := cm.accountMonitor.GetLoggedInUsername(accountState.Username)
	if loggedInUsername == "" {
		cm.logger.Info("No username detected, skipping account update")
		return
	}
	loggedInUsername = strings.ToLower(loggedInUsername)

	cm.logger.Sugar().Infow("Updating account status",
		"username", loggedInUsername,
		"previousUsername", accountState.Username)

	// Update username in account state
	partialUpdate := &types.PartialSummonerRented{
		Username: loggedInUsername,
	}
	_, err := cm.accountState.Update(partialUpdate)
	if err != nil {
		cm.logger.Error("Error updating account state with username", zap.Error(err))
		return
	}

	err = cm.leagueService.UpdateFromLCU(loggedInUsername)
	if err != nil {
		cm.logger.Error("Error updating account from LCU", zap.Error(err))
		return
	}

	// Update status
	cm.stateMutex.Lock()
	cm.isFirstUpdated = true
	_, err = cm.accountState.Update(&types.PartialSummonerRented{Username: strings.ToLower(loggedInUsername)})
	if err != nil {
		cm.logger.Error("Error updating account state with username", zap.Error(err))
		return
	}

	cm.emitEvent(websocketEvents.LeagueWebsocketStart)
	cm.stateMutex.Unlock()

	cm.logger.Info("Account successfully updated", zap.String("username", loggedInUsername))
}
func (cm *Monitor) emitEvent(name string, data ...any) {
	cm.eventMutex.Lock()
	defer cm.eventMutex.Unlock()

	if cm.app != nil {
		cm.app.EmitEvent(name, data...)
	}

}

// resetAccountUpdateStatus resets the account update status
func (cm *Monitor) resetAccountUpdateStatus() {
	cm.logger.Info("Resetting account update status")

	cm.stateMutex.Lock()
	cm.isFirstUpdated = false
	_, err := cm.accountState.Update(&types.PartialSummonerRented{Username: ""})
	if err != nil {
		cm.logger.Error("Error clearing username in account state", zap.Error(err))
	}
	cm.emitEvent(websocketEvents.LeagueWebsocketStop)
	cm.stateMutex.Unlock()
}

func (cm *Monitor) Start(app AppEmitter) {
	if cm.isRunning {
		return
	}
	cm.app = app

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
	webview, err := cm.PrepareWebview()
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

// PrepareWebview prepares the webview for captcha
func (cm *Monitor) PrepareWebview() (types.WebviewWindower, error) {
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
func (cm *Monitor) executeCaptchaFlow(ctx context.Context, webview types.WebviewWindower) (string, error) {
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
func (cm *Monitor) handleCaptchaProcess(ctx context.Context, webview types.WebviewWindower, tokenChan chan string, errChan chan error) {
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

func (s *Service) IsLCUConnectionReady() bool {
	// Ensure client is initialized
	if !s.LCUconnection.IsClientInitialized() {
		err := s.LCUconnection.Initialize()
		if err != nil {
			return false
		}
	}

	return s.LCUconnection.IsClientInitialized()
}
