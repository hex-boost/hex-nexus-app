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

type App interface {
	EmitEvent(name string, data ...any)
}
type SummonerClient interface {
	GetRanking() (*types.RankedStatsRefresh, error)
	GetLeaverBuster() (*types.LeaverBusterResponse, error)
}

type LolSkinState interface {
	GetChampionSkin(championID int32) (ChampionSkin, bool)
}

type eventRequest struct {
	name string
	data []any
}

type Service struct {
	logger                   logger.Loggerer
	accountClient            AccountClient
	accountState             AccountState
	lolSkin                  *LolSkin
	isLolSkinEnabled         bool
	eventCh                  chan eventRequest
	lolSkinState             LolSkinState
	previousChampionInjected int
	app                      App
	eventMutex               sync.Mutex
	ctx                      context.Context
	lolSkinService           *Service
}

func NewService(logger logger.Loggerer, accountState AccountState, accountClient AccountClient, lolSkin *LolSkin, state LolSkinState) *Service {
	return &Service{
		logger:           logger,
		accountClient:    accountClient, // Should be set externally
		accountState:     accountState,  // Should be set externally
		lolSkin:          lolSkin,
		isLolSkinEnabled: false,
		eventCh:          make(chan eventRequest, 10),
		lolSkinState:     state,
		ctx:              context.Background(),
	}
}
func (h *Service) ToggleLolSkinEnabled(enabled bool) {
	h.isLolSkinEnabled = enabled
	if !enabled {
		h.lolSkin.StopRunningPatcher()
		h.previousChampionInjected = 0 // Reset if skin feature is disabled
	} else {
		// If enabling, we might want to start the patcher or any other necessary setup
		if err := h.lolSkin.InjectFantome(); err != nil {
			h.logger.Error("Failed to start LolSkin patcher", zap.Error(err))
			return
		}
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

func (h *Service) StartInjection() {
	return

}
