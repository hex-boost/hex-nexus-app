package lolskin

import (
	"context"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"go.uber.org/zap"
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
	if userMe.Premium.Tier != "pro" {
		h.logger.Info("Skipping champion pick event for non-premium user", zap.String("username", userMe.Username))
		h.isLolSkinEnabled = false
		h.lolSkin.StopRunningPatcher()
		return false
	}
	h.logger.Info("Lolskin enabled", zap.Bool("isLolSkinEnabled", h.isLolSkinEnabled))

	return h.isLolSkinEnabled
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
