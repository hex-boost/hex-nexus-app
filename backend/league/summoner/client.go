package summoner

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/league/lcu"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"go.uber.org/zap"
	"net/http"
	"strconv"
)

type Client struct {
	conn   *lcu.Connection
	lcuJwt *lcu.JWT
	logger *logger.Logger
	ctx    context.Context
}

func NewClient(logger *logger.Logger, conn *lcu.Connection) *Client {
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
	Sub   string `json:"sub"`
	Tiers struct {
	} `json:"tiers"`
	Containsf2P bool   `json:"containsf2P"`
	ShardId     string `json:"shardId"`
	Exp         int    `json:"exp"`
	Iat         int    `json:"iat"`
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

	s.logger.Info("Successfully retrieved champions", zap.Int("count", len(championsIds)))
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

	s.logger.Info("Successfully retrieved skins", zap.Int("count", len(skinsIds)))
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

	s.logger.Info("Currency data retrieved",
		zap.Any("RP", result["RP"]),
		zap.Any("BE", result["lol_blue_essence"]))

	return result, nil
}

func (s *Client) GetRanking() (*types.RankedStats, error) {
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

	var result types.RankedStats
	if flexData, ok := queueMap["RANKED_FLEX_SR"].(map[string]interface{}); ok {
		result.RankedFlexSR = flexData
	}

	if soloData, ok := queueMap["RANKED_SOLO_5x5"].(map[string]interface{}); ok {
		result.RankedSolo5x5 = soloData
	}
	s.logger.Info("Ranking data retrieved")
	s.logger.Debug("Ranking details",
		zap.Any("FLEX", result.RankedFlexSR),
		zap.Any("SOLO", result.RankedSolo5x5))

	return &result, nil
}

func (s *Client) GetLolChat() (*types.FriendPresence, error) {
	s.logger.Debug("Fetching account region")
	var friendPresence types.FriendPresence
	resp, err := s.conn.Client.R().SetResult(friendPresence).Get("/lol-chat/v1/me")

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

	if resp.StatusCode() != http.StatusOK {
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
