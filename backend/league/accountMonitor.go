package league

import (
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
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
}

func NewAccountMonitor(
	logger *utils.Logger,
	leagueService *LeagueService,
	riotClient *riot.RiotClient,
	accountRepo *repository.AccountsRepository,

) *AccountMonitor {
	return &AccountMonitor{
		leagueService:  leagueService,
		riotClient:     riotClient,
		accountRepo:    accountRepo,
		logger:         logger,
		isNexusAccount: false,
		checkInterval:  1 * time.Second, // Check every 30 seconds
		stopChan:       make(chan struct{}),
	}
}

func (am *AccountMonitor) Start() {
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

	for {
		select {
		case <-ticker.C:
			am.checkCurrentAccount()
		case <-am.stopChan:
			return
		}
	}
}

func (am *AccountMonitor) checkCurrentAccount() {
	// Skip if Riot client is not running
	if !am.riotClient.IsRunning() {
		return
	}

	// Initialize client if needed
	if !am.riotClient.IsClientInitialized() {
		if err := am.riotClient.InitializeRestyClient(); err != nil {
			am.logger.Debug("Failed to initialize client", zap.Error(err))
			return
		}
	}

	// Check authentication state
	authState, err := am.riotClient.GetAuthenticationState()
	if err != nil {
		am.logger.Debug("error while checking user authentication", zap.Error(err))
		return
	}
	if authState.Type == "success" {
		am.logger.Debug("User is logged in", zap.Any("authState", authState))
	}

	userInfo, err := am.riotClient.GetUserinfo()
	if err != nil {
		am.logger.Debug("Failed to get user info", zap.Error(err))
		return
	}

	// Check if it's a system account

	allAccounts, err := am.accountRepo.GetAllRented()
	if err != nil {
		am.logger.Error("Failed to get all accounts", zap.Error(err))
		return
	}

	userinfoSummonerName := userInfo.Acct.GameName + userInfo.Acct.TagLine
	isNexusAccount := false
	for _, account := range allAccounts {
		accountSummonerName := account.GameName + account.Tagline
		if accountSummonerName == userinfoSummonerName {
			isNexusAccount = true
			break
		}
	}

	// Only lock when updating the shared field
	am.mutex.Lock()
	am.isNexusAccount = isNexusAccount
	am.mutex.Unlock()
}

func (am *AccountMonitor) IsNexusAccount() bool {
	am.mutex.Lock()
	defer am.mutex.Unlock()
	return am.isNexusAccount
}
func (am *AccountMonitor) LogoutNexusAccount() error {
	am.leagueService.Logout()
	err := am.riotClient.Logout()
	if err != nil {
		am.logger.Error("Failed to logout from the client", zap.Error(err))
		return err
	}
	am.logger.Info("Successfully logged out system account")
	return nil
}
