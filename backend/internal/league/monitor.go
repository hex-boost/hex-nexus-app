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
	SetNexusAccount(bool)
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
type RiotServicer interface {
	IsRunning() bool
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
	riotService           RiotServicer
}

func NewMonitor(logger *logger.Logger, accountMonitor AccountMonitorer, leagueService LeagueServicer, riotAuth Authenticator, captcha Captcha, accountState AccountState, riotService RiotServicer) *Monitor {
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
		riotService:    riotService,
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
		if newState.ClientState == ClientStateClosed || newState.ClientState == ClientStateLoginReady {
			cm.logger.Debug("Resetting isNexusAccount to false due to client state",
				zap.String("clientState", string(newState.ClientState)))
			cm.accountMonitor.SetNexusAccount(false)
		}

		cm.emitEvent(EventLeagueStateChanged, newState)
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

	var authState *types.RiotIdentityResponse
	var authStateErr error
	var isRiotClientInitialized bool
	authType := "unknown" // Default

	if isRiotClientRunning {
		isRiotClientInitialized = cm.riotAuth.IsClientInitialized()
		if !isRiotClientInitialized {
			// Attempt initialization only if needed
			cm.logger.Debug("Riot client running but not initialized, attempting initialization...")
			initErr := cm.riotAuth.InitializeClient()
			if initErr != nil {
				cm.logger.Error("Error initializing Riot client during check", zap.Error(initErr))
				// Proceed, but auth state might be unreliable
			} else {
				cm.logger.Info("Riot client initialized successfully during check")
				isRiotClientInitialized = true // Update status after successful init
			}
		}

		// Only check auth state if client is (now) initialized
		if isRiotClientInitialized {
			authState, authStateErr = cm.riotAuth.GetAuthenticationState()
			if authStateErr != nil {
				cm.logger.Warn("Error getting Riot authentication state", zap.Error(authStateErr))
				// Continue, authType remains "unknown" or based on previous state logic
			} else if authState != nil {
				authType = authState.Type // e.g., "success", "pending", "error"
			} else {
				cm.logger.Warn("GetAuthenticationState returned nil response and nil error")
				// authType remains "unknown"
			}
		} else {
			cm.logger.Debug("Riot client not initialized, skipping auth state checks")
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

	if isLoginReady {
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
		cm.logger.Warn("League client connection not ready, skipping account update")
		return
	}
	accountState := cm.accountState.Get()

	loggedInUsername := cm.accountMonitor.GetLoggedInUsername(accountState.Username)
	if loggedInUsername == "" {
		cm.logger.Info("No username detected via accountMonitor, skipping account update")
		return
	}
	loggedInUsername = strings.ToLower(loggedInUsername)

	// Check if update is actually needed (username changed)
	if accountState.Username == loggedInUsername && cm.isFirstUpdated { // Also check isFirstUpdated flag
		cm.logger.Debug("Username already matches and first update done, skipping redundant account update", zap.String("username", loggedInUsername))
		return
	}

	cm.logger.Sugar().Infow("Attempting to update account status",
		"detectedUsername", loggedInUsername,
		"previousUsername", accountState.Username)

	// Update username in account state
	partialUpdate := &types.PartialSummonerRented{
		Username: loggedInUsername,
	}
	_, err := cm.accountState.Update(partialUpdate)
	if err != nil {
		cm.logger.Error("Error updating account state with username", zap.Error(err), zap.String("username", loggedInUsername))
		// Decide if you should return here or try LCU update anyway
		// return // Maybe return here to prevent further actions on failed state update
	}

	// Update from LCU (might fetch more details)
	err = cm.leagueService.UpdateFromLCU(loggedInUsername)
	if err != nil {
		cm.logger.Error("Error updating account from LCU", zap.Error(err), zap.String("username", loggedInUsername))
		// Don't set isFirstUpdated if LCU update fails? Or maybe allow it? Depends on requirements.
		// Consider *not* setting isFirstUpdated = true if this fails.
		return // Return on LCU update failure
	}

	// --- Update status and emit event ---
	// Use a temporary flag to check if we actually updated the state
	updated := false
	cm.stateMutex.Lock()
	if !cm.isFirstUpdated { // Only set to true once
		cm.isFirstUpdated = true
		updated = true // Mark that we updated the flag
		cm.logger.Info("Marking account as updated for the first time (isFirstUpdated = true)")
	}
	// Ensure username is correctly set in state (might be redundant if Update worked, but safe)
	// This part seems redundant if the earlier accountState.Update succeeded.
	// Consider removing this second update call unless strictly necessary.
	/*
		_, err = cm.accountState.Update(&types.PartialSummonerRented{Username: loggedInUsername}) // Already lowercased
		if err != nil {
			cm.logger.Error("Error during final account state username update", zap.Error(err))
			// Handle error - maybe revert isFirstUpdated?
		}
	*/
	cm.stateMutex.Unlock()

	// Only emit start event if we actually marked as updated
	if updated {
		cm.emitEvent(websocketEvents.LeagueWebsocketStart)
	}

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
		cm.logger.Warn("Monitor Start called but already running")
		return
	}
	cm.app = app

	cm.logger.Info("Starting Service client monitor")

	// Use a done channel for signaling shutdown
	done := make(chan struct{})
	// Consider making the polling interval configurable or slightly longer (e.g., 750ms-1s)
	// if 500ms proves too fast and causes flapping due to intermediate states.
	cm.pollingTicker = time.NewTicker(750 * time.Millisecond)

	cm.stateMutex.Lock()
	cm.isRunning = true
	cm.done = done
	cm.stateMutex.Unlock()

	go func() {
		cm.logger.Info("Client monitor polling goroutine started")
		for {
			select {
			case <-cm.pollingTicker.C:
				// Wrap the check in a function to easily use defer for panic recovery if needed
				func() {

					defer func() {
						if r := recover(); r != nil {
							cm.logger.Error("Panic recovered in checkClientState loop", zap.Any("panicValue", r), zap.Stack("stack"))
						}
					}()
					cm.checkClientState()
				}()
			case <-done:
				cm.logger.Info("Client monitor polling goroutine stopping.")
				return
			}
		}
	}()
}
func (cm *Monitor) Stop() {
	cm.stateMutex.Lock()
	// defer cm.stateMutex.Unlock() // Defer unlock *after* checking isRunning

	if !cm.isRunning {
		cm.logger.Warn("Monitor Stop called but not running")
		cm.stateMutex.Unlock() // Unlock if not running
		return
	}

	cm.logger.Info("Stopping Service client monitor")
	close(cm.done)          // Signal the goroutine to stop
	cm.pollingTicker.Stop() // Stop the ticker
	cm.isRunning = false
	cm.stateMutex.Unlock() // Unlock after modifications
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
		cm.logger.Error("riotAuth.SetupCaptchaVerification failed", zap.Error(err))
		// Reset state if setup fails
		cm.updateState(&LeagueClientState{
			ClientState: ClientStateLoginReady, // Or CLOSED? Depends on desired state after failure
		})
		return fmt.Errorf("captcha setup failed: %w", err)
	}
	cm.logger.Debug("Captcha verification setup successful")
	return nil
}

