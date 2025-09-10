package summoner

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
	"net/http"
	"strconv"
	"strings"

	"github.com/hex-boost/hex-nexus-app/backend/internal/league/lcu"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"go.uber.org/zap"
)

type Client struct {
	conn   *lcu.Connection
	lcuJwt *lcu.JWT // Assuming lcu.JWT and its Decode method are thread-safe or s.lcuJwt is immutable after setup
	logger *logger.Logger
	ctx    context.Context
}

func NewClient(logger *logger.Logger, conn *lcu.Connection) *Client {
	// If lcuJwt needs to be initialized, it should be done here or set via another method.
	// For now, assuming it's handled elsewhere or its methods are safe with a nil receiver if applicable.
	return &Client{
		conn:   conn,
		logger: logger,
		lcuJwt: lcu.NewJWT(),
		ctx:    context.Background(),
	}
}

func (s *Client) GetLoginSession() (*types.LoginSession, error) {
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Warn("Failed to get LCU client for GetLoginSession", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetLoginSession: %w", err)
	}

	var result types.LoginSession
	resp, err := lcuClient.R().SetResult(&result).
		Get("/lol-login/v1/session")
	if err != nil {
		s.logger.Debug("Error fetching login session data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get login session data: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}
	return &result, nil
}

func (s *Client) GetLolLobbySession() (*types.LolLobbyTeamBuilderSession, error) {
	s.logger.Debug("Fetching summoner data")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Warn("Failed to get LCU client for GetLolLobbySession", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetLolLobbySession: %w", err)
	}

	var result types.LolLobbyTeamBuilderSession
	resp, err := lcuClient.R().SetResult(&result).
		Get("/lol-lobby-team-builder/champ-select/v1/session")
	if err != nil {
		s.logger.Warn("Error fetching GetLolLobbySession data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get GetLolLobbySession: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	s.logger.Info("Successfully retrieved GetLolLobbySession")

	return &result, nil
}
func (s *Client) GetCurrentSummoner() (*types.CurrentSummoner, error) {
	s.logger.Debug("Fetching summoner data")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Warn("Failed to get LCU client for GetCurrentSummoner", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetCurrentSummoner: %w", err)
	}

	var result types.CurrentSummoner
	resp, err := lcuClient.R().SetResult(&result).
		Get("/lol-summoner/v1/current-summoner")
	if err != nil {
		s.logger.Warn("Error fetching summoner data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get summoner data: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	s.logger.Info("Successfully retrieved summoner data",
		zap.String("gameName", fmt.Sprintf("%v", result.GameName)),
		zap.String("tagLine", fmt.Sprintf("%v", result.TagLine)))

	return &result, nil
}

// getAssetsIds is an internal helper and does not make network calls, so it doesn't need client access.
func (s *Client) getAssetsIds(assets []interface{}) ([]int, error) {
	var result []int

	s.logger.Debug("Processing assets", zap.Int("count", len(assets)))

	for _, asset := range assets {
		switch v := asset.(type) {
		case float64:
			result = append(result, int(v))
		case int:
			result = append(result, v)
		case int64:
			result = append(result, int(v))
		case string: // Added string case for robustness, though original didn't have it at top level
			if id, err := strconv.Atoi(v); err == nil {
				result = append(result, id)
			}
		default:
			if championMap, ok := asset.(map[string]interface{}); ok {
				if idVal, idOk := championMap["id"]; idOk {
					switch vID := idVal.(type) {
					case float64:
						result = append(result, int(vID))
					case int:
						result = append(result, vID)
					case int64:
						result = append(result, int(vID))
					case string:
						if id, err := strconv.Atoi(vID); err == nil {
							result = append(result, id)
						}
					}
				} else if itemIdVal, itemIdOk := championMap["itemId"]; itemIdOk { // Check itemId as well
					switch vItemID := itemIdVal.(type) {
					case float64:
						result = append(result, int(vItemID))
					case int:
						result = append(result, vItemID)
					case int64:
						result = append(result, int(vItemID))
					case string:
						if id, err := strconv.Atoi(vItemID); err == nil {
							result = append(result, id)
						}
					}
				}
			}
		}
	}

	s.logger.Debug("Extracted IDs", zap.Int("count", len(result)), zap.Any("ids", result))
	return result, nil
}

// T struct seems to be related to JWT payload, defined here for context if needed by lcuJwt.Decode
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
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Error("Failed to get LCU client for GetChampions", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetChampions: %w", err)
	}

	var encodedData string                              // Expecting JWT string
	resp, err := lcuClient.R().SetResult(&encodedData). // SetResult to capture the raw string
								Get("/lol-inventory/v1/signedInventory/simple?inventoryTypes=%5B%22CHAMPION%22%5D")
	if err != nil {
		s.logger.Error("Error fetching champion data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get champions status: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	if s.lcuJwt == nil {
		s.logger.Error("lcuJwt is not initialized in summoner.Client")
		return nil, errors.New("lcuJwt service not available")
	}

	var payload types.ChampionJWT
	err = s.lcuJwt.Decode(encodedData, &payload) // Assuming encodedData is the JWT string from response body
	if err != nil {
		s.logger.Error("Error decoding champion JWT data", zap.Error(err))
		return nil, fmt.Errorf("failed to decode champion data: %w", err)
	}
	championsIds := payload.Items.CHAMPION

	return championsIds, nil
}

func (s *Client) GetSkins() ([]int, error) {
	s.logger.Debug("Fetching owned skins")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Error("Failed to get LCU client for GetSkins", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetSkins: %w", err)
	}

	var encodedData string // Expecting JWT string
	resp, err := lcuClient.R().SetResult(&encodedData).
		Get("/lol-inventory/v1/signedInventory/simple?inventoryTypes=%5B%22CHAMPION_SKIN%22%5D")
	if err != nil {
		s.logger.Error("Error fetching skins data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get skins status: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	if s.lcuJwt == nil {
		s.logger.Error("lcuJwt is not initialized in summoner.Client")
		return nil, errors.New("lcuJwt service not available")
	}

	var payload types.SkinJWT
	err = s.lcuJwt.Decode(encodedData, &payload)
	if err != nil {
		s.logger.Error("Error decoding skin JWT data", zap.Error(err))
		return nil, fmt.Errorf("failed to decode skin data: %w", err)
	}

	skinsIds := payload.Items.SKIN

	return skinsIds, nil
}

func (s *Client) GetCurrency() (map[string]interface{}, error) {
	s.logger.Debug("Fetching account currency information")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Error("Failed to get LCU client for GetCurrency", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetCurrency: %w", err)
	}

	resp, err := lcuClient.R().
		Get("/lol-inventory/v1/wallet?currencyTypes=%5B%22EA%22%5D")
	if err != nil {
		s.logger.Error("Error fetching currency data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get wallet status: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		s.logger.Error("Error unmarshalling currency data", zap.Error(err))
		return nil, fmt.Errorf("failed to unmarshal currency data: %w", err)
	}

	s.logger.Info("Currency data retrieved")
	return result, nil
}

func (s *Client) GetRanking() (*types.RankedStatsRefresh, error) {
	s.logger.Info("Fetching ranking data")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Warn("Failed to get LCU client for GetRanking", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetRanking: %w", err)
	}

	resp, err := lcuClient.R().
		Get("/lol-ranked/v1/current-ranked-stats")
	if err != nil {
		s.logger.Error("Error fetching ranking data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get ranking status: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	var data map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &data); err != nil {
		s.logger.Error("Error unmarshalling ranking data", zap.Error(err))
		return nil, fmt.Errorf("failed to unmarshal ranking data: %w", err)
	}

	queueMap, ok := data["queueMap"].(map[string]interface{})
	if !ok {
		return nil, errors.New("could not parse queue map from ranking data")
	}

	var result types.RankedStatsRefresh
	if flexData, ok := queueMap["RANKED_FLEX_SR"].(map[string]interface{}); ok {
		jsonData, err := json.Marshal(flexData)
		if err == nil {
			var rankedDetails types.RankedDetails
			if err := json.Unmarshal(jsonData, &rankedDetails); err == nil {
				result.RankedFlexSR = rankedDetails
			} else {
				s.logger.Error("Failed to unmarshal flex data into RankedDetails", zap.Error(err))
			}
		} else {
			s.logger.Error("Failed to marshal flex data", zap.Error(err))
		}
	}

	if soloData, ok := queueMap["RANKED_SOLO_5x5"].(map[string]interface{}); ok {
		jsonData, err := json.Marshal(soloData)
		if err == nil {
			var rankedDetails types.RankedDetails
			if err := json.Unmarshal(jsonData, &rankedDetails); err == nil {
				result.RankedSolo5x5 = rankedDetails
			} else {
				s.logger.Error("Failed to unmarshal solo data into RankedDetails", zap.Error(err))
			}
		} else {
			s.logger.Error("Failed to marshal solo data", zap.Error(err))
		}
	}
	s.logger.Info("Ranking data retrieved")
	return &result, nil
}

func (s *Client) GetLolChat() (*types.FriendPresence, error) {
	s.logger.Debug("Fetching account region (via lol-chat)")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Warn("Failed to get LCU client for GetLolChat", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetLolChat: %w", err)
	}

	var friendPresence types.FriendPresence
	resp, err := lcuClient.R().SetResult(&friendPresence).Get("/lol-chat/v1/me")
	if err != nil {
		s.logger.Warn("Error fetching lol-chat data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		errMsg := fmt.Sprintf("Failed to get lol-chat status: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	// The response is directly unmarshalled into friendPresence by SetResult.
	// If you need to access raw data, you'd unmarshal resp.Body() as in other methods.
	s.logger.Debug("Lol-chat data retrieved", zap.String("platformId", friendPresence.PlatformId))
	return &friendPresence, nil
}

func (s *Client) GetUserInfo() (*types.UserInfo, error) {
	s.logger.Debug("Fetching account userinfo")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Error("Failed to get LCU client for GetUserInfo", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetUserInfo: %w", err)
	}

	var encodedUserinfoJWT types.UserinfoJWT // Assuming this struct has a field like `UserInfo string` for the JWT
	resp, err := lcuClient.R().SetResult(&encodedUserinfoJWT).Get("/lol-rso-auth/v1/authorization/userinfo")
	if err != nil {
		s.logger.Error("Error fetching userinfo data", zap.Error(err))
		return nil, err
	}

	if resp.IsError() {
		errMsg := fmt.Sprintf("Failed to get userinfo status: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	if s.lcuJwt == nil {
		s.logger.Error("lcuJwt is not initialized in summoner.Client")
		return nil, errors.New("lcuJwt service not available for decoding userinfo")
	}

	var decodedUserinfo types.UserInfo
	// Assuming encodedUserinfoJWT.UserInfo holds the actual JWT string.
	// Adjust if the structure of types.UserinfoJWT is different.
	jwtString := encodedUserinfoJWT.UserInfo // This field name is an assumption based on the original code.
	if jwtString == "" {
		s.logger.Error("Encoded userinfo JWT string is empty in response", zap.Any("responseObject", encodedUserinfoJWT))
		return nil, errors.New("received empty userinfo JWT string")
	}

	err = s.lcuJwt.Decode(jwtString, &decodedUserinfo)
	if err != nil {
		s.logger.Error("Error decoding userinfo data", zap.Error(err))
		return nil, fmt.Errorf("failed to decode userinfo: %w", err)
	}
	return &decodedUserinfo, nil
}

func (s *Client) GetPartyRestrictions() (*types.PartyRestriction, error) {
	s.logger.Debug("Fetching party restriction")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Error("Failed to get LCU client for GetPartyRestrictions", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetPartyRestrictions: %w", err)
	}

	var partyRestriction types.PartyRestriction
	resp, err := lcuClient.R().SetResult(&partyRestriction).Get("/lol-leaver-buster/v1/ranked-restriction")
	if err != nil {
		s.logger.Error("Error fetching ranked restriction data", zap.Error(err))
		return nil, err
	}

	if resp.IsError() {
		errMsg := fmt.Sprintf("Failed to get gameflow status: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	return &partyRestriction, nil
}
func (s *Client) GetGameflowSession() (*types.LolGameflowV1Session, error) {
	s.logger.Debug("Fetching gameflow session")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Warn("Failed to get LCU client for GetGameflowSession", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetGameflowSession: %w", err)
	}

	var lolGameflowSession types.LolGameflowV1Session
	resp, err := lcuClient.R().SetResult(&lolGameflowSession).Get("/lol-gameflow/v1/session")
	if err != nil {
		s.logger.Warn("Error fetching gameflow data", zap.Error(err))
		return nil, err
	}

	if resp.StatusCode() == http.StatusNotFound {
		var errorResp struct {
			ErrorCode string `json:"errorCode"`
			Message   string `json:"message"`
		}
		if unmarshalErr := json.Unmarshal(resp.Body(), &errorResp); unmarshalErr == nil {
			if errorResp.Message == "No gameflow session exists." {
				s.logger.Debug("No gameflow session exists, returning specific error")
				return nil, errors.New(errorResp.Message) // Return the specific error message
			}
		}
		// If unmarshalling fails or message doesn't match, fall through to generic error handling
	}

	if resp.IsError() { // Covers 404 if not handled above, and other errors
		errMsg := fmt.Sprintf("Failed to get gameflow status: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	return &lolGameflowSession, nil
}

func (s *Client) GetLeaverBuster(currentPlatformId string) (*types.LeaverBusterResponse, error) {
	s.logger.Debug("Fetching current leaver buster")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Error("Failed to get LCU client for leaver buster", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for leaver buster: %w", err)
	}

	var leaverBusterToken string
	resp, err := lcuClient.R().SetResult(&leaverBusterToken).Get("/lol-league-session/v1/league-session-token")
	if err != nil {
		s.logger.Error("Error fetching current leaver buster data", zap.Error(err))
		return nil, err
	}

	if resp.IsError() {
		errMsg := fmt.Sprintf("Failed to get current leaver buster status: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}
	platformIdUpper := strings.ToUpper(currentPlatformId)
	leagueEdgeURL, ok := types.LeagueEdgeURL[platformIdUpper]
	if !ok {
		errMsg := fmt.Sprintf("league edge URL not found for platform ID: %s", currentPlatformId)
		s.logger.Error(errMsg)
		return nil, errors.New(errMsg)
	}
	leaverBusterUrl := fmt.Sprintf("%s/leaverbuster-ledge/restrictionInfo", leagueEdgeURL)

	var leaverBuster types.LeaverBusterResponse
	riotGamesClient := resty.New()
	leaverBusterResp, err := riotGamesClient.R().
		SetResult(&leaverBuster).
		SetAuthScheme("Bearer").
		SetAuthToken(leaverBusterToken).
		Get(leaverBusterUrl)

	if err != nil {
		s.logger.Error("Error fetching current leaver buster data", zap.Error(err))
		return nil, err
	}

	if leaverBusterResp.IsError() {
		errMsg := fmt.Sprintf("Failed to get current leaver buster status: %d, body: %s",
			leaverBusterResp.StatusCode(), leaverBusterResp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	return &leaverBuster, nil
}
func (s *Client) GetCurrentSummonerProfile() (*types.CurrentSummonerProfile, error) {
	s.logger.Debug("Fetching current summoner profile")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Error("Failed to get LCU client for GetCurrentSummonerProfile", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetCurrentSummonerProfile: %w", err)
	}

	var currentSummonerProfile types.CurrentSummonerProfile
	resp, err := lcuClient.R().SetResult(&currentSummonerProfile).Get("/lol-summoner/v1/current-summoner/summoner-profile")
	if err != nil {
		s.logger.Error("Error fetching current summoner profile data", zap.Error(err))
		return nil, err
	}

	if resp.IsError() {
		errMsg := fmt.Sprintf("Failed to get current summoner profile status: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	return &currentSummonerProfile, nil
}

func (s *Client) GetChampionMastery() (*[]types.LocalPlayerChampionMastery, error) {
	s.logger.Debug("Fetching champion mastery")
	lcuClient, err := s.conn.GetClient()
	if err != nil {
		s.logger.Error("Failed to get LCU client for GetChampionMastery", zap.Error(err))
		return nil, fmt.Errorf("LCU client unavailable for GetChampionMastery: %w", err)
	}

	var championMastery []types.LocalPlayerChampionMastery
	// Corrected to use lcuClient obtained from s.conn.GetClient()
	resp, err := lcuClient.R().SetResult(&championMastery).Get("/lol-champion-mastery/v1/local-player/champion-mastery")
	if err != nil {
		s.logger.Error("Error fetching current champion mastery data", zap.Error(err))
		return nil, err
	}

	if resp.IsError() {
		errMsg := fmt.Sprintf("Failed to get champion mastery status: %d, body: %s", resp.StatusCode(), resp.String())
		s.logger.Warn(errMsg)
		return nil, errors.New(errMsg)
	}

	return &championMastery, nil
}
