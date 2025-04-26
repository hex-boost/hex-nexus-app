package account

import (
	"fmt"

	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/client"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"go.uber.org/zap"
)

type Client struct {
	api    *client.HTTPClient
	logger *logger.Logger
}

func NewClient(logger *logger.Logger, api *client.HTTPClient) *Client {
	return &Client{
		api:    api,
		logger: logger,
	}
}

func (s *Client) Save(summoner types.PartialSummonerRented) (*types.SummonerResponse, error) {
	if summoner.Username == "" {
		return nil, fmt.Errorf("username is required")
	}
	client := resty.New()
	client.SetBaseURL(config.BackendURL)
	client.SetHeader("Content-Type", "application/json")
	client.SetHeader("Accept", "application/json")
	client.SetAuthToken(config.RefreshApiKey)
	var refreshResponseData types.RefreshResponseData
	req := client.R().SetBody(summoner).SetResult(&refreshResponseData)
	// Make the request manually instead of using s.api.Put
	resp, err := req.Put("/api/accounts/refresh")
	if err != nil {
		s.logger.Error("error saving summoner", zap.Error(err), zap.Int("statusCode", resp.StatusCode()), zap.Any("body", resp.String()))
		return nil, err
	}
	if resp.IsError() {
		s.logger.Error("error saving summoner", zap.Int("statusCode", resp.StatusCode()), zap.Any("body", resp.String()))
		return nil, fmt.Errorf("error saving summoner: %d - %s", resp.StatusCode(), resp.String())
	}

	return &refreshResponseData.Data, nil
}

func (s *Client) GetAllRented() ([]types.SummonerRented, error) {
	var summoners types.RentedAccountsResponse
	_, err := s.api.Get("/api/accounts/rented", &summoners)
	if err != nil {
		return nil, err
	}
	return summoners.Data, nil
}

func (s *Client) GetAll() ([]types.SummonerBase, error) {
	var summoners []types.SummonerBase
	_, err := s.api.Get("/api/accounts/available", &summoners)
	if err != nil {
		return nil, err
	}
	return summoners, nil
}
