package account

import (
	"errors"
	"fmt"
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
}

// LCUConnectionInterface defines methods needed from LCUConnection
type LCUConnection interface {
	Initialize() error
	IsClientInitialized() bool
}

// AccountsRepositoryInterface defines methods needed from AccountsRepository
type AccountClient interface {
	GetAllRented() ([]types.SummonerRented, error)
}

// WindowEmitter defines methods needed from window
type WindowEmitter interface {
	EmitEvent(eventName string, data ...interface{})
}
type LeagueServicer interface {
	IsRunning() bool
	IsPlaying() bool
}
type (
	AccountServicer interface{}
	Monitor         struct {
		riotAuth          RiotAuthenticator
		accountClient     AccountClient
		logger            *logger.Logger
		running           bool
		accountState      AccountState
		checkInterval     time.Duration
		cachedAccounts    []types.SummonerRented
		lastAccountsFetch time.Time
		accountCacheTTL   time.Duration
		window            WindowEmitter
		stopChan          chan struct{}
		leagueService     LeagueServicer
		mutex             sync.Mutex
		watchdogState     WatchdogUpdater

		summonerClient SummonerClient
		LCUConnection  LCUConnection
	}
)

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
	}
}

func (am *Monitor) refreshAccountCache() error {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	accounts, err := am.accountClient.GetAllRented()
	if err != nil {
		return err
	}

	am.cachedAccounts = accounts
	am.lastAccountsFetch = time.Now()
	am.logger.Debug("Forcibly refreshed account cache",
		zap.Int("accountCount", len(accounts)),
		zap.Time("cacheTimestamp", am.lastAccountsFetch))

	return nil
}

func (am *Monitor) getAccountsWithCache() ([]types.SummonerRented, error) {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	// Check if we need to refresh the cache
	needsRefresh := len(am.cachedAccounts) == 0 ||
		time.Since(am.lastAccountsFetch) > am.accountCacheTTL

	// If cache is empty or expired, fetch fresh data
	if needsRefresh {
		am.logger.Debug("Fetching fresh account data from repository")
		accounts, err := am.accountClient.GetAllRented()
		if err != nil {
			return nil, err
		}

		am.cachedAccounts = accounts
		am.lastAccountsFetch = time.Now()
		am.logger.Debug("Updated account cache",
			zap.Int("accountCount", len(accounts)),
			zap.Time("cacheTimestamp", am.lastAccountsFetch))
	}

	return am.cachedAccounts, nil
}
func (am *Monitor) SetWindow(window WindowEmitter) {
	am.window = window
}
func (am *Monitor) Start(window WindowEmitter) {
	am.window = window
	fmt.Println("Starting account monitor")
	am.mutex.Lock()
	defer am.mutex.Unlock()

	if am.running {
		return
	}

	am.running = true
	am.stopChan = make(chan struct{})

	go am.monitorLoop()
	am.logger.Info("State monitor started")
}

func (am *Monitor) Stop() {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	if !am.running {
		return
	}

	close(am.stopChan)
	am.running = false
	am.logger.Info("State monitor stopped")
}

func (am *Monitor) monitorLoop() {
	ticker := time.NewTicker(am.checkInterval)
	defer ticker.Stop()

	am.logger.Info("State monitor loop started", zap.Duration("checkInterval", am.checkInterval))

	for {
		select {
		case <-ticker.C:
			am.checkCurrentAccount()
		case <-am.stopChan:
			am.logger.Info("State monitor loop terminated via stop channel")
			return
		}
	}
}

