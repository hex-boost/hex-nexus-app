package league

import (
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/hex-boost/hex-nexus-app/backend/watchdog"
	"go.uber.org/zap"
	"sync"
	"time"
)

type AccountMonitor struct {
	riotClient     *riot.RiotClient
	accountRepo    *repository.AccountsRepository
	logger         *utils.Logger
	running        bool
	isNexusAccount bool
	checkInterval  time.Duration
	stopChan       chan struct{}
	leagueService  *LeagueService
	mutex          sync.Mutex
	watchdogState  *watchdog.Watchdog // Add this field to access watchdog

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
		leagueService:  leagueService,
		LCUConnection:  LCUConnection,
		riotClient:     riotClient,
		summoner:       summoner,
		accountRepo:    accountRepo,
		logger:         logger,
		isNexusAccount: false,
		checkInterval:  1 * time.Second, // Check every 30 seconds
		stopChan:       make(chan struct{}),
	}
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
			am.logger.Debug("Running scheduled account check")
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
	return userInfo.Acct.GameName + "#" + userInfo.Acct.TagLine
	// Check if it's a system account
}

func (am *AccountMonitor) getSummonerNameByLeagueClient() (string, error) {

	err := am.LCUConnection.InitializeConnection()
	if err != nil || am.LCUConnection.client == nil {
		am.logger.Error("Failed to initialize League client connection",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return "", errors.New("failed to initialize League client connection")
	}

	currentSummoner, err := am.summoner.GetCurrentSummoner()
	if err != nil {
		am.logger.Error("Failed to get current summoner",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return "", errors.New("failed to get current summoner")
	}
	return currentSummoner.GameName + "#" + currentSummoner.TagLine, nil

}

// UpdateWatchdogAccountStatus updates the account status in the watchdog state file
func (am *AccountMonitor) checkCurrentAccount() {
	// Skip if Riot client is not running
	if !am.riotClient.IsRunning() && !am.leagueService.IsRunning() {
		am.logger.Debug("Skipping account check - Riot client not running")
		return
	}
	var currentUsername string
	// Initialize client if needed
	if am.riotClient.IsRunning() {
		currentUsername = am.getSummonerNameByRiotClient()
	} else if am.leagueService.IsRunning() {
		leagueCurrentUsername, err := am.getSummonerNameByLeagueClient()
		if err != nil {
			am.logger.Error("Failed to get current summoner from League client",
				zap.Error(err),
				zap.String("errorType", fmt.Sprintf("%T", err)))
			return
		}
		currentUsername = leagueCurrentUsername
	}

	am.logger.Debug("Current logged-in account", zap.String("summonerNameWithTag", currentUsername))
	// Check authentication state
	allAccounts, err := am.accountRepo.GetAllRented()
	if err != nil {
		am.logger.Error("Failed to retrieve Nexus-managed accounts from repository",
			zap.Error(err),
			zap.String("errorType", fmt.Sprintf("%T", err)))
		return
	}
	am.logger.Debug("Retrieved Nexus-managed accounts", zap.Int("accountCount", len(allAccounts)))

	isNexusAccount := false
	for _, account := range allAccounts {
		accountSummonerName := account.GameName + "#" + account.Tagline
		am.logger.Debug("Comparing with Nexus account",
			zap.String("currrentUsername", currentUsername),
			zap.String("nexusSummonerName", accountSummonerName))

		if accountSummonerName == currentUsername {
			isNexusAccount = true
			am.logger.Info("Match found! Current account is a Nexus-managed account",
				zap.String("summonerName", currentUsername))
			break
		}
	}

	if !isNexusAccount {
		am.logger.Debug("Current account is not a Nexus-managed account",
			zap.String("summonerName", currentUsername))
	}

	// Only lock when updating the shared field
	previousState := am.IsNexusAccount()
	am.mutex.Lock()
	am.isNexusAccount = isNexusAccount
	am.mutex.Unlock()

	// Replace the watchdogState block in the checkCurrentAccount() function with this:
	// Replace the watchdogState block in the checkCurrentAccount() function with this:
	if previousState != isNexusAccount {
		am.logger.Info("Nexus account status changed",
			zap.Bool("previousStatus", previousState),
			zap.Bool("currentStatus", isNexusAccount),
			zap.String("summonerName", currentUsername))

		// Update watchdog via named pipe
		err := watchdog.UpdateWatchdogAccountStatus(isNexusAccount)
		if err != nil {
			am.logger.Error("Failed to update watchdog status via named pipe", zap.Error(err))
		} else {
			am.logger.Debug("Updated watchdog state with new account status via named pipe",
				zap.Bool("isNexusAccount", isNexusAccount))
		}
	}
}

//	func (am *AccountMonitor) LogoutNexusAccount() error {
//		am.logger.Info("Attempting to logout Nexus-managed account")
//
//		am.logger.Debug("Calling League service logout")
//		am.leagueService.Logout()
//		am.logger.Debug("League service logout completed")
//
//		am.logger.Debug("Calling Riot client logout")
//		err := am.riotClient.Logout()
//		if err != nil {
//			am.logger.Error("Failed to logout from Riot client",
//				zap.Error(err),
//				zap.String("errorType", fmt.Sprintf("%T", err)))
//			return fmt.Errorf("riot client logout failed: %w", err)
//		}
//
//		am.logger.Info("Successfully logged out Nexus-managed account")
//
//		// Update the status after logout
//		//previousState := am.IsNexusAccount()
//
//		am.mutex.Lock()
//		wasNexusAccount := am.isNexusAccount
//		am.isNexusAccount = false
//		am.mutex.Unlock()
//
//		am.logger.Debug("Updated Nexus account status after logout",
//			zap.Bool("previousStatus", wasNexusAccount),
//			zap.Bool("currentStatus", false))
//		return nil
//	}
func (am *AccountMonitor) IsNexusAccount() bool {
	am.mutex.Lock()
	defer am.mutex.Unlock()
	return am.isNexusAccount
}
