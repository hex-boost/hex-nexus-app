package repository

import (
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
)

type LeagueRepository struct {
	client *resty.Client
	logger *utils.Logger
}

func NewLeagueRepository(logger *utils.Logger) *LeagueRepository {
	client := resty.New()

	// Configure the client
	client.SetBaseURL("http://localhost:1337/api")
	client.SetHeader("Content-Type", "application/json")
	client.SetHeader("Accept", "application/json")
	return &LeagueRepository{
		client: client,
		logger: logger,
	}
}

func (l *LeagueRepository) SaveSummoner(summoner types.Summoner, jwt string) error {
	l.client.SetHeader("Authorization", "Bearer "+jwt)

	// Create payload with data field containing summoner in an array
	//payload := map[string]interface{}{
	//	"data": []types.Summoner{summoner},
	//}

	response, err := l.client.R().SetBody(summoner).Put("/accounts/refresh")
	if err != nil {
		l.logger.Errorf("Failed to make request to save summoner: %v", err)
		return fmt.Errorf("failed to make request to save summoner: %v", err)
	}

	if response.StatusCode() != 200 {
		errMsg := fmt.Sprintf("Failed to save summoner, status code: %d, response: %s",
			response.StatusCode(), response.String())
		l.logger.Errorf(errMsg)
		return fmt.Errorf(errMsg)
	}

	return nil
}
