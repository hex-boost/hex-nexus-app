package league

import (
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/mitchellh/go-ps"
	"go.uber.org/zap"
)

type LeagueService struct {
	logger *utils.Logger
}

func NewLeagueService(logger *utils.Logger) *LeagueService {
	return &LeagueService{
		logger: logger,
	}
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
