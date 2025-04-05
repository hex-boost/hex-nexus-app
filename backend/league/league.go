package league

import (
	"github.com/mitchellh/go-ps"
	"go.uber.org/zap"
	"time"
)

type LeagueService struct {
	LCUConnection
}

func NewLeagueService() *LeagueService {
	return &LeagueService{}
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
		"LeagueClientUxRender.exe",
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

	if lc.client == nil {
		err := lc.LCUConnection.InitializeConnection()
		if err != nil {
			lc.logger.Error("Failed to initialize LCU connection", zap.Error(err))
			return
		}
	}

	resp, err := lc.client.R().Delete("/lol-login/v1/session")
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

	if lc.client == nil {
		lc.logger.Debug("LCU client not initialized")
		return false
	}

	var result bool
	resp, err := lc.client.R().SetResult(&result).Get("/lol-inventory/v1/initial-configuration-complete")

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