func (am *Monitor) getSummonerNameByRiotClient() string {
	if !am.riotAuth.IsClientInitialized() {
		if err := am.riotAuth.InitializeClient(); err != nil {
			am.logger.Error("Failed to initialize Riot client",
				zap.Error(err),
				zap.String("errorType", fmt.Sprintf("%T", err)))
			return ""
		}
	}
	authState, err := am.riotAuth.GetAuthenticationState()
	if err != nil {
		am.logger.Error("Failed to retrieve authentication state",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return ""
	}

	if authState.Type != "success" {
		return ""
	}

	// Get user info
	userInfo, err := am.riotAuth.GetUserinfo()
	if err != nil {
		am.logger.Error("Failed to get user info",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return ""
	}
	return userInfo.Username
	// Check if it's a system account
}

func (am *Monitor) getUsernameByLeagueClient() (string, error) {
	if !am.LCUConnection.IsClientInitialized() {
		err := am.LCUConnection.Initialize()
		if err != nil || !am.LCUConnection.IsClientInitialized() {
			return "", errors.New(fmt.Sprintf("failed to initialize League client connection %v", err))
		}
	}

	currentSummoner, err := am.summonerClient.GetLoginSession()
	if err != nil {
		am.logger.Debug("Failed to get current summoner",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return "", errors.New("failed to get current summoner")
	}
	return currentSummoner.Username, nil
}

func (am *Monitor) GetLoggedInUsername(lastUsername string) string {
	var currentUsername string
	if am.riotAuth.IsRunning() {
		currentUsername = am.getSummonerNameByRiotClient()
	} else if am.leagueService.IsRunning() {
		leagueCurrentUsername, err := am.getUsernameByLeagueClient()
		if err != nil {
			return ""
		}
		currentUsername = leagueCurrentUsername
	} else if am.leagueService.IsPlaying() {
		currentUsername = lastUsername
	}
	return strings.ToLower(currentUsername)
}

func (am *Monitor) checkCurrentAccount() {
	if !am.riotAuth.IsRunning() && !am.leagueService.IsRunning() && !am.leagueService.IsPlaying() {
		am.cachedAccounts = []types.SummonerRented{}
		am.lastAccountsFetch = time.Now() // Reset the timer
		am.SetNexusAccount(false)
		return
	}
	var currentAccount *types.PartialSummonerRented
	currentAccount = am.accountState.Get()

	currentUsername := am.GetLoggedInUsername(currentAccount.Username)
	if currentUsername == "" {
		return
	}

	if currentAccount.Username != currentUsername {
		am.logger.Debug("Username changed, refreshing account cache",
			zap.String("previous", currentAccount.Username),
			zap.String("current", currentUsername))
		currentAccount, _ = am.accountState.Update(&types.PartialSummonerRented{Username: currentUsername})
		_ = am.refreshAccountCache()
	}

	accounts, err := am.getAccountsWithCache()
	if err != nil {
		am.logger.Error("Failed to retrieve Nexus-managed accounts",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		am.SetNexusAccount(false)

	}

	isNexusAccount := false
	for _, account := range accounts {
		if strings.ToLower(account.Username) == currentAccount.Username {
			isNexusAccount = true
			break
		}
	}

	// Only attempt a refresh if we didn't find a match and the cache might be stale
	if !isNexusAccount && time.Since(am.lastAccountsFetch) > am.accountCacheTTL/2 {
		am.logger.Debug("State not found in cache, refreshing account data")
		if err := am.refreshAccountCache(); err != nil {
			am.logger.Error("Failed to refresh account cache", zap.Error(err))
		} else {
			// Check again with fresh data
			for _, account := range am.cachedAccounts {
				if strings.ToLower(account.Username) == currentUsername {
					isNexusAccount = true
					am.logger.Info("Match found after cache refresh! Current account is a Nexus-managed account",
						zap.String("summonerName", currentUsername))
					break
				}
			}
		}
	}
	am.SetNexusAccount(isNexusAccount)
}

func (am *Monitor) IsNexusAccount() bool {
	am.mutex.Lock()
	defer am.mutex.Unlock()
	return am.accountState.IsNexusAccount()
}

func (am *Monitor) SetNexusAccount(isNexusAccount bool) {
	am.mutex.Lock()
	stateChanged := am.accountState.SetNexusAccount(isNexusAccount)
	currentStatus := am.accountState.IsNexusAccount()
	am.mutex.Unlock()

	// Update watchdog if state changed
	if stateChanged {
		am.logger.Info("Nexus account status changed",
			zap.Bool("previousStatus", !currentStatus),
			zap.Bool("currentStatus", currentStatus))

		err := am.watchdogState.Update(currentStatus)
		am.window.EmitEvent("nexusAccount:state", currentStatus)
		if err != nil {
			am.logger.Error("Failed to update watchdog status via named pipe", zap.Error(err))
		} else {
			am.logger.Debug("Updated watchdog state with new account status via named pipe",
				zap.Bool("isNexusAccount", currentStatus))
		}
	}
}
