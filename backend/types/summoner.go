package types

type Summoner struct {
	Username      string      `json:"username"`
	Password      string      `json:"password"`
	Gamename      string      `json:"gamename"`
	Tagline       string      `json:"tagline"`
	Champions     []int       `json:"champions"`
	ChampionSkins []int       `json:"championSkins"`
	Currencies    Currencies  `json:"currencies"`
	RankedStats   RankedStats `json:"rankedStats"`
	Server        string      `json:"server"`
	AccountLevel  int         `json:"accountLevel"`
}

type Currencies struct {
	RP             int `json:"RP"`
	LolBlueEssence int `json:"lol_blue_essence"`
}

type RankedStats struct {
	RankedFlexSR  map[string]interface{} `json:"RANKED_FLEX_SR"`
	RankedSolo5x5 map[string]interface{} `json:"RANKED_SOLO_5x5"`
}
