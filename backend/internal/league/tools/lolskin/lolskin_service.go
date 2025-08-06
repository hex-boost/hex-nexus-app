package lolskin

import (
	"context"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"go.uber.org/zap"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// AccountState defines the contract for account state management
type AccountState interface {
	Get() *types.PartialSummonerRented
	Update(update *types.PartialSummonerRented) (*types.PartialSummonerRented, error)
	IsNexusAccount() bool
}

type AccountClient interface {
	Save(summoner types.PartialSummonerRented) (*types.SummonerResponse, error)
	UserMe() (*types.User, error)
}

type SummonerClient interface {
	GetRanking() (*types.RankedStatsRefresh, error)
	GetLeaverBuster() (*types.LeaverBusterResponse, error)
}

type LolSkinState interface {
	GetChampionSkin(championID int32) (ChampionSkin, bool)
	UpdateSelections(selections []ChampionSkin)
	GetAllSelections() []ChampionSkin
}

type eventRequest struct {
	name string
	data []any
}

type Service struct {
	logger           logger.Loggerer
	accountClient    AccountClient
	accountState     AccountState
	lolSkin          *LolSkin
	isLolSkinEnabled bool
	lolSkinState     LolSkinState
	eventMutex       sync.Mutex
	ctx              context.Context
	lolSkinService   *Service
}

func NewService(logger logger.Loggerer, accountState AccountState, accountClient AccountClient, lolSkin *LolSkin, state LolSkinState) *Service {
	return &Service{
		logger:           logger,
		accountClient:    accountClient, // Should be set externally
		accountState:     accountState,  // Should be set externally
		lolSkin:          lolSkin,
		isLolSkinEnabled: false,
		lolSkinState:     state,
		ctx:              context.Background(),
	}
}
func (h *Service) ToggleLolSkinEnabled(enabled bool) {
	h.isLolSkinEnabled = enabled
	if !enabled {
		h.lolSkin.StopRunningPatcher()
	} else {
		h.StartInjection()
	}
	h.logger.Info("Set LolSkin enabled", zap.Bool("enabled", enabled))

}
func (h *Service) IsLolSkinEnabled() bool {
	userMe, err := h.accountClient.UserMe()
	if err != nil {
		h.logger.Error("Failed to get user data", zap.Error(err))
		h.isLolSkinEnabled = false
		h.lolSkin.StopRunningPatcher()
		return false
	}
	if !userMe.Premium.Plan.HasSkinChanger {
		h.logger.Info("Skipping champion pick event for non-premium user", zap.String("username", userMe.Username))
		h.isLolSkinEnabled = false
		h.lolSkin.StopRunningPatcher()
		return false
	}
	h.logger.Info("Lolskin enabled", zap.Bool("isLolSkinEnabled", h.isLolSkinEnabled))

	return h.isLolSkinEnabled
}
// InvalidateCache clears all skin-related data including downloads, profiles, and cache
func (h *Service) InvalidateCache() error {
	h.logger.Info("Starting cache invalidation - clearing all skin data")

	// Stop any running patcher first
	h.lolSkin.StopRunningPatcher()

	// Get the temp directory path from lolSkin instance
	tempDir := h.lolSkin.GetTempDir()
	if tempDir == "" {
		return fmt.Errorf("temp directory not found")
	}

	// Define folders to delete
	foldersToDelete := []string{
		"installed",      // Downloaded and extracted skins
		"profiles",       // Profile configurations
		"temp_downloads", // Temporary download files
		"dataDragon",     // Cached DataDragon API data
	}

	var errors []string

	// Delete each folder
	for _, folder := range foldersToDelete {
		folderPath := filepath.Join(tempDir, folder)
		if _, err := os.Stat(folderPath); err == nil {
			h.logger.Info("Deleting folder", zap.String("path", folderPath))
			if err := os.RemoveAll(folderPath); err != nil {
				errMsg := fmt.Sprintf("failed to delete %s: %v", folder, err)
				h.logger.Error("Failed to delete folder", zap.String("folder", folder), zap.Error(err))
				errors = append(errors, errMsg)
			} else {
				h.logger.Info("Successfully deleted folder", zap.String("folder", folder))
			}
		} else {
			h.logger.Info("Folder does not exist, skipping", zap.String("folder", folder))
		}
	}

	// Also delete any profile-related files in the root temp directory
	filesToDelete := []string{
		"current.profile",
		"mod-tools-log.txt",
	}

	for _, file := range filesToDelete {
		filePath := filepath.Join(tempDir, file)
		if _, err := os.Stat(filePath); err == nil {
			h.logger.Info("Deleting file", zap.String("path", filePath))
			if err := os.Remove(filePath); err != nil {
				errMsg := fmt.Sprintf("failed to delete %s: %v", file, err)
				h.logger.Error("Failed to delete file", zap.String("file", file), zap.Error(err))
				errors = append(errors, errMsg)
			} else {
				h.logger.Info("Successfully deleted file", zap.String("file", file))
			}
		}
	}

	// Recreate the necessary directories
	dirsToRecreate := []string{
		"installed",
		"profiles",
	}

	for _, dir := range dirsToRecreate {
		dirPath := filepath.Join(tempDir, dir)
		if err := os.MkdirAll(dirPath, 0755); err != nil {
			errMsg := fmt.Sprintf("failed to recreate directory %s: %v", dir, err)
			h.logger.Error("Failed to recreate directory", zap.String("dir", dir), zap.Error(err))
			errors = append(errors, errMsg)
		} else {
			h.logger.Info("Successfully recreated directory", zap.String("dir", dir))
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("cache invalidation completed with errors: %s", strings.Join(errors, "; "))
	}

	h.logger.Info("Cache invalidation completed successfully")
	return nil
}
// Modify StartInjection method in lolskin_service.go
func (h *Service) StartInjection() {
	if !h.IsLolSkinEnabled() {
		h.logger.Info("LolSkin is not enabled, skipping injection")
		return
	}

	// Stop any running patcher before starting a new one
	h.lolSkin.StopRunningPatcher()

	// Get all selected skins
	skinsSelected := h.lolSkinState.GetAllSelections()
	if len(skinsSelected) == 0 {
		h.logger.Info("No skins selected, nothing to inject")
		return
	}

	// Store just skin names for injection
	var skinNames []string

	// Download all selected skins
	for _, skin := range skinsSelected {
		if skin.ChampionID == 0 || skin.SkinID == 0 {
			h.logger.Info("Skipping injection for invalid skin selection",
				zap.Int32("championId", skin.ChampionID),
				zap.Int32("skinId", skin.SkinID))
			continue
		}

		// Download the skin - but use the modified version that saves to installed folder
		skinName, err := h.lolSkin.DownloadSkins(skin.ChampionID, skin.SkinID)
		if err != nil {
			h.logger.Error("Failed to download skin",
				zap.Int32("championId", skin.ChampionID),
				zap.Int32("skinId", skin.SkinID),
				zap.Error(err))
			continue
		}

		// Add just the skin name to inject
		skinNames = append(skinNames, skinName)
	}

	// If we have skins to inject
	if len(skinNames) > 0 {
		h.logger.Info("Injecting skins", zap.Int("count", len(skinNames)))

		// Inject all skins at once using just their names
		err := h.lolSkin.InjectFantome(skinNames)
		if err != nil {
			h.logger.Error("Failed to inject skins", zap.Error(err))
			return
		}

		h.logger.Info("Successfully injected all skins")
	}
}
