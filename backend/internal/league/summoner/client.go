package summoner

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	lcu2 "github.com/hex-boost/hex-nexus-app/backend/internal/league/lcu"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"go.uber.org/zap"
)

type Client struct {
	conn   *lcu2.Connection
	lcuJwt *lcu2.JWT
	logger *logger.Logger
	ctx    context.Context
}

func NewClient(logger *logger.Logger, conn *lcu2.Connection) *Client {
	return &Client{
		conn:   conn,
		logger: logger,
		ctx:    context.Background(),
	}
}

func (s *Client) GetLoginSession() (*types.LoginSession, error) {
	var result types.LoginSession
	resp, err := s.conn.Client.R().SetResult(&result).
		Get("/lol-login/v1/session")
	if err != nil {
		s.logger.Debug("Error fetching login session data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get login session data: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}
	return &result, nil
}

func (s *Client) GetCurrentSummoner() (*types.CurrentSummoner, error) {
	s.logger.Debug("Fetching summoner data")
	var result types.CurrentSummoner
	resp, err := s.conn.Client.R().SetResult(&result).
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

func (s *Client) getAssetsIds(assets []interface{}) ([]int, error) {
	var result []int

	s.logger.Debug("Processing assets", zap.Int("count", len(assets)))

	for _, asset := range assets {

		switch v := asset.(type) {
		case float64:
			result = append(result, int(v))
			continue
		case int:
			result = append(result, v)
			continue
		case int64:
			result = append(result, int(v))
			continue
		}

		if championMap, ok := asset.(map[string]interface{}); ok {
			if idVal, ok := championMap["id"]; ok {
				switch v := idVal.(type) {
				case float64:
					result = append(result, int(v))
				case int:
					result = append(result, v)
				case int64:
					result = append(result, int(v))
				case string:
					if id, err := strconv.Atoi(v); err == nil {
						result = append(result, id)
					}
				}
			} else if itemId, ok := championMap["itemId"].(float64); ok {
				result = append(result, int(itemId))
			}
		}
	}

	s.logger.Debug("Extracted IDs", zap.Int("count", len(result)), zap.Any("ids", result))
	return result, nil
}

type T struct {
	Sub         string   `json:"sub"`
	Tiers       struct{} `json:"tiers"`
	Containsf2P bool     `json:"containsf2P"`
	ShardId     string   `json:"shardId"`
	Exp         int      `json:"exp"`
	Iat         int      `json:"iat"`
	Items       struct {
		CHAMPION []int `json:"CHAMPION"`
	} `json:"items"`
}

func (s *Client) GetChampions() ([]int, error) {
	s.logger.Debug("Fetching owned champions")
	var encodedData string
	resp, err := s.conn.Client.R().SetResult(&encodedData).
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

	var payload types.ChampionJWT
	err = s.lcuJwt.Decode(encodedData, &payload)
	if err != nil {
		return nil, err
	}
	championsIds := payload.Items.CHAMPION

	return championsIds, nil
}

func (s *Client) GetSkins() ([]int, error) {
	s.logger.Debug("Fetching owned skins")
	var encodedData string
	resp, err := s.conn.Client.R().SetResult(&encodedData).
		Get("/lol-inventory/v1/signedInventory/simple?inventoryTypes=%5B%22CHAMPION_SKIN%22%5D")
	if err != nil {
		s.logger.Error("Error fetching skins data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get skins status: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	var payload types.SkinJWT
	err = s.lcuJwt.Decode(encodedData, &payload)
	if err != nil {
		return nil, err
	}

	skinsIds := payload.Items.SKIN

	return skinsIds, nil
}

func (s *Client) GetCurrency() (map[string]interface{}, error) {
	s.logger.Debug("Fetching account currency information")

	resp, err := s.conn.Client.R().
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

	s.logger.Info("Currency data retrieved")

	return result, nil
}

func (s *Client) GetRanking() (*types.RankedStatsRefresh, error) {
	s.logger.Info("Fetching ranking data")

	resp, err := s.conn.Client.R().
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

	var result types.RankedStatsRefresh
	if flexData, ok := queueMap["RANKED_FLEX_SR"].(map[string]interface{}); ok {
		// Marshal the map to JSON
		jsonData, err := json.Marshal(flexData)
		if err == nil {
			// Unmarshal JSON into RankedDetails structure
			var rankedDetails types.RankedDetails
			if err := json.Unmarshal(jsonData, &rankedDetails); err == nil {
				result.RankedFlexSR = rankedDetails
			} else {
				s.logger.Error("Failed to unmarshal flex data", zap.Error(err))
			}
		} else {
			s.logger.Error("Failed to marshal flex data", zap.Error(err))
		}
	}

	if soloData, ok := queueMap["RANKED_SOLO_5x5"].(map[string]interface{}); ok {
		// Marshal the map to JSON
		jsonData, err := json.Marshal(soloData)
		if err == nil {
			// Unmarshal JSON into RankedDetails structure
			var rankedDetails types.RankedDetails
			if err := json.Unmarshal(jsonData, &rankedDetails); err == nil {
				result.RankedSolo5x5 = rankedDetails
			} else {
				s.logger.Error("Failed to unmarshal solo data", zap.Error(err))
			}
		} else {
			s.logger.Error("Failed to marshal solo data", zap.Error(err))
		}
	}
	s.logger.Info("Ranking data retrieved")

	return &result, nil
}

func (s *Client) GetLolChat() (*types.FriendPresence, error) {
	s.logger.Debug("Fetching account region")
	var friendPresence types.FriendPresence
	resp, err := s.conn.Client.R().SetResult(&friendPresence).Get("/lol-chat/v1/me")
	if err != nil {
		s.logger.Error("Error fetching region data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get region status: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	var data map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &data); err != nil {
		return nil, err
	}

	s.logger.Debug("Service region retrieved", zap.String("region", friendPresence.PlatformId))
	return &friendPresence, nil
}

func (s *Client) GetUserInfo() (*types.UserInfo, error) {
	s.logger.Debug("Fetching account userinfo")
	var encodedUserinfoJWT types.UserinfoJWT
	resp, err := s.conn.Client.R().SetResult(&encodedUserinfoJWT).Get("/lol-rso-auth/v1/authorization/userinfo")
	if err != nil {
		s.logger.Error("Error fetching userinfo data", zap.Error(err))
		return nil, err
	}

	if resp.IsError() {
		errMsg := fmt.Sprintf("Failed to get userinfo status: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	var decodedUserinfo types.UserInfo
	err = s.lcuJwt.Decode(encodedUserinfoJWT.UserInfo, &decodedUserinfo)
	if err != nil {
		s.logger.Error("Error decoding userinfo data", zap.Error(err))
		return nil, err
	}
	return &decodedUserinfo, nil
}

func (s *Client) GetGameflowSession() (*types.LolGameflowV1Session, error) {
	s.logger.Debug("Fetching gameflow session")
	var lolGameflowSession types.LolGameflowV1Session
	resp, err := s.conn.Client.R().SetResult(&lolGameflowSession).Get("/lol-gameflow/v1/session")
	if err != nil {
		s.logger.Error("Error fetching gameflow data", zap.Error(err))
		return nil, err
	}

	// Special case for "No gameflow session exists" (404)
	if resp.StatusCode() == http.StatusNotFound {
		// Check if the error message matches the expected one
		var errorResp struct {
			ErrorCode string `json:"errorCode"`
			Message   string `json:"message"`
		}
		if err := json.Unmarshal(resp.Body(), &errorResp); err == nil {
			if errorResp.Message == "No gameflow session exists." {
				s.logger.Debug("No gameflow session exists, returning nil without error")
				return nil, errors.New(errorResp.Message)
			}
		}
	}

	if resp.IsError() {
		errMsg := fmt.Sprintf("Failed to get gameflow status: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	return &lolGameflowSession, nil
}

func (s *Client) GetCurrentSummonerProfile() (*types.CurrentSummonerProfile, error) {
	s.logger.Debug("Fetching current summoner profile")
	var currentSummonerProfile types.CurrentSummonerProfile
	resp, err := s.conn.Client.R().SetResult(&currentSummonerProfile).Get("/lol-summoner/v1/current-summoner/summoner-profile")
	if err != nil {
		s.logger.Error("Error fetching current summoner profile data", zap.Error(err))
		return nil, err
	}

	if resp.IsError() {
		errMsg := fmt.Sprintf("Failed to get current summoner profile status: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	return &currentSummonerProfile, nil
}
func (s *Client) GetChampionMastery() (*types.LocalPlayerChampionMastery, error) {
	s.logger.Debug("Fetching champion mastery")
	var championMastery types.LocalPlayerChampionMastery
	resp, err := s.conn.Client.R().SetResult(&championMastery).Get("/lol-summoner/v1/current-summoner/summoner-profile")
	if err != nil {
		s.logger.Error("Error fetching current champion mastery data", zap.Error(err))
		return nil, err
	}

	if resp.IsError() {
		errMsg := fmt.Sprintf("Failed to get champion mastery status: %d", resp.StatusCode())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	return &championMastery, nil
}
