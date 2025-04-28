package handler

import (
	"encoding/json"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account/events"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
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

// Handler implements WebSocketEventHandler with standard event handling logic
type Handler struct {
	logger         logger.Loggerer
	accountClient  AccountClient
	summonerClient SummonerClient
	accountState   AccountState
	app            App
}

// New creates a new WebSocket event handler
func New(logger logger.Loggerer, app App, accountState AccountState, accountClient AccountClient, summonerClient SummonerClient) *Handler {
	return &Handler{
		accountState:   accountState,
		summonerClient: summonerClient,
		logger:         logger,
		accountClient:  accountClient,
		app:            app,
	}
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

func (h *Handler) Champion(event websocket.LCUWebSocketEvent) {
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
			h.logger.Debug("Champion count unchanged or less than current",
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
// GameflowPhase handles gameflow phase changes from the LCU
func (h *Handler) GameflowPhase(event websocket.LCUWebSocketEvent) {
	var gameflowPhase types.LolChallengesGameflowPhase
	if err := json.Unmarshal(event.Data, &gameflowPhase); err != nil {
		h.logger.Error("Failed to parse gameflow phase data", zap.Error(err))
		return
	}

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
