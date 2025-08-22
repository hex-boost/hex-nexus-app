package league

import (
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account/events"
	"github.com/wailsapp/wails/v3/pkg/application"
	"time"

	"fmt" // Added for error wrapping
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
	Api             *account.Client   // Changed from api to Api for public access
	summonerService *summoner.Service // Assuming summoner.Service and its methods are thread-safe
	logger          *logger.Logger
	accountState    *account.State
}

func NewService(logger *logger.Logger, api *account.Client, summonerService *summoner.Service, lcuConnection *lcu.Connection, accountState *account.State) *Service {
	return &Service{
		LCUconnection:   lcuConnection,
		Api:             api,
		accountState:    accountState,
		logger:          logger,
		summonerService: summonerService,
	}
}

// GetPath reads configuration files and environment variables. These operations are generally thread-safe.
func (s *Service) GetPath() string {
	programData := os.Getenv("PROGRAMDATA")
	if programData == "" {
		programData = "C:\\ProgramData"
	}

	leaguePath := filepath.Join(programData, "Riot Games", "Metadata", "league_of_legends.live", "league_of_legends.live.product_settings.yaml")
	fileContent, err := os.ReadFile(leaguePath)
	if err != nil {
		s.logger.Error("Failed to read League settings file", zap.Error(err), zap.String("path", leaguePath))
		return ""
	}

	var settings struct {
		ProductInstallFullPath string `yaml:"product_install_full_path"`
	}

	if err := yaml.Unmarshal(fileContent, &settings); err != nil {
		s.logger.Error("Failed to parse League settings file", zap.Error(err), zap.String("path", leaguePath))
		return ""
	}

	if settings.ProductInstallFullPath == "" {
		s.logger.Error("Could not find League installation path in settings file", zap.String("path", leaguePath))
		return ""
	}

	// The path constructed is for "League of Legends.exe" in the "Game" subfolder.
	return filepath.Join(settings.ProductInstallFullPath, "Game", "League of Legends.exe")
}

// IsPlaying uses ps.Processes(). The go-ps library is generally safe for concurrent reads.
func (s *Service) IsPlaying() bool {
	processes, err := ps.Processes()
	if err != nil {
		s.logger.Error("Failed to list processes for IsPlaying check", zap.Error(err))
		return false
	}

	leagueProcessNames := []string{
		"League of Legends.exe", // Game client process
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

type Win32_Process struct {
	ProcessID   uint32
	CommandLine *string
}

func (s *Service) IsRunning() bool {
	_, _, _, err := s.LCUconnection.GetLeagueCredentials()
	return err == nil
}

func (s *Service) Logout() {
	s.logger.Info("Attempting to logout from League client")

	// Get the LCU client in a thread-safe way
	lcuAPIClient, err := s.LCUconnection.GetClient()
	if err != nil {
		s.logger.Error("Failed to get LCU client for logout", zap.Error(err))
		// If GetClient fails, it means initialization failed or the client is otherwise unavailable.
		// No need to call IsClientInitialized or Initialize separately here, GetClient handles it.
		return
	}

	// Use the obtained client for the request
	resp, err := lcuAPIClient.R().Delete("/lol-login/v1/session")
	if err != nil {
		s.logger.Error("Failed to send logout request", zap.Error(err))
		return
	}

	if resp.StatusCode() == 204 { // HTTP 204 No Content is typical for successful DELETE operations like logout
		s.logger.Info("Successfully logged out from League client")
	} else {
		s.logger.Error("Unexpected response from logout request",
			zap.Int("statusCode", resp.StatusCode()),
			zap.String("body", resp.String())) // Log body for more details
	}
}

func (s *Service) WaitInventoryIsReady() {
	s.logger.Info("Waiting for inventory system to be ready")
	// Consider adding a timeout to this loop to prevent indefinite waiting.
	// For example: ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	// And then check ctx.Done() in the loop.

	attempts := 0
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	// Example timeout:
	// timeout := time.After(60 * time.Second)

	for {
		// select {
		// case <-timeout:
		// 	s.logger.Error("Timeout waiting for inventory system to be ready")
		// 	return
		// case <-ticker.C:
		attempts++
		if s.IsInventoryReady() {
			s.logger.Info("Inventory system is ready", zap.Int("attempts", attempts))
			return
		}
		if attempts%10 == 0 { // Log progress less frequently
			s.logger.Debug("Still waiting for inventory system to be ready", zap.Int("attempts", attempts))
		}
		// }
		time.Sleep(1 * time.Second) // If not using ticker with select
	}
}

func (s *Service) IsInventoryReady() bool {
	// Get the LCU client in a thread-safe way
	lcuAPIClient, err := s.LCUconnection.GetClient()
	if err != nil {
		// If GetClient fails, it means initialization failed or the client is otherwise unavailable.
		s.logger.Debug("LCU client not available for IsInventoryReady check", zap.Error(err))
		return false
	}

	var result bool // The endpoint returns a boolean directly
	resp, err := lcuAPIClient.R().
		SetResult(&result).
		Get("/lol-inventory/v1/initial-configuration-complete")

	if err != nil {
		// This could be a network error, LCU not fully up, etc.
		s.logger.Debug("LCU client connection test for inventory failed", zap.Error(err))
		return false
	}

	if resp.IsError() { // Checks for non-2xx status codes
		s.logger.Debug("LCU inventory endpoint returned an error status",
			zap.Int("statusCode", resp.StatusCode()),
			zap.String("body", resp.String()))
		return false // Or interpret specific status codes if needed
	}

	// If we got a 2xx response and the request was successful, `result` should be populated.
	if resp.IsSuccess() {
		if result {
			s.logger.Debug("LCU inventory is ready and configuration is complete.")
		} else {
			s.logger.Debug("LCU inventory API accessible, but initial configuration not yet complete.")
		}
		return result
	}

	// Fallback, though IsError or IsSuccess should cover most cases.
	s.logger.Debug("LCU inventory check returned non-success and non-error, or unexpected state", zap.Int("statusCode", resp.StatusCode()))
	return false
}

func (s *Service) UpdateFromLCU() error {
	summonerRented, err := s.summonerService.UpdateFromLCU()
	if err != nil {
		s.logger.Error("Failed to update account from LCU via summonerService", zap.Error(err))
		return fmt.Errorf("summonerService.UpdateFromLCU failed: %w", err)
	}
	summonerUpdated, err := s.accountState.Update(summonerRented)
	if err != nil {
		s.logger.Error("Failed to update account state", zap.Error(err))
		return fmt.Errorf("accountState.Update failed: %w", err)
	}

	if summonerRented == nil {
		s.logger.Warn("summonerService.UpdateFromLCU returned nil data, cannot save to database.")
		return nil // Or an error like: errors.New("no summoner data to save")
	}

	summonerResponse, err := s.Api.Save(*summonerUpdated)
	if err != nil {
		s.logger.Error("Failed to save account to database via Api.Save", zap.Error(err))
		return fmt.Errorf("Api.Save failed: %w", err)
	}
	// Wails event emission is generally thread-safe.
	app := application.Get()
	if app != nil { // Good practice to check if app is available
		app.EmitEvent(events.AccountStateChanged, summonerResponse)
	} else {
		s.logger.Warn("Wails application instance is nil, cannot emit AccountStateChanged event.")
	}
	return nil
}
