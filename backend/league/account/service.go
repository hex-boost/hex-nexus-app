package account

import (
	"github.com/hex-boost/hex-nexus-app/backend/league/account/events"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"go.uber.org/zap"
)

type Service struct {
	logger             *utils.Logger
	accountState       *State
	accoutnsRepository Client
}

func NewService(logger *utils.Logger, accountState *State) *Service {
	return &Service{
		logger:       logger,
		accountState: accountState,
	}
}
func (s *Service) Update() {

	s.logger.Info("Manually refreshing account state", zap.String("username", username))
	summonerResponse, err := s.accountsRepository.Save(s.account)
	if err != nil {
		ws.logger.Error("Failed to manually update account from LCU", zap.Error(err))
		return
	}

	// Emit event to frontend
	if ws.app != nil {
		ws.app.EmitEvent(events.AccountStateChanged, summonerResponse)
	}

}