// PrepareWebview prepares the webview for captcha
func (cm *Monitor) PrepareWebview() (types.WebviewWindower, error) {
	webview, err := cm.captcha.GetWebView()
	if err != nil {
		cm.logger.Error("Error getting captcha webview from captcha service", zap.Error(err))
		// Reset state if webview cannot be obtained
		cm.updateState(&LeagueClientState{
			ClientState: ClientStateLoginReady, // Or CLOSED?
		})
		return nil, fmt.Errorf("failed to get webview: %w", err)
	}
	cm.logger.Debug("Captcha webview obtained successfully")
	return webview, nil
}

// executeCaptchaFlow executes the captcha flow and returns the token
func (cm *Monitor) executeCaptchaFlow(ctx context.Context, webview types.WebviewWindower) (string, error) {
	cm.logger.Debug("Executing captcha flow")
	tokenChan := make(chan string, 1) // Buffered channel
	errChan := make(chan error, 1)    // Buffered channel

	// Register window closing hook
	cm.logger.Debug("Registering window closing hook")
	cancelHook := webview.RegisterHook(events.Windows.WindowClosing, func(eventCtx *application.WindowEvent) {
		cm.logger.Info("Window closing event hook triggered by user")
		eventCtx.Cancel() // Prevent default close
		// Send cancellation error non-blockingly
		select {
		case errChan <- errors.New("captcha_cancelled"):
			cm.logger.Debug("Sent captcha_cancelled error to channel")
		default:
			cm.logger.Warn("Could not send captcha_cancelled error, channel likely full or closed")
		}
		webview.Hide() // Hide the window immediately
	})
	defer func() {
		cm.logger.Debug("Unregistering window closing hook")
		cancelHook() // Ensure hook is removed
	}()

	// Start the captcha waiting process in a goroutine
	go cm.handleCaptchaProcess(ctx, webview, tokenChan, errChan)

	// Wait for results or timeout/cancellation
	select {
	case <-ctx.Done():
		cm.logger.Warn("Captcha flow context timed out or cancelled", zap.Error(ctx.Err()))
		cm.handleCaptchaCancellation() // Ensure state is reset on timeout
		// Check context error type
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			return "", errors.New("captcha_timeout")
		}
		return "", fmt.Errorf("captcha context cancelled: %w", ctx.Err()) // Other cancellation reason
	case err := <-errChan:
		cm.logger.Warn("Received error from captcha process", zap.Error(err))
		// handleCaptchaCancellation is called specifically for user cancel,
		// but ensure state reset for other errors too via handleCaptchaProcess.
		if err.Error() == "captcha_cancelled" {
			cm.handleCaptchaCancellation() // Specific handling for user closing window
			cm.logger.Info("Captcha flow cancelled by user closing window.")
		} else {
			// State should have been reset in handleCaptchaProcess for other errors
			cm.logger.Error("Captcha flow failed with an internal error.", zap.Error(err))
		}
		return "", err // Return the specific error
	case token := <-tokenChan:
		cm.logger.Info("Received captcha token successfully")
		// Don't hide webview here, handleCaptchaProcess should do it
		return token, nil
	}
}

