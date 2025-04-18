package league

import (
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/hex-boost/hex-nexus-app/backend/watchdog"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"strings"
	"sync"
	"time"
)

type AccountMonitor struct {
	riotClient          *riot.RiotClient
	accountRepo         *repository.AccountsRepository
	logger              *utils.Logger
	lastCheckedUsername string
	running             bool
	isNexusAccount      bool
	checkInterval       time.Duration
	cachedAccounts      []types.SummonerRented
	lastAccountsFetch   time.Time
	accountCacheTTL     time.Duration
	window              *application.WebviewWindow
	stopChan            chan struct{}
	leagueService       *LeagueService
	mutex               sync.Mutex
	watchdogState       *watchdog.Watchdog // Add this field to access watchdog

	summoner      *SummonerClient
	LCUConnection *LCUConnection
}

func (am *AccountMonitor) SetWatchdog(watchdog *watchdog.Watchdog) {
	am.watchdogState = watchdog
}

func NewAccountMonitor(
	logger *utils.Logger,
	leagueService *LeagueService,
	riotClient *riot.RiotClient,
	accountRepo *repository.AccountsRepository,
	summoner *SummonerClient,
	LCUConnection *LCUConnection,

) *AccountMonitor {
	return &AccountMonitor{
		leagueService:   leagueService,
		LCUConnection:   LCUConnection,
		riotClient:      riotClient,
		summoner:        summoner,
		accountRepo:     accountRepo,
		logger:          logger,
		isNexusAccount:  false,
		window:          nil,
		accountCacheTTL: 5 * time.Minute, // Adjust the cache duration as needed

		checkInterval: 1 * time.Second, // Check every 30 seconds
		stopChan:      make(chan struct{}),
	}
}
func (am *AccountMonitor) SetWindow(window *application.WebviewWindow) {
	am.window = window
}
func (am *AccountMonitor) refreshAccountCache() error {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	accounts, err := am.accountRepo.GetAllRented()
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
func (am *AccountMonitor) getAccountsWithCache() ([]types.SummonerRented, error) {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	// Check if we need to refresh the cache
	needsRefresh := len(am.cachedAccounts) == 0 ||
		time.Since(am.lastAccountsFetch) > am.accountCacheTTL

	// If cache is empty or expired, fetch fresh data
	if needsRefresh {
		am.logger.Debug("Fetching fresh account data from repository")
		accounts, err := am.accountRepo.GetAllRented()
		if err != nil {
			return nil, err
		}

		am.cachedAccounts = accounts
		am.lastAccountsFetch = time.Now()
		am.logger.Debug("Updated account cache",
			zap.Int("accountCount", len(accounts)),
			zap.Time("cacheTimestamp", am.lastAccountsFetch))
	} else {
		am.logger.Debug("Using cached account data",
			zap.Int("accountCount", len(am.cachedAccounts)),
			zap.Time("cacheTimestamp", am.lastAccountsFetch),
			zap.Duration("age", time.Since(am.lastAccountsFetch)))
	}

	return am.cachedAccounts, nil
}
func (am *AccountMonitor) Start() {
	fmt.Println("Starting account monitor")
	am.mutex.Lock()
	defer am.mutex.Unlock()

	if am.running {
		return
	}

	am.running = true
	am.stopChan = make(chan struct{})

	go am.monitorLoop()
	am.logger.Info("Account monitor started")
}

func (am *AccountMonitor) Stop() {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	if !am.running {
		return
	}

	close(am.stopChan)
	am.running = false
	am.logger.Info("Account monitor stopped")
}

func (am *AccountMonitor) monitorLoop() {
	ticker := time.NewTicker(am.checkInterval)
	defer ticker.Stop()

	am.logger.Info("Account monitor loop started", zap.Duration("checkInterval", am.checkInterval))

	for {
		select {
		case <-ticker.C:
			am.checkCurrentAccount()
		case <-am.stopChan:
			am.logger.Info("Account monitor loop terminated via stop channel")
			return
		}
	}
}
func (am *AccountMonitor) getSummonerNameByRiotClient() string {
	am.logger.Debug("Riot client found but not initialized, attempting initialization")
	if !am.riotClient.IsClientInitialized() {
		if err := am.riotClient.InitializeRestyClient(); err != nil {
			am.logger.Error("Failed to initialize Riot client",
				zap.Error(err),
				zap.String("errorType", fmt.Sprintf("%T", err)))
			return ""
		}
	}
	am.logger.Debug("Successfully initialized Riot client")

	am.logger.Debug("Checking user authentication state")
	authState, err := am.riotClient.GetAuthenticationState()
	if err != nil {
		am.logger.Error("Failed to retrieve authentication state",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return ""
	}
	am.logger.Debug("Authentication state retrieved",
		zap.String("authType", authState.Type),
		zap.Any("authDetails", authState))

	// Skip further checks if not authenticated
	if authState.Type != "success" {
		am.logger.Debug("User not successfully authenticated, skipping user info check",
			zap.String("currentAuthType", authState.Type))
		return ""
	}

	// Get user info
	am.logger.Debug("Attempting to retrieve user info")
	userInfo, err := am.riotClient.GetUserinfo()
	if err != nil {
		am.logger.Error("Failed to get user info",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return ""
	}
	am.logger.Debug("User info retrieved successfully",
		zap.String("username", userInfo.Username),
		zap.String("gameName", userInfo.Acct.GameName),
		zap.String("tagLine", userInfo.Acct.TagLine),
		zap.String("puuid", userInfo.Sub))
	return userInfo.Username
	// Check if it's a system account
}

func (am *AccountMonitor) getUsernameByLeagueClient() (string, error) {

	err := am.LCUConnection.InitializeConnection()
	if err != nil || am.LCUConnection.client == nil {
		am.logger.Debug("Failed to initialize League client connection",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return "", errors.New("failed to initialize League client connection")
	}

	currentSummoner, err := am.summoner.GetLoginSession()
	if err != nil {
		am.logger.Debug("Failed to get current summoner",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return "", errors.New("failed to get current summoner")
	}
	return currentSummoner.Username, nil

}
func (am *AccountMonitor) GetLoggedInUsername() string {
	var currentUsername string
	if am.riotClient.IsRunning() {
		currentUsername = am.getSummonerNameByRiotClient()
	} else if am.leagueService.IsRunning() {
		leagueCurrentUsername, err := am.getUsernameByLeagueClient()
		if err != nil {
			am.logger.Debug("Failed to get current summoner from League client",
				zap.Error(err),
				zap.String("errorType", fmt.Sprintf("%T", err)))
			return ""
		}
		currentUsername = leagueCurrentUsername
	} else if am.leagueService.IsPlaying() {
		currentUsername = am.lastCheckedUsername
	}
	return strings.ToLower(currentUsername)
}

// UpdateWatchdogAccountStatus updates the account status in the watchdog state file
func (am *AccountMonitor) checkCurrentAccount() {
	// Skip if Riot client is not running
	if !am.riotClient.IsRunning() && !am.leagueService.IsRunning() && !am.leagueService.IsPlaying() {
		return
	}

	currentUsername := am.GetLoggedInUsername()
	if currentUsername == "" {
		am.logger.Debug("Skipping account check - no logged-in account found, username is empty")
		return
	}

	am.logger.Debug("Current logged-in account", zap.String("summonerNameWithTag", currentUsername))

	// Use cached accounts instead of fetching every time
	accounts, err := am.getAccountsWithCache()
	if err != nil {
		am.logger.Error("Failed to retrieve Nexus-managed accounts",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return
	}

	isNexusAccount := false
	if len(accounts) > 0 {
		am.logger.Debug("Account not found in cache, refreshing account data")
		if err := am.refreshAccountCache(); err != nil {
			am.logger.Error("Failed to refresh account cache", zap.Error(err))
		} else {
			// Try again with fresh data
			accounts = am.cachedAccounts
			for _, account := range accounts {

				if strings.ToLower(account.Username) == currentUsername {
					isNexusAccount = true
					am.logger.Info("Match found after cache refresh! Current account is a Nexus-managed account",
						zap.String("summonerName", currentUsername))
					break
				}
			}
		}
	}

	if !isNexusAccount {
		am.logger.Debug("Current account is not a Nexus-managed account",
			zap.String("summonerName", currentUsername))
	}

	previousState := am.IsNexusAccount()

	am.mutex.Lock()
	am.isNexusAccount = isNexusAccount
	am.mutex.Unlock()

	// Update watchdog if state changed
	if previousState != isNexusAccount {
		// Your existing watchdog update code
		am.logger.Info("Nexus account status changed",
			zap.Bool("previousStatus", previousState),
			zap.Bool("currentStatus", isNexusAccount),
			zap.String("summonerName", currentUsername))

		err := watchdog.UpdateWatchdogAccountStatus(isNexusAccount)
		am.window.EmitEvent("nexusAccount:state", isNexusAccount)
		if err != nil {
			am.logger.Error("Failed to update watchdog status via named pipe", zap.Error(err))
		} else {
			am.logger.Debug("Updated watchdog state with new account status via named pipe",
				zap.Bool("isNexusAccount", isNexusAccount))
		}
	}
}
func (am *AccountMonitor) IsNexusAccount() bool {
	am.mutex.Lock()
	defer am.mutex.Unlock()
	return am.isNexusAccount
}
