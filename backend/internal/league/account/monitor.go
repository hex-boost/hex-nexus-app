package account

import (
	"context"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/wailsapp/wails/v3/pkg/application"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
)

type AccountState interface {
	Get() *types.PartialSummonerRented
	Update(summonerRented *types.PartialSummonerRented) (*types.PartialSummonerRented, error)
	IsNexusAccount() bool
	SetNexusAccount(bool) bool
}

type RiotAuthenticator interface {
	IsRunning() bool
	IsClientInitialized() bool
	InitializeClient() error
	GetAuthenticationState() (*types.RiotIdentityResponse, error)
	GetUserinfo() (*types.UserInfo, error)
}

// LeagueServiceInterface defines methods needed from LeagueService
type LeagueService interface {
	IsRunning() bool
	IsPlaying() bool
}

// SummonerClientInterface defines methods needed from SummonerClient
type SummonerClient interface {
	GetLoginSession() (*types.LoginSession, error)
	GetCurrentSummoner() (*types.CurrentSummoner, error)
}

// LCUConnectionInterface defines methods needed from LCUConnection
type LCUConnection interface {
	GetClient() (*resty.Client, error)
	IsClientInitialized() bool
}

// AccountsRepositoryInterface defines methods needed from AccountsRepository
type AccountClient interface {
	GetAll() ([]types.SummonerBase, error)

	UsernameExistsInDatabase(username string) (bool, error)
}
type EventPayload struct {
	EventName string
	Data      []interface{}
}

// WindowEmitter defines methods needed from window
type WindowEmitter interface {
	EmitEvent(eventName string, data ...interface{})
}
type LeagueServicer interface {
	IsRunning() bool
	IsPlaying() bool
}
type Monitor struct {
	riotAuth          RiotAuthenticator
	accountClient     AccountClient
	logger            *logger.Logger
	running           bool
	accountState      AccountState
	checkInterval     time.Duration
	lastAccountsFetch time.Time
	accountCacheTTL   time.Duration
	window            WindowEmitter
	stopChan          chan struct{}
	leagueService     LeagueServicer
	mutex             sync.Mutex
	watchdogState     WatchdogUpdater
	summonerClient    SummonerClient
	LCUConnection     LCUConnection
	eventChan         chan EventPayload
	ctx               context.Context
}

type WatchdogUpdater interface {
	Update(active bool) error
}

func NewMonitor(
	logger *logger.Logger,
	leagueService LeagueServicer,
	riotAuth RiotAuthenticator,
	summonerClient SummonerClient,
	LCUConnection LCUConnection,
	watchdog WatchdogUpdater,
	accountClient AccountClient,
	accountState AccountState,
) *Monitor {
	return &Monitor{
		watchdogState:   watchdog,
		leagueService:   leagueService,
		LCUConnection:   LCUConnection,
		riotAuth:        riotAuth,
		summonerClient:  summonerClient,
		logger:          logger,
		window:          nil,
		accountClient:   accountClient,
		accountCacheTTL: 1 * time.Hour,
		accountState:    accountState,
		checkInterval:   1 * time.Second,
		stopChan:        make(chan struct{}),
		eventChan:       make(chan EventPayload, 5), // Buffer for 100 events
		ctx:             context.Background(),
		mutex:           sync.Mutex{}, // Initialize main mutex
	}

}
func (m *Monitor) OnStartup(ctx context.Context, options application.ServiceOptions) error {
	m.ctx = ctx
	m.Start(application.Get())
	m.logger.Debug("STARTUP MONITOR")
	return nil
}
func (m *Monitor) OnShutdown(ctx context.Context, options application.ServiceOptions) error {
	m.logger.Debug("ENDING MONITOR")
	m.Stop()
	return nil
}

func (m *Monitor) SetWindow(window WindowEmitter) {
	m.window = window
}
func (m *Monitor) Start(window WindowEmitter) {
	m.window = window
	m.logger.Debug("Starting account monitor")
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if m.running {
		return
	}

	m.running = true
	m.stopChan = make(chan struct{})

	go m.monitorLoop()
	m.logger.Debug("State monitor started")
}

func (m *Monitor) Stop() {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if !m.running {
		return
	}

	close(m.stopChan)
	m.running = false
	m.logger.Info("State monitor stopped")
}

func (m *Monitor) monitorLoop() {
	ticker := time.NewTicker(m.checkInterval)
	defer ticker.Stop()

	m.logger.Debug("State monitor loop started", zap.Duration("checkInterval", m.checkInterval))

	for {
		select {
		case <-ticker.C:
			m.checkCurrentAccount()
		case <-m.stopChan:
			m.logger.Debug("State monitor loop terminated via stop channel")
			return
		}
	}
}

