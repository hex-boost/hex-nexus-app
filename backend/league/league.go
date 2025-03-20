package league

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"go.uber.org/zap"
	"net/http"
)

// SummonerClient provides methods for interacting with the League of Legends.lcu.client
type SummonerClient struct {
	lcu      *LCUConnection
	lcuUtils *LCUutils
	logger   *utils.Logger
	ctx      context.Context
}

// NewSummonerClient creates a new League client
func NewSummonerClient(logger *utils.Logger) *SummonerClient {
	return &SummonerClient{
		lcu:    nil, // Will be initialized when connecting
		logger: logger,
		ctx:    context.Background(),
	}
}

// DecodeRiotJWT decodes a Riot JWT token without verification

// GetLoginSession gets current user login session information
func (s *SummonerClient) GetLoginSession() (*types.LoginSession, error) {
	s.logger.Debug("Fetching login session information")

	var result types.LoginSession
	resp, err := s.lcu.client.R().SetResult(&result).
		Get("/lol-login/v1/session")

	if err != nil {
		s.logger.Error("Error fetching login session data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get login session data: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}
	return &result, nil
}

// GetCurrentSummoner gets basic summoner information
func (s *SummonerClient) GetCurrentSummoner() (*types.CurrentSummoner, error) {
	s.logger.Debug("Fetching summoner data")
	var result types.CurrentSummoner
	resp, err := s.lcu.client.R().SetResult(&result).
		Get("/lol-summoner/v1/current-summoner")

	if err != nil {
		s.logger.Error("Error fetching summoner data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get summoner data: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	s.logger.Info("Successfully retrieved summoner data",
		zap.String("gameName", fmt.Sprintf("%v", result.GameName)),
		zap.String("tagLine", fmt.Sprintf("%v", result.TagLine)))

	return &result, nil
}
func (s *SummonerClient) getAssetsIds(assets []interface{}) ([]int, error) {
	var result []int
	for _, asset := range assets {
		if championMap, ok := asset.(map[string]interface{}); ok {
			if idFloat, ok := championMap["id"].(float64); ok {
				result = append(result, int(idFloat))
			}
		}
	}
	return result, nil
}

// GetChampions gets list of owned champions
func (s *SummonerClient) GetChampions() ([]int, error) {
	s.logger.Debug("Fetching owned champions")
	var encodedData string
	resp, err := s.lcu.client.R().SetResult(&encodedData).
		Get("/lol-inventory/v1/signedInventory/simple?inventoryTypes=%5B%22CHAMPION%22%5D")

	if err != nil {
		s.logger.Error("Error fetching champion data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get champions status: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	decoded, err := s.lcuUtils.DecodeRiotJWT(encodedData)
	if err != nil {
		return nil, err
	}

	champions, ok := decoded.Payload["CHAMPION"].([]interface{})
	if !ok {
		return nil, errors.New("could not parse champions data")
	}
	championsIds, err := s.getAssetsIds(champions)

	s.logger.Info("Successfully retrieved champions", zap.Int("count", len(championsIds)))
	return championsIds, nil
}

// GetSkins gets list of owned skins
func (s *SummonerClient) GetSkins() ([]int, error) {
	s.logger.Debug("Fetching owned champions")
	var encodedData string
	resp, err := s.lcu.client.R().SetResult(&encodedData).
		Get("/lol-inventory/v1/signedInventory/simple?inventoryTypes=%5B%22CHAMPION%22%5D")

	if err != nil {
		s.logger.Error("Error fetching champion data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get champions status: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	decoded, err := s.lcuUtils.DecodeRiotJWT(encodedData)
	if err != nil {
		return nil, err
	}

	skins, ok := decoded.Payload["CHAMPION_SKIN"].([]interface{})
	if !ok {
		return nil, errors.New("could not parse champions data")
	}
	skinsIds, err := s.getAssetsIds(skins)

	s.logger.Info("Successfully retrieved champions", zap.Int("count", len(skins)))
	return skinsIds, nil
}

// GetCurrency gets account currencies (RP, BE, etc)
func (s *SummonerClient) GetCurrency() (map[string]interface{}, error) {
	s.logger.Debug("Fetching account currency information")

	resp, err := s.lcu.client.R().
		Get("/lol-inventory/v1/wallet?currencyTypes=%5B%22EA%22%5D")

	if err != nil {
		s.logger.Error("Error fetching currency data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get wallet status: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, err
	}

	s.logger.Info("Currency data retrieved",
		zap.Any("RP", result["RP"]),
		zap.Any("BE", result["lol_blue_essence"]))

	return result, nil
}

// GetRanking gets player ranking information for all queues
func (s *SummonerClient) GetRanking() (map[string]interface{}, error) {
	s.logger.Info("Fetching ranking data")

	resp, err := s.lcu.client.R().
		Get("/lol-ranked/v1/current-ranked-stats")

	if err != nil {
		s.logger.Error("Error fetching ranking data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get ranking status: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	var data map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &data); err != nil {
		return nil, err
	}

	queueMap, ok := data["queueMap"].(map[string]interface{})
	if !ok {
		return nil, errors.New("could not parse queue map")
	}

	result := make(map[string]interface{})
	for queue, info := range queueMap {
		if queue == "RANKED_SOLO_5x5" || queue == "RANKED_FLEX_SR" {
			result[queue] = info
		}
	}

	s.logger.Info("Ranking data retrieved")
	s.logger.Debug("Ranking details",
		zap.Any("FLEX", result["RANKED_FLEX_SR"]),
		zap.Any("SOLO", result["RANKED_SOLO_5x5"]))

	return result, nil
}

// GetRegion gets the account's region
func (s *SummonerClient) GetRegion() (string, error) {
	s.logger.Debug("Fetching account region")

	resp, err := s.lcu.client.R().
		Get("/lol-chat/v1/me")

	if err != nil {
		s.logger.Error("Error fetching region data", zap.Error(err))
		return "UNKNOWN", err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get region status: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return "UNKNOWN", errors.New(errMsg)
	}

	var data map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &data); err != nil {
		return "UNKNOWN", err
	}

	region, ok := data["platformId"].(string)
	if !ok {
		return "UNKNOWN", errors.New("could not parse region")
	}

	s.logger.Info("Account region retrieved", zap.String("region", region))
	return region, nil
}
