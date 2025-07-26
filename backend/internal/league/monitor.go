package league

import (
	"context"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account"
	"github.com/hex-boost/hex-nexus-app/backend/types"
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

const (
	ClientStateNone LeagueClientStateType = ""

	ClientStateClosed         LeagueClientStateType = "CLOSED"
	ClientStateLoginReady     LeagueClientStateType = "LOGIN_READY"
	ClientStateLoggedIn       LeagueClientStateType = "LOGGED_IN"
	ClientStateWaitingCaptcha LeagueClientStateType = "WAITING_CAPTCHA"
	ClientStateWaitingLogin   LeagueClientStateType = "WAITING_LOGIN"
)

type LeagueClientState struct {
	ClientState LeagueClientStateType `json:"clientState"`
}

const (
	EventLeagueStateChanged = "league:state:changed"
)

type LeagueServicer interface {
	IsLCUConnectionReady() bool
	UpdateFromLCU() error
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
	IsNexusAccount() bool
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
	accountClient         *account.Client
}

func NewMonitor(logger *logger.Logger, accountMonitor AccountMonitorer, leagueService LeagueServicer, riotAuth Authenticator, captcha Captcha, accountState AccountState, riotService RiotServicer, accountClient *account.Client) *Monitor {

	logger.Debug("Creating new client monitor")
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
		accountClient:  accountClient,
	}
	monitor.isCheckingState.Store(false)

	return monitor
}

func (cm *Monitor) GetCurrentState() *LeagueClientState {
	cm.stateMutex.RLock()
	defer cm.stateMutex.RUnlock()

	stateCopy := *cm.currentState
	return &stateCopy
}

