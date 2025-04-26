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

// Handler implements WebSocketEventHandler with standard event handling logic
type Handler struct {
	logger        *logger.Logger
	accountClient AccountClient
	accountState  AccountState
	app           App
}

// New creates a new WebSocket event handler
func New(logger *logger.Logger, app App, accountState AccountState, accountClient AccountClient) *Handler {
	return &Handler{
		accountState:  accountState,
		logger:        logger,
		accountClient: accountClient,
		app:           app,
	}
}

// WalletEvent handles wallet update events from the LCU
func (h *Handler) WalletEvent(event websocket.LCUWebSocketEvent) {
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

	needsUpdate := true
	if currentAccount.Currencies != nil &&
		currentAccount.Currencies.LolBlueEssence != nil &&
		*currentAccount.Currencies.LolBlueEssence == blueEssence {
		needsUpdate = false
	}

	if needsUpdate {
		summonerRented := &types.PartialSummonerRented{
			Currencies: &types.CurrenciesPointer{LolBlueEssence: &blueEssence},
		}
		accountUpdated, err := h.accountState.Update(summonerRented)
		if err != nil {
			h.logger.Error("Failed to update account state", zap.Error(err))
			return

		}
		accountSaved, err := h.accountClient.Save(*accountUpdated)
		if err != nil {
			h.logger.Error("Failed to save account data", zap.Error(err))
			return
		}
		h.app.EmitEvent(events.AccountStateChanged, accountSaved)

	} else {
		h.logger.Debug("Blue essence unchanged, skipping refresh",
			zap.Int("value", blueEssence))
	}
}
