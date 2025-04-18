package league

import (
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/mitchellh/go-ps"
	"go.uber.org/zap"
	"time"
)

type LeagueService struct {
	LCUconnection   *LCUConnection
	Api             *repository.AccountsRepository // Changed from api to Api for public access
	summonerService *SummonerService
	logger          *utils.Logger
}

func NewLeagueService(logger *utils.Logger, api *repository.AccountsRepository, summonerService *SummonerService, lcuConnection *LCUConnection) *LeagueService {
	return &LeagueService{
		LCUconnection:   lcuConnection,
		Api:             api, // Updated field name
		logger:          logger,
		summonerService: summonerService,
	}
}
func (lc *LeagueService) IsPlaying() bool {
	processes, err := ps.Processes()
	if err != nil {
		lc.logger.Error("Failed to list processes", zap.Error(err))
		return false
	}

	leagueProcessNames := []string{
		"League of Legends.exe",
	}

	for _, process := range processes {
		exe := process.Executable()
		for _, name := range leagueProcessNames {
			if exe == name {
				return true
			}
		}
	}

	return false

}
func (lc *LeagueService) IsRunning() bool {
	processes, err := ps.Processes()
	if err != nil {
		lc.logger.Error("Failed to list processes", zap.Error(err))
		return false
	}

	leagueProcessNames := []string{
		"LeagueClient.exe",
		"LeagueClientUx.exe",
	}

	for _, process := range processes {
		exe := process.Executable()
		for _, name := range leagueProcessNames {
			if exe == name {
				return true
			}
		}
	}

	return false
}
func (lc *LeagueService) Logout() {
	lc.logger.Info("Attempting to logout from League client")

	if lc.LCUconnection.client == nil {
		err := lc.LCUconnection.InitializeConnection()
		if err != nil {
			lc.logger.Error("Failed to initialize LCU connection", zap.Error(err))
			return
		}
	}

	resp, err := lc.LCUconnection.client.R().Delete("/lol-login/v1/session")
	if err != nil {
		lc.logger.Error("Failed to send logout request", zap.Error(err))
		return
	}

	if resp.StatusCode() == 204 {
		lc.logger.Info("Successfully logged out from League client")
	} else {
		lc.logger.Error("Unexpected response from logout request",
			zap.Int("statusCode", resp.StatusCode()),
			zap.String("body", string(resp.Body())))
	}
}
func (lc *LeagueService) WaitInventoryIsReady() {
	lc.logger.Info("Waiting for inventory system to be ready")

	attempts := 0
	for {
		if lc.IsInventoryReady() {
			lc.logger.Info("Inventory system is ready", zap.Int("attempts", attempts))
			return
		}

		attempts++
		if attempts%10 == 0 {
			lc.logger.Debug("Still waiting for inventory system to be ready", zap.Int("attempts", attempts))
		}

		time.Sleep(1 * time.Second)
	}
}

func (lc *LeagueService) IsInventoryReady() bool {

	if lc.LCUconnection.client == nil {
		err := lc.LCUconnection.InitializeConnection()
		if err != nil {
			lc.logger.Debug("LCU client not initialized")
			return false
		}
	}

	var result bool
	resp, err := lc.LCUconnection.client.R().SetResult(&result).Get("/lol-inventory/v1/initial-configuration-complete")

	if err != nil {
		lc.logger.Debug("LCU client connection test failed", zap.Error(err))
		return false
	}

	if resp.IsError() {
		lc.logger.Debug("LCU client ready and accepting API requests")
		return false
	}
	lc.logger.Debug("LCU client not ready", zap.Int("statusCode", resp.StatusCode()))
	return result
}

func (lc *LeagueService) UpdateFromLCU(username string) error {
	lc.logger.Debug("Updating account from LCU", zap.String("username", username))
	summonerRented, err := lc.summonerService.UpdateFromLCU(username)
	if err != nil {
		lc.logger.Error("Failed to update account from LCU", zap.Error(err))
		return err
	}

	err = lc.Api.Save(*summonerRented) // You may need to update the repository to accept the new format
	if err != nil {
		lc.logger.Error("failed to save account to database", zap.Error(err))
		return err
	}
	return nil
}
