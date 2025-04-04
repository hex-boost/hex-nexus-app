package repository

import (
	"github.com/hex-boost/hex-nexus-app/backend/types"
)

type AccountsRepository struct {
	api *APIRepository
}

func NewAccountsRepository(api *APIRepository) *AccountsRepository {
	return &AccountsRepository{
		api: api,
	}
}

func (s *AccountsRepository) Save(summoner types.Summoner) error {
	_, err := s.api.Put("/accounts/refresh", summoner, nil)
	return err
}
func (s *AccountsRepository) GetAll() ([]types.Summoner, error) {
	var summoners []types.Summoner
	_, err := s.api.Get("/accounts", &summoners)
	if err != nil {
		return nil, err
	}
	return summoners, nil

}