func (m *Monitor) getSummonerNameByRiotClient() string {
	if !m.riotAuth.IsClientInitialized() && m.riotAuth.IsRunning() {
		if err := m.riotAuth.InitializeClient(); err != nil {
			m.logger.Error("Failed to initialize Riot client",
				zap.Error(err),
				zap.String("errorType", fmt.Sprintf("%T", err)))
			return ""
		}
	}
	authState, err := m.riotAuth.GetAuthenticationState()
	if err != nil {
		m.logger.Error("Failed to retrieve authentication state",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return ""
	}

	if authState.Type != "success" {
		return ""
	}

	// Get user info
	userInfo, err := m.riotAuth.GetUserinfo()
	if err != nil {
		m.logger.Error("Failed to get user info",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return ""
	}
	return userInfo.Username
	// Check if it's a system account
}

func (m *Monitor) getUsernameByLeagueClient() (string, error) {
	if !m.LCUConnection.IsClientInitialized() {
		_, err := m.LCUConnection.GetClient()
		if err != nil || !m.LCUConnection.IsClientInitialized() {
			return "", errors.New(fmt.Sprintf("failed to initialize League client connection %v", err))
		}
	}

	currentSummoner, err := m.summonerClient.GetLoginSession()
	if err != nil {
		m.logger.Warn("Failed to get current summoner",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return "", errors.New("failed to get current summoner")
	}
	return currentSummoner.Username, nil
}

func (m *Monitor) GetLoggedInUsername(lastUsername string) string {
	var currentUsername string
	if m.leagueService.IsRunning() {
		leagueCurrentUsername, err := m.getUsernameByLeagueClient()
		if err != nil {
			return ""
		}
		currentUsername = leagueCurrentUsername
	} else if m.riotAuth.IsRunning() {
		currentUsername = m.getSummonerNameByRiotClient()
	} else if m.leagueService.IsPlaying() {
		currentUsername = lastUsername
	}
	return strings.ToLower(currentUsername)
}

func (m *Monitor) checkCurrentAccount() {
	if !m.leagueService.IsPlaying() && !m.leagueService.IsRunning() && !m.riotAuth.IsRunning() {
		return
	}
	currentAccount := m.accountState.Get()

	loggedInUsername := m.GetLoggedInUsername(currentAccount.Username)
	if loggedInUsername == "" || currentAccount.Username == loggedInUsername {
		return
	} else {
		_, _ = m.accountState.Update(&types.PartialSummonerRented{})
	}

	m.logger.Debug("Username changed, refreshing account cache",
		zap.String("previous", currentAccount.Username),
		zap.String("current", loggedInUsername))
	currentAccount, _ = m.accountState.Update(&types.PartialSummonerRented{Username: loggedInUsername})

	isNexusAccount, err := m.accountClient.UsernameExistsInDatabase(strings.ToLower(currentAccount.Username))
	if err != nil {
		m.logger.Warn("Failed to check if username exists in database", zap.Error(err))
		return
	}

	m.SetNexusAccount(isNexusAccount)
}

func (m *Monitor) IsNexusAccount() bool {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	return m.accountState.IsNexusAccount()
}
func (m *Monitor) processEvents() {
	defer func() {
		if r := recover(); r != nil {
			m.logger.Error("Panic in processEvents", zap.Any("error", r))
		}
	}()
	for {
		select {
		case event := <-m.eventChan:
			if m.window != nil {
				m.logger.Debug("Emitting event",
					zap.String("event", event.EventName))

				application.InvokeSync(func() {
					m.window.EmitEvent(event.EventName, event.Data...)
				})
			}
		case <-m.stopChan:
			m.logger.Debug("Event processor stopping")
			return
		case <-m.ctx.Done():
			m.logger.Debug("Event processor stopping due to context cancellation")
			return
		}
	}
}
func (m *Monitor) SetNexusAccount(isNexusAccount bool) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	stateChanged := m.accountState.SetNexusAccount(isNexusAccount)
	currentStatus := m.accountState.IsNexusAccount()

	// Update watchdog if state changed
	if stateChanged {
		m.logger.Info("Nexus account status changed",
			zap.Bool("previousStatus", !currentStatus),
			zap.Bool("currentStatus", currentStatus))

		err := m.watchdogState.Update(currentStatus)
		m.eventChan <- EventPayload{
			EventName: "nexusAccount:state",
			Data:      []interface{}{currentStatus},
		}
		if err != nil {
			m.logger.Error("Failed to update watchdog status via named pipe", zap.Error(err))
		} else {
			m.logger.Debug("Updated watchdog state with new account status via named pipe",
				zap.Bool("isNexusAccount", currentStatus))
		}
	}
}
