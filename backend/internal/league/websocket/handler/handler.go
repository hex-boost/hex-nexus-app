package handler

import (
	"encoding/json"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"go.uber.org/zap"
)

// AccountState defines the contract for account state management
type AccountState interface {
	Get() *types.PartialSummonerRented
	Update(summonerRented *types.PartialSummonerRented)
}

// Handler implements WebSocketEventHandler with standard event handling logic
type Handler struct {
	logger       *logger.Logger
	accountState AccountState
}

// New creates a new WebSocket event handler
func New(logger *logger.Logger, accountState AccountState) *Handler {
	return &Handler{
		accountState: accountState,
		logger:       logger,
	}
}

// WalletEvent handles wallet update events from the LCU
func (h *Handler) WalletEvent(event websocket.LCUWebSocketEvent) {
	h.logger.Info("Received wallet event", zap.String("uri", event.URI))

	var walletData types.Wallet
	if err := json.Unmarshal(event.Data, &walletData); err != nil {
		h.logger.Error("Failed to parse wallet data", zap.Error(err))
		return
	}

	// Log wallet information
	h.logger.Info("Wallet update", zap.Any("data", walletData))

	// Extract blue essence value
	blueEssence := walletData.LolBlueEssence
	currentAccount := h.accountState.Get()
	if currentAccount == nil {
		return
	}

	needsUpdate := true
	if currentAccount.Currencies != nil &&
		currentAccount.Currencies.LolBlueEssence != nil &&
		*currentAccount.Currencies.LolBlueEssence == blueEssence {
		needsUpdate = false
	}

	if needsUpdate {
		summonerRented := types.PartialSummonerRented{
			Currencies: &types.CurrenciesPointer{LolBlueEssence: &blueEssence},
		}
		h.accountState.Update(&summonerRented)
	} else {
		h.logger.Debug("Blue essence unchanged, skipping refresh",
			zap.Int("value", blueEssence))
	}
}
