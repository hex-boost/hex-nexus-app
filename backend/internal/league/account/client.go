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
	cfg    *config.Config
}

func NewClient(logger *logger.Logger, cfg *config.Config, api *client.HTTPClient) *Client {
	return &Client{
		api:    api,
		logger: logger,
		cfg:    cfg,
	}
}
func (s *Client) GetApiTokenClient() *resty.Client {

	apiTokenClient := resty.New()
	apiTokenClient.SetBaseURL(s.cfg.BackendURL)
	apiTokenClient.SetHeader("Content-Type", "application/json")
	apiTokenClient.SetHeader("Accept", "application/json")
	apiTokenClient.SetHeader("Authorization", "Bearer "+s.cfg.RefreshApiKey)

	return apiTokenClient
}
func (s *Client) Save(summoner types.PartialSummonerRented) (*types.SummonerResponse, error) {
	if summoner.Username == "" {
		return nil, fmt.Errorf("username is required")
	}
	apiTokenClient := s.GetApiTokenClient()
	var refreshResponseData types.RefreshResponseData
	req := apiTokenClient.R().SetBody(summoner).SetResult(&refreshResponseData)
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
	var response types.AccountsResponse
	_, err := s.api.Get("/api/accounts/available", &response)
	if err != nil {
		return nil, err
	}
	return response.Data, nil
}
func (s *Client) UserMe() (*types.User, error) {
	var response types.User
	_, err := s.api.Get("/api/users/me", &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}
func (s *Client) UsernameExistsInDatabase(username string) (bool, error) {
	var result bool
	apiTokenClient := s.GetApiTokenClient()
	endpoint := fmt.Sprintf("/api/accounts/usernames/%s", username)
	response, err := apiTokenClient.R().SetResult(&result).Post(endpoint)
	if err != nil {
		return false, err
	}
	if response.IsError() {

		if response.StatusCode() == 404 {
			return false, nil
		}
		s.logger.Warn("error checking if username exists in database", zap.Int("statusCode", response.StatusCode()), zap.Any("body", response.String()))
		return false, fmt.Errorf("error checking if username exists in database: %d - %s", response.StatusCode(), response.String())
	}
	return result, nil
}
