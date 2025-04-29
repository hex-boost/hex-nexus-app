package league

import (
	"time"

	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/lcu"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/summoner"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/mitchellh/go-ps"
	"go.uber.org/zap"
	"gopkg.in/yaml.v3"
	"os"
	"path/filepath"
)

type Service struct {
	LCUconnection   *lcu.Connection
	Api             *account.Client // Changed from api to Api for public access
	summonerService *summoner.Service
	logger          *logger.Logger
}

func NewService(logger *logger.Logger, api *account.Client, summonerService *summoner.Service, lcuConnection *lcu.Connection) *Service {
	return &Service{
		LCUconnection:   lcuConnection,
		Api:             api, // Updated field name
		logger:          logger,
		summonerService: summonerService,
	}
}
func (s *Service) GetPath() string {
	programData := os.Getenv("PROGRAMDATA")
	if programData == "" {
		programData = "C:\\ProgramData"
	}

	leaguePath := filepath.Join(programData, "Riot Games", "Metadata", "league_of_legends.live", "league_of_legends.live.product_settings.yaml")
	fileContent, err := os.ReadFile(leaguePath)
	if err != nil {
		s.logger.Error("Failed to read League settings file", zap.Error(err))
		return ""
	}

	var settings struct {
		ProductInstallFullPath string `yaml:"product_install_full_path"`
	}

	if err := yaml.Unmarshal(fileContent, &settings); err != nil {
		s.logger.Error("Failed to parse League settings file", zap.Error(err))
		return ""
	}

	if settings.ProductInstallFullPath == "" {
		s.logger.Error("Could not find League installation path in settings file")
		return ""
	}

	return filepath.Join(settings.ProductInstallFullPath, "Game", "League of Legends.exe")
}

func (s *Service) IsPlaying() bool {
	processes, err := ps.Processes()
	if err != nil {
		s.logger.Error("Failed to list processes", zap.Error(err))
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

func (s *Service) IsRunning() bool {
	processes, err := ps.Processes()
	if err != nil {
		s.logger.Error("Failed to list processes", zap.Error(err))
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

func (s *Service) Logout() {
	s.logger.Info("Attempting to logout from League client")

	if !s.LCUconnection.IsClientInitialized() {
		err := s.LCUconnection.Initialize()
		if err != nil {
			s.logger.Error("Failed to initialize LCU connection", zap.Error(err))
			return
		}
	}

	resp, err := s.LCUconnection.Client.R().Delete("/lol-login/v1/session")
	if err != nil {
		s.logger.Error("Failed to send logout request", zap.Error(err))
		return
	}

	if resp.StatusCode() == 204 {
		s.logger.Info("Successfully logged out from League client")
	} else {
		s.logger.Error("Unexpected response from logout request",
			zap.Int("statusCode", resp.StatusCode()),
			zap.String("body", string(resp.Body())))
	}
}

func (s *Service) WaitInventoryIsReady() {
	s.logger.Info("Waiting for inventory system to be ready")

	attempts := 0
	for {
		if s.IsInventoryReady() {
			s.logger.Info("Inventory system is ready", zap.Int("attempts", attempts))
			return
		}

		attempts++
		if attempts%10 == 0 {
			s.logger.Debug("Still waiting for inventory system to be ready", zap.Int("attempts", attempts))
		}

		time.Sleep(1 * time.Second)
	}
}

func (s *Service) IsInventoryReady() bool {
	if s.LCUconnection.Client == nil {
		err := s.LCUconnection.Initialize()
		if err != nil {
			s.logger.Debug("LCU client not initialized")
			return false
		}
	}

	var result bool
	resp, err := s.LCUconnection.Client.R().SetResult(&result).Get("/lol-inventory/v1/initial-configuration-complete")
	if err != nil {
		s.logger.Debug("LCU client connection test failed", zap.Error(err))
		return false
	}

	if resp.IsError() {
		s.logger.Debug("LCU client ready and accepting API requests")
		return false
	}
	s.logger.Debug("LCU client not ready", zap.Int("statusCode", resp.StatusCode()))
	return result
}

func (s *Service) UpdateFromLCU(username string) error {
	s.logger.Debug("Updating account from LCU", zap.String("username", username))
	summonerRented, err := s.summonerService.UpdateFromLCU(username)
	if err != nil {
		s.logger.Error("Failed to update account from LCU", zap.Error(err))
		return err
	}

	_, err = s.Api.Save(*summonerRented) // You may need to update the repository to accept the new format
	if err != nil {
		s.logger.Error("failed to save account to database", zap.Error(err))
		return err
	}
	return nil
}
