package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account/events"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/tools/lolskin"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
)

// AccountState defines the contract for account state management
type AccountState interface {
	Get() *types.PartialSummonerRented
	Update(update *types.PartialSummonerRented) (*types.PartialSummonerRented, error)
}

type AccountClient interface {
	Save(summoner types.PartialSummonerRented) (*types.SummonerResponse, error)
}

type App interface {
	EmitEvent(name string, data ...any)
}
type SummonerClient interface {
	GetRanking() (*types.RankedStatsRefresh, error)
}
type LolSkin interface {
	DownloadFantome(championId int32, skinId int32) (string, error)
	InjectFantome(fantomePath string) error
}

type LolSkinState interface {
	GetChampionSkin(championID int32) (lolskin.ChampionSkin, bool)
}

// Handler implements WebSocketEventHandler with standard event handling logic
type Handler struct {
	logger                   logger.Loggerer
	accountClient            AccountClient
	summonerClient           SummonerClient
	accountState             AccountState
	lolSkin                  LolSkin
	lolSkinState             LolSkinState
	previousChampionInjected int
	app                      App
}

// New creates a new WebSocket event handler
func New(logger logger.Loggerer, accountState AccountState, accountClient AccountClient, summonerClient SummonerClient, lolSkin LolSkin, lolSkinState LolSkinState, app App) *Handler {
	return &Handler{
		accountState:   accountState,
		summonerClient: summonerClient,
		logger:         logger,
		lolSkin:        lolSkin,
		lolSkinState:   lolSkinState,
		accountClient:  accountClient,
		app:            app,
	}

}
func (h *Handler) OnStartup(ctx context.Context, options application.ServiceOptions) error {

	fmt.Println("fodase")
	return nil
}

// processAccountUpdate handles the common pattern of updating account state and saving it
func (h *Handler) ProcessAccountUpdate(update *types.PartialSummonerRented) error {
	accountUpdated, err := h.accountState.Update(update)
	if err != nil {
		h.logger.Error("Failed to update account state", zap.Error(err))
		return err
	}

	accountSaved, err := h.accountClient.Save(*accountUpdated)
	if err != nil {
		h.logger.Error("Failed to save account data", zap.Error(err))
		return err
	}
	h.app.EmitEvent(events.AccountStateChanged, accountSaved)
	return nil
}

// Wallet handles wallet update events from the LCU
func (h *Handler) Wallet(event websocket.LCUWebSocketEvent) {
	var walletData types.Wallet
	if err := json.Unmarshal(event.Data, &walletData); err != nil {
		h.logger.Error("Failed to parse wallet data", zap.Error(err))
		return
	}

	h.logger.Info("Wallet update", zap.Any("data", walletData))

	blueEssence := walletData.LolBlueEssence
	currentAccount := h.accountState.Get()

	// Check if update is needed
	needsUpdate := true
	if currentAccount != nil && currentAccount.Currencies != nil &&
		currentAccount.Currencies.LolBlueEssence != nil &&
		*currentAccount.Currencies.LolBlueEssence == blueEssence {
		h.logger.Debug("Blue essence unchanged, skipping refresh", zap.Int("value", blueEssence))
		needsUpdate = false
	}

	if needsUpdate {
		summonerRented := &types.PartialSummonerRented{
			Currencies: &types.CurrenciesPointer{LolBlueEssence: &blueEssence},
		}
		err := h.ProcessAccountUpdate(summonerRented)
		if err != nil {
			h.logger.Error("Failed to process account update", zap.Error(err))
			return
		}
		h.logger.Info("Account blue essence updated", zap.Int("value", blueEssence))
	}
}

func (h *Handler) ChampionPurchase(event websocket.LCUWebSocketEvent) {
	var championsData types.LolInventoryV2
	if err := json.Unmarshal(event.Data, &championsData); err != nil {
		h.logger.Error("Failed to parse champion data", zap.Error(err))
		return
	}
	if len(championsData) == 0 {
		return
	}

	if championsData[0].InventoryType != "CHAMPION" {
		return
	}

	// Extract owned champion IDs
	championIds := make([]int, 0)
	for _, item := range championsData {
		if item.InventoryType == "CHAMPION" && item.Owned {
			championIds = append(championIds, item.ItemId)
		}
	}

	championCount := len(championIds)
	h.logger.Info("Champions quantity", zap.Int("count", championCount))

	currentAccount := h.accountState.Get()

	// Check if update is needed
	needsUpdate := true
	if currentAccount != nil && currentAccount.LCUchampions != nil {
		// Check if the count in the current state is greater than or equal to what we just found
		currentCount := len(*currentAccount.LCUchampions)
		if currentCount >= championCount {
			h.logger.Debug("ChampionPurchase count unchanged or less than current",
				zap.Int("current", currentCount),
				zap.Int("new", championCount))
			needsUpdate = false
		}
	}

	if needsUpdate {
		summonerRented := &types.PartialSummonerRented{
			LCUchampions: &championIds,
		}
		err := h.ProcessAccountUpdate(summonerRented)
		if err != nil {
			h.logger.Error("Failed to process account update", zap.Error(err))
			return
		}
		h.logger.Info("Account champions updated", zap.Int("count", championCount))
	}
}

