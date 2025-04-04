package riot

import (
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"go.uber.org/zap"
	"sync"
	"time"
)

type AccountMonitor struct {
	riotClient    *RiotClient
	accountRepo   *repository.AccountsRepository
	logger        *utils.Logger
	running       bool
	checkInterval time.Duration
	stopChan      chan struct{}
	mutex         sync.Mutex
}

func NewAccountMonitor(
	riotClient *RiotClient,
	accountRepo *repository.AccountsRepository,
	logger *utils.Logger,
) *AccountMonitor {
	return &AccountMonitor{
		riotClient:    riotClient,
		accountRepo:   accountRepo,
		logger:        logger,
		checkInterval: 30 * time.Second, // Check every 30 seconds
		stopChan:      make(chan struct{}),
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
	if err := am.riotClient.IsAuthStateValid(); err != nil {
		am.logger.Debug("Auth state invalid", zap.Error(err))
		return
	}

	// Get user info
	//userInfo, err := am.riotClient.GetUserinfo()
	//if err != nil {
	//	am.logger.Debug("Failed to get user info", zap.Error(err))
	//	return
	//}
	//
	//// Check if it's a system account
	//if am.accountRepo.Save(userInfo) {
	//	am.logger.Info("System account detected, logging out",
	//		zap.String("account_id", userInfo.Sub),
	//		zap.String("username", userInfo.Username))
	//
	//	// Perform logout
	//	am.logoutSystemAccount()
	//}
}

func (am *AccountMonitor) logoutSystemAccount() {
	// Delete the authentication session
	_, err := am.riotClient.client.R().Delete("/rso-authenticator/v1/authentication")
	if err != nil {
		am.logger.Error("Failed to logout system account", zap.Error(err))
		return
	}

	am.logger.Info("Successfully logged out system account")
}
