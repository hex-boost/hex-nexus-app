package types

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
	Server          interface{} `json:"server,omitempty"`
	CreatedAt       string      `json:"createdAt,omitempty"`
	UpdatedAt       string      `json:"updatedAt,omitempty"`
	PublishedAt     string      `json:"publishedAt,omitempty"`
	Locale          interface{} `json:"locale,omitempty"`
	BlueEssence     interface{} `json:"blueEssence,omitempty"`
	RiotPoints      interface{} `json:"riotPoints,omitempty"`
	Ban             Ban         `json:"ban,omitempty"`
	IsPhoneVerified bool        `json:"isPhoneVerified,omitempty"`
	IsEmailVerified bool        `json:"isEmailVerified,omitempty"`
	Rankings        RankedStats `json:"rankings,omitempty"`
	User            User        `json:"user,omitempty"`
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