// handleCaptchaProcess handles the captcha process
func (cm *Monitor) handleCaptchaProcess(ctx context.Context, webview types.WebviewWindower, tokenChan chan string, errChan chan error) {
	cm.logger.Debug("Starting WaitAndGetCaptchaResponse goroutine")
	// Use a shorter timeout here, relying on the outer context for the overall timeout
	captchaCtx, cancelCaptcha := context.WithTimeout(ctx, 25*time.Second) // Slightly less than outer timeout
	defer cancelCaptcha()

	captchaResponse, err := cm.captcha.WaitAndGetCaptchaResponse(captchaCtx, 25*time.Second)
	// Hide webview regardless of success or failure *after* the wait attempt
	cm.logger.Debug("Hiding webview after WaitAndGetCaptchaResponse attempt")
	webview.Hide()

	if err != nil {
		cm.logger.Error("Error waiting for captcha response", zap.Error(err))
		// Reset state to LoginReady on error
		cm.logger.Info("Updating state to LOGIN_READY due to captcha error")
		cm.updateState(&LeagueClientState{
			ClientState: ClientStateLoginReady,
		})
		// Send error non-blockingly
		select {
		case errChan <- fmt.Errorf("captcha process failed: %w", err):
			cm.logger.Debug("Sent captcha process error to channel")
		default:
			cm.logger.Warn("Could not send captcha process error, channel likely full or closed")
		}
		return
	}

	cm.logger.Info("Captcha response received successfully in goroutine")
	// Send token non-blockingly
	select {
	case tokenChan <- captchaResponse:
		cm.logger.Debug("Sent captcha token to channel")
	default:
		cm.logger.Warn("Could not send captcha token, channel likely full or closed")
		// If we can't send the token, it's an error state
		cm.updateState(&LeagueClientState{ClientState: ClientStateLoginReady})
		select {
		case errChan <- errors.New("failed to deliver captcha token"):
			cm.logger.Debug("Sent token delivery error to channel")
		default:
			cm.logger.Warn("Could not send token delivery error")
		}
	}
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
