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

func (s *AccountsRepository) Save(summoner types.SummonerRented) error {
	_, err := s.api.Put("/api/accounts/refresh", summoner, nil)
	return err
}
func (s *AccountsRepository) GetAllRented() ([]types.SummonerRented, error) {
	var summoners types.RentedAccountsResponse
	_, err := s.api.Get("/api/accounts/rented", &summoners)
	if err != nil {
		return nil, err
	}
	return summoners.Data, nil

}
func (s *AccountsRepository) GetAll() ([]types.SummonerBase, error) {
	var summoners []types.SummonerBase
	_, err := s.api.Get("/api/accounts/available", &summoners)
	if err != nil {
		return nil, err
	}
	return summoners, nil

}
