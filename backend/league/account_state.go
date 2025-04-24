package league

import (
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"sync"
)

// AccountState tracks the current state of the account to detect changes
type AccountState struct {
	mutex          sync.RWMutex
	currentAccount *types.PartialSummonerRented
}

func NewAccountState() *AccountState {
	return &AccountState{
		currentAccount: &types.PartialSummonerRented{},
	}
}

// UpdateAccount updates the current account state and returns true if changed

// GetCurrentAccount returns a copy of the current account state
func (as *AccountState) GetCurrentAccount() *types.PartialSummonerRented {
	as.mutex.RLock()
	defer as.mutex.RUnlock()

	// Return a copy to prevent race conditions
	accountCopy := *as.currentAccount
	return &accountCopy
}

func (as *AccountState) UpdateWalletData(blueEssence int) {
	as.mutex.Lock()
	defer as.mutex.Unlock()

	if as.currentAccount.Currencies == nil {
		as.currentAccount.Currencies = &types.CurrenciesPointer{}
	}

	as.currentAccount.Currencies.LolBlueEssence = &blueEssence
}