func (cm *Monitor) updateState(newState *LeagueClientState) {
	cm.stateMutex.Lock()
	defer cm.stateMutex.Unlock()

	stateChanged := cm.currentState.ClientState != newState.ClientState

	if stateChanged {
		cm.logger.Sugar().Debugf("State changed old: %s new: %s", cm.currentState.ClientState,
			newState.ClientState,
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

func (cm *Monitor) checkClientState() {

	if !cm.isCheckingState.CompareAndSwap(false, true) {
		return
	}
	defer cm.isCheckingState.Store(false)

	previousState := cm.GetCurrentState()
	currentState := previousState.ClientState

	if currentState == ClientStateWaitingCaptcha {
		return
	}

	if currentState == ClientStateWaitingLogin {

		if cm.riotAuth.IsClientInitialized() || cm.initializeRiotClientIfNeeded() {
			authState, err := cm.riotAuth.GetAuthenticationState()
			if err == nil && authState != nil && authState.Type == "success" {
				cm.logger.Info("Auth state success, user is logged in")
				cm.updateState(&LeagueClientState{ClientState: ClientStateLoggedIn})
				if !cm.isFirstUpdated || cm.accountMonitor.IsNexusAccount() {
					cm.checkAndUpdateAccount()
				}
			}
		}
		return
	}

	if cm.leagueService.IsRunning() || cm.leagueService.IsPlaying() {

		if currentState != ClientStateLoggedIn {
			cm.updateState(&LeagueClientState{ClientState: ClientStateLoggedIn})
		}

		if !cm.isFirstUpdated && cm.leagueService.IsLCUConnectionReady() && cm.accountMonitor.IsNexusAccount() {
			cm.checkAndUpdateAccount()
		}
		return
	}

	if cm.riotService.IsRunning() {
		isAuthStateValid := cm.riotAuth.IsAuthStateValid() == nil
		if isAuthStateValid {
			if currentState != ClientStateLoginReady {
				cm.updateState(&LeagueClientState{ClientState: ClientStateLoginReady})
			}
			return
		}
	}

	if currentState != ClientStateClosed {
		cm.updateState(&LeagueClientState{ClientState: ClientStateClosed})
		if cm.isFirstUpdated {
			cm.resetAccountUpdateStatus()
		}
	}
}
func (cm *Monitor) initializeRiotClientIfNeeded() bool {
	if !cm.riotAuth.IsClientInitialized() && cm.riotService.IsRunning() {
		cm.logger.Debug("Client running but not initialized, initializing...")
		err := cm.riotAuth.InitializeClient()
		if err != nil {
			cm.logger.Error("Error initializing client", zap.Error(err))
			return false
		}
		cm.logger.Info("Client initialized successfully")
		return true
	}
	return false
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

func (cm *Monitor) initializeRiotClient() {
	cm.logger.Debug("Client running but not initialized, initializing...")
	err := cm.riotAuth.InitializeClient()
	if err != nil {
		cm.logger.Error("Error initializing client", zap.Error(err))
		return
	}
	cm.logger.Info("Client initialized successfully")
}

func (cm *Monitor) checkAndUpdateAccount() {

	if !cm.leagueService.IsLCUConnectionReady() {
		return
	}
	cm.emitEvent(websocketEvents.LeagueWebsocketStart)
	accountState := cm.accountState.Get()

	loggedInUsername := cm.accountMonitor.GetLoggedInUsername(accountState.Username)
	if loggedInUsername == "" {
		cm.logger.Info("No username detected via accountMonitor, skipping account update")
		return
	}

	if accountState.Username == loggedInUsername && cm.isFirstUpdated {
		cm.logger.Debug("Username already matches and first update done, skipping redundant account update", zap.String("username", loggedInUsername))
		return
	}

	cm.logger.Sugar().Infow("Attempting to update account status",
		"detectedUsername", loggedInUsername,
		"previousUsername", accountState.Username)

	partialUpdate := &types.PartialSummonerRented{
		Username: loggedInUsername,
	}
	_, err := cm.accountState.Update(partialUpdate)
	if err != nil {
		cm.logger.Error("Error updating account state with username", zap.Error(err), zap.String("username", loggedInUsername))

	}

	err = cm.leagueService.UpdateFromLCU()
	if err != nil {
		cm.logger.Error("Error updating account from LCU", zap.Error(err), zap.String("username", loggedInUsername))

		return
	}

	cm.stateMutex.Lock()
	if !cm.isFirstUpdated {
		cm.isFirstUpdated = true
		cm.logger.Info("Marking account as updated for the first time (isFirstUpdated = true)")
	}

	cm.stateMutex.Unlock()

	cm.logger.Info("Account successfully updated", zap.String("username", loggedInUsername))
}
func (cm *Monitor) emitEvent(name string, data ...any) {
	cm.eventMutex.Lock()
	defer cm.eventMutex.Unlock()

	if cm.app != nil {
		application.InvokeSync(func() {
			cm.app.EmitEvent(name, data...)
		},
		)

	}

}

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

	done := make(chan struct{})

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

	if !cm.isRunning {
		cm.logger.Warn("Monitor Stop called but not running")
		cm.stateMutex.Unlock()
		return
	}

	cm.logger.Info("Stopping Service client monitor")
	close(cm.done)
	cm.pollingTicker.Stop()
	cm.isRunning = false
	cm.stateMutex.Unlock()
}

func (cm *Monitor) OpenWebviewAndGetToken() (string, error) {

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

	if err := cm.setupCaptcha(); err != nil {
		return "", err
	}

	webview, err := cm.PrepareWebview()
	if err != nil {
		return "", err
	}

	var showOnce sync.Once
	cancelEvent := webview.OnWindowEvent(events.Windows.WebViewNavigationCompleted, func(event *application.WindowEvent) {
		showOnce.Do(func() {
			cm.logger.Info("Webview navigation completed")
			time.Sleep(500 * time.Millisecond)
			webview.Show()
			webview.Focus()
		})
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

func (cm *Monitor) setupCaptcha() error {
	err := cm.riotAuth.SetupCaptchaVerification()
	if err != nil {
		cm.logger.Error("riotAuth.SetupCaptchaVerification failed", zap.Error(err))

		cm.updateState(&LeagueClientState{
			ClientState: ClientStateLoginReady,
		})
		return fmt.Errorf("captcha setup failed: %w", err)
	}
	cm.logger.Debug("Captcha verification setup successful")
	return nil
}

func (cm *Monitor) PrepareWebview() (types.WebviewWindower, error) {
	webview, err := cm.captcha.GetWebView()
	if err != nil {
		cm.logger.Error("Error getting captcha webview from captcha service", zap.Error(err))

		cm.updateState(&LeagueClientState{
			ClientState: ClientStateLoginReady,
		})
		return nil, fmt.Errorf("failed to get webview: %w", err)
	}
	cm.logger.Debug("Captcha webview obtained successfully")
	return webview, nil
}

func (cm *Monitor) executeCaptchaFlow(ctx context.Context, webview types.WebviewWindower) (string, error) {
	cm.logger.Debug("Executing captcha flow")
	tokenChan := make(chan string, 1)
	errChan := make(chan error, 1)

	cm.logger.Debug("Registering window closing hook")
	cancelHook := webview.RegisterHook(events.Windows.WindowClosing, func(eventCtx *application.WindowEvent) {
		cm.logger.Info("Window closing event hook triggered by user")
		eventCtx.Cancel()

		select {
		case errChan <- errors.New("captcha_cancelled"):
			cm.logger.Debug("Sent captcha_cancelled error to channel")
		default:
			cm.logger.Warn("Could not send captcha_cancelled error, channel likely full or closed")
		}
		webview.Hide()
	})
	defer func() {
		cm.logger.Debug("Unregistering window closing hook")
		cancelHook()
	}()

	go cm.handleCaptchaProcess(ctx, webview, tokenChan, errChan)

	select {
	case <-ctx.Done():
		cm.logger.Warn("Captcha flow context timed out or cancelled", zap.Error(ctx.Err()))
		cm.handleCaptchaCancellation()

		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			return "", errors.New("captcha_timeout")
		}
		return "", fmt.Errorf("captcha context cancelled: %w", ctx.Err())
	case err := <-errChan:
		cm.logger.Warn("Received error from captcha process", zap.Error(err))

		if err.Error() == "captcha_cancelled" {
			cm.handleCaptchaCancellation()
			cm.logger.Info("Captcha flow cancelled by user closing window.")
		} else {

			cm.logger.Error("Captcha flow failed with an internal error.", zap.Error(err))
		}
		return "", err
	case token := <-tokenChan:
		cm.logger.Info("Received captcha token successfully")

		return token, nil
	}
}

func (cm *Monitor) handleCaptchaProcess(ctx context.Context, webview types.WebviewWindower, tokenChan chan string, errChan chan error) {
	cm.logger.Debug("Starting WaitAndGetCaptchaResponse goroutine")

	captchaCtx, cancelCaptcha := context.WithTimeout(ctx, 25*time.Second)
	defer cancelCaptcha()

	captchaResponse, err := cm.captcha.WaitAndGetCaptchaResponse(captchaCtx, 25*time.Second)

	cm.logger.Debug("Hiding webview after WaitAndGetCaptchaResponse attempt")
	webview.Hide()

	if err != nil {
		cm.logger.Error("Error waiting for captcha response", zap.Error(err))

		cm.logger.Info("Updating state to LOGIN_READY due to captcha error")
		cm.updateState(&LeagueClientState{
			ClientState: ClientStateLoginReady,
		})

		select {
		case errChan <- fmt.Errorf("captcha process failed: %w", err):
			cm.logger.Debug("Sent captcha process error to channel")
		default:
			cm.logger.Warn("Could not send captcha process error, channel likely full or closed")
		}
		return
	}

	cm.logger.Info("Captcha response received successfully in goroutine")

	select {
	case tokenChan <- captchaResponse:
		cm.logger.Debug("Sent captcha token to channel")
	default:
		cm.logger.Warn("Could not send captcha token, channel likely full or closed")

		cm.updateState(&LeagueClientState{ClientState: ClientStateLoginReady})
		select {
		case errChan <- errors.New("failed to deliver captcha token"):
			cm.logger.Debug("Sent token delivery error to channel")
		default:
			cm.logger.Warn("Could not send token delivery error")
		}
	}
}

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
	if err != nil {
		cm.logger.Error("Login failed", zap.Error(err))

		newState := &LeagueClientState{
			ClientState: ClientStateLoginReady,
		}

		cm.updateState(newState)

		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			return fmt.Errorf("login operation timed out: %w", err)
		}

		if err.Error() == "multifactor" {
			_, saveErr := cm.accountClient.Save(types.PartialSummonerRented{
				Username: username,
				Ban: &types.Ban{
					Restrictions: []types.Restriction{
						{Type: "MFA_REQUIRED"},
					},
				},
			})
			if saveErr != nil {
				cm.logger.Error("Error saving summoner with multifactor restriction", zap.Error(err))
				return saveErr
			}

		}
		if err.Error() == "auth_failure" {
			_, saveErr := cm.accountClient.Save(types.PartialSummonerRented{
				Username: username,
				Ban: &types.Ban{
					Restrictions: []types.Restriction{
						{Type: "INVALID_CREDENTIALS"},
					},
				},
			})
			if saveErr != nil {
				cm.logger.Error("Error saving summoner with multifactor restriction", zap.Error(err))
				return saveErr
			}

		}

		return err
	}

	return nil
}

func (s *Service) IsLCUConnectionReady() bool {
	isClientInitialized := s.LCUconnection.IsClientInitialized()
	if !isClientInitialized {
		_, err := s.LCUconnection.GetClient()
		if err != nil {
			return false
		}
	}

	return isClientInitialized
}
