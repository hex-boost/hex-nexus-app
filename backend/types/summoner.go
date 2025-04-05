package types

type SummonerRented struct {
	SummonerBase
	Username string `json:"username"`
	Password string `json:"password,omitempty"`
	GameName string `json:"gamename"`
}
type SummonerBase struct {
	ID              int           `json:"id"`
	DocumentID      string        `json:"documentId"`
	LCUchampions    interface{}   `json:"LCUchampions"`
	LCUskins        interface{}   `json:"LCUskins"`
	Type            string        `json:"type"`
	LeaverBuster    interface{}   `json:"leaverBuster"`
	Tagline         string        `json:"tagline"`
	Server          interface{}   `json:"server"`
	CreatedAt       string        `json:"createdAt"`
	UpdatedAt       string        `json:"updatedAt"`
	PublishedAt     string        `json:"publishedAt"`
	Locale          interface{}   `json:"locale"`
	BlueEssence     interface{}   `json:"blueEssence"`
	RiotPoints      interface{}   `json:"riotPoints"`
	Ban             Ban           `json:"ban"`
	IsPhoneVerified bool          `json:"isPhoneVerified"`
	IsEmailVerified bool          `json:"isEmailVerified"`
	Rankings        []interface{} `json:"rankings"`
	User            User          `json:"user"`
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
