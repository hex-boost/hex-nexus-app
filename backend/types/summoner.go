package types

import "encoding/json"

type SummonerRented struct {
	SummonerBase
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
	GameName string `json:"gamename,omitempty"`
}

type SummonerBase struct {
	ID              int         `json:"id,omitempty"`
	DocumentID      string      `json:"documentId,omitempty"`
	LCUchampions    interface{} `json:"LCUchampions,omitempty"`
	LCUskins        interface{} `json:"LCUskins,omitempty"`
	Type            string      `json:"type,omitempty"`
	LeaverBuster    interface{} `json:"leaverBuster,omitempty"`
	Tagline         string      `json:"tagline,omitempty"`
	Server          string      `json:"server,omitempty"`
	CreatedAt       string      `json:"createdAt,omitempty"`
	UpdatedAt       string      `json:"updatedAt,omitempty"`
	PublishedAt     string      `json:"publishedAt,omitempty"`
	Locale          interface{} `json:"locale,omitempty"`
	BlueEssence     int         `json:"blueEssence,omitempty"`
	RiotPoints      int         `json:"riotPoints,omitempty"`
	Ban             Ban         `json:"ban,omitempty"`
	IsPhoneVerified bool        `json:"isPhoneVerified,omitempty"`
	IsEmailVerified bool        `json:"isEmailVerified,omitempty"`
	Rankings        RankedStats `json:"rankedStats,omitempty"`
	User            User        `json:"user,omitempty"`
}

func (s *SummonerRented) MarshalJSON() ([]byte, error) {
	// Create an anonymous struct with only the fields you want
	return json.Marshal(struct {
		Username     string      `json:"username"`
		GameName     string      `json:"gamename"`
		Tagline      string      `json:"tagline"`
		LCUchampions interface{} `json:"champions"`
		LCUskins     interface{} `json:"championSkins"`
		Currencies   Currencies  `json:"currencies"`
		Rankings     RankedStats `json:"rankedStats"`
		Server       string      `json:"server"`
		Ban          Ban         `json:"ban"`
	}{
		Username:     s.Username,
		GameName:     s.GameName,
		Tagline:      s.Tagline,
		LCUchampions: s.LCUchampions,
		LCUskins:     s.LCUskins,
		Currencies: Currencies{
			RP:             s.RiotPoints,
			LolBlueEssence: s.BlueEssence,
		},
		Rankings: s.Rankings,
		Server:   s.Server,
		Ban:      s.Ban,
	})
}

// Ban represents the ban information for an account
type Ban struct {
	Restrictions []Restriction `json:"restrictions"`
}

// RestrictionData contains additional data related to a restriction
type RestrictionData struct {
	GameData GameData `json:"gameData"`
}

// GameData contains game-specific information in a restriction
type GameData struct {
	ProductName string `json:"productName"`
}

// AccountsResponse represents the full response containing account data
type AccountsResponse struct {
	Data []SummonerBase `json:"data"`
}
type RentedAccountsResponse struct {
	Data []SummonerRented `json:"data"`
}

type Currencies struct {
	RP             int `json:"RP"`
	LolBlueEssence int `json:"lol_blue_essence"`
}

type RankedStats struct {
	RankedFlexSR  map[string]interface{} `json:"RANKED_FLEX_SR"`
	RankedSolo5x5 map[string]interface{} `json:"RANKED_SOLO_5x5"`
}