// GameflowPhase handles gameflow phase changes from the LCU
func (h *Handler) GameflowPhase(event websocket.LCUWebSocketEvent) {
	var gameflowPhase types.LolChallengesGameflowPhase
	if err := json.Unmarshal(event.Data, &gameflowPhase); err != nil {
		h.logger.Error("Failed to parse gameflow phase data", zap.Error(err))
		return
	}

	h.app.EmitEvent(event.EventTopic, gameflowPhase)

	h.logger.Info("Gameflow phase changed", zap.String("phase", string(gameflowPhase)))

	// Check if this is an end-game phase
	if gameflowPhase == types.LolChallengesGameflowPhaseEndOfGame || gameflowPhase == types.LolChallengesGameflowPhasePreEndOfGame || gameflowPhase == types.LolChallengesGameflowPhaseWaitingForStats {
		h.logger.Info("Game ended, fetching ranking information")

		// Get the current ranking information
		ranking, err := h.summonerClient.GetRanking()
		if err != nil {
			h.logger.Error("Failed to get ranking information", zap.Error(err))
			return
		}

		// Get current account state
		currentAccount := h.accountState.Get()

		// Check if update is needed
		needsUpdate := true
		if currentAccount != nil && currentAccount.Rankings != nil {
			currentRank := currentAccount.Rankings

			if IsRankingSame(currentRank.RankedSolo5x5, ranking.RankedSolo5x5) &&
				IsRankingSame(currentRank.RankedFlexSR, ranking.RankedFlexSR) {
				h.logger.Debug("Rankings unchanged, skipping update")
				needsUpdate = false
			}
		}

		if needsUpdate {
			// Update the account with the new ranking information
			summonerRented := &types.PartialSummonerRented{
				Rankings: ranking,
			}

			err = h.ProcessAccountUpdate(summonerRented)
			if err != nil {
				h.logger.Error("Failed to process account update", zap.Error(err))
				return
			}

			h.logger.Info("Account ranking updated successfully")
		}
	}
}
func (h *Handler) ChampionPicked(event websocket.LCUWebSocketEvent) {
	var LolChampSelect types.LolChampSelectGridChampions
	if err := json.Unmarshal(event.Data, &LolChampSelect); err != nil {
		h.logger.Error("Failed to parse champion data", zap.Error(err))
		return
	}

	if LolChampSelect.SelectionStatus.SelectedByMe &&
		(!LolChampSelect.SelectionStatus.PickIntented &&
			!LolChampSelect.SelectionStatus.PickIntentedByMe) {

		championId := int32(LolChampSelect.ChampionId)
		h.logger.Info("Champion picked",
			zap.String("championName", LolChampSelect.Name),
			zap.Int32("championId", championId))

		championSkin, found := h.lolSkinState.GetChampionSkin(championId)
		if !found {
			h.logger.Info("Champion skin not found for this champion")
			h.previousChampionInjected = 0 // Reset on error

			return
		}

		// Download and inject in a single goroutine to ensure proper sequence
		go func() {
			fantomePath, err := h.lolSkin.DownloadFantome(championId, championSkin.SkinID)
			if err != nil {
				h.logger.Error("Failed to download fantome", zap.Error(err))
				h.previousChampionInjected = 0 // Reset on error

				return
			}

			h.logger.Info("Injecting skin for champion",
				zap.String("championName", LolChampSelect.Name),
				zap.Int32("skinID", championSkin.SkinID))
			err = h.lolSkin.InjectFantome(fantomePath)
			if err != nil {
				h.logger.Error("Failed to inject fantome", zap.Error(err))
				h.previousChampionInjected = 0 // Reset on error
				return
			}

			h.previousChampionInjected = int(championId)
		}()
	}
}
func (h *Handler) ReemitEvent(event websocket.LCUWebSocketEvent) {
	h.logger.Info("Re-emitting event", zap.String("event", event.EventTopic), zap.String("uri", event.URI))
	h.app.EmitEvent(event.EventTopic, event.Data)
}

// IsRankingSame compares two RankedDetails objects to determine if they are identical
func IsRankingSame(oldRank, newRank types.RankedDetails) bool {
	// Compare tier, division and rank
	if oldRank.Tier != newRank.Tier ||
		oldRank.Division != newRank.Division ||
		oldRank.Rank != newRank.Rank {
		return false
	}

	// Compare LP
	if oldRank.LeaguePoints != newRank.LeaguePoints {
		return false
	}

	// Compare game counts
	if oldRank.Wins != newRank.Wins ||
		oldRank.Losses != newRank.Losses {
		return false
	}

	// Compare provisional stats
	if oldRank.IsProvisional != newRank.IsProvisional ||
		oldRank.ProvisionalGameThreshold != newRank.ProvisionalGameThreshold ||
		oldRank.ProvisionalGamesRemaining != newRank.ProvisionalGamesRemaining {
		return false
	}

	// If we've gotten here, the rankings are the same
	return true
}

func (h *Handler) SkinSelectionChanged(championID, skinID int32) {
	if h.previousChampionInjected != int(championID) {
		return
	}
	h.logger.Info("Skin selection changed",
		zap.Int32("championId", championID),
		zap.Int32("skinId", skinID))

	// Download and inject in a single goroutine to ensure proper sequence
	go func() {

		fantomePath, err := h.lolSkin.DownloadFantome(championID, skinID)
		if err != nil {
			h.logger.Error("Failed to download fantome", zap.Error(err))
			h.previousChampionInjected = 0 // Reset on error

			return
		}

		h.logger.Info("Injecting new skin for champion",
			zap.Int32("championId", championID),
			zap.Int32("skinId", skinID))

		err = h.lolSkin.InjectFantome(fantomePath)
		if err != nil {
			h.logger.Error("Failed to inject fantome", zap.Error(err))
			h.previousChampionInjected = 0 // Reset on error
			return
		}
		h.previousChampionInjected = int(championID)
	}()
}
