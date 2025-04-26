package account

import (
	"errors"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"sync"
)

type State struct {
	mutex          sync.RWMutex
	account        *types.PartialSummonerRented
	isNexusAccount bool
}

func NewState() *State {
	return &State{
		account: &types.PartialSummonerRented{},
	}
}

// IsNexusAccount checks if the current account is a Nexus-managed account
func (s *State) IsNexusAccount() bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s.isNexusAccount
}

// SetNexusAccount updates the Nexus account status and returns if state changed
func (s *State) SetNexusAccount(isNexusAccount bool) bool {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	previousState := s.isNexusAccount
	s.isNexusAccount = isNexusAccount

	return previousState != s.isNexusAccount
}
func (s *State) Get() *types.PartialSummonerRented {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// Return a copy to prevent race conditions
	accountCopy := *s.account
	return &accountCopy
}

func (s *State) Update(update *types.PartialSummonerRented) (*types.PartialSummonerRented, error) {
	if update == nil {
		return nil, errors.New("update cannot be nil")
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Initialize current account if nil
	if s.account == nil {
		s.account = &types.PartialSummonerRented{}
	}

	// Update only non-empty fields
	if update.Username != "" {
		s.account.Username = update.Username
	}
	if update.Password != nil {
		s.account.Password = update.Password
	}
	if update.GameName != nil {
		s.account.GameName = update.GameName
	}
	if update.Type != nil {
		s.account.Type = update.Type
	}
	if update.LeaverBuster != nil {
		s.account.LeaverBuster = update.LeaverBuster
	}
	if update.Tagline != nil {
		s.account.Tagline = update.Tagline
	}
	if update.Server != nil {
		s.account.Server = update.Server
	}
	if update.LCUchampions != nil {
		s.account.LCUchampions = update.LCUchampions
	}
	if update.LCUskins != nil {
		s.account.LCUskins = update.LCUskins
	}
	if update.Ban != nil {
		s.account.Ban = update.Ban
	}
	if update.IsPhoneVerified != nil {
		s.account.IsPhoneVerified = update.IsPhoneVerified
	}
	if update.IsEmailVerified != nil {
		s.account.IsEmailVerified = update.IsEmailVerified
	}
	if update.Rankings != nil {
		s.account.Rankings = update.Rankings
	}
	if update.AccountLevel != nil {
		s.account.AccountLevel = update.AccountLevel
	}

	// Handle currencies separately to retain existing values if not provided
	if update.Currencies != nil {
		if s.account.Currencies == nil {
			s.account.Currencies = &types.CurrenciesPointer{}
		}
		if update.Currencies.LolBlueEssence != nil {
			s.account.Currencies.LolBlueEssence = update.Currencies.LolBlueEssence
		}
		if update.Currencies.RP != nil {
			s.account.Currencies.RP = update.Currencies.RP
		}
	}
	return s.Get(), nil

}
