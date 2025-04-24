package types

// RankedDetails represents a ranked queue's stats
type RankedDetails struct {
	Division                      string      `json:"division"`
	Rank                          string      `json:"rank"`
	HighestDivision               string      `json:"highestDivision"`
	HighestTier                   string      `json:"highestTier"`
	IsProvisional                 bool        `json:"isProvisional"`
	LeaguePoints                  int         `json:"leaguePoints"`
	Losses                        int         `json:"losses"`
	MiniSeriesProgress            string      `json:"miniSeriesProgress"`
	PreviousSeasonEndDivision     string      `json:"previousSeasonEndDivision"`
	PreviousSeasonEndTier         string      `json:"previousSeasonEndTier"`
	PreviousSeasonEndRank         string      `json:"previousSeasonEndRank"`
	PreviousSeasonHighestDivision string      `json:"previousSeasonHighestDivision"`
	PreviousSeasonHighestTier     string      `json:"previousSeasonHighestTier"`
	PreviousSeasonHighest         string      `json:"previousSeasonHighest,omitempty"`
	ProvisionalGameThreshold      int         `json:"provisionalGameThreshold"`
	ProvisionalGamesRemaining     int         `json:"provisionalGamesRemaining"`
	QueueType                     string      `json:"queueType"`
	RatedRating                   int         `json:"ratedRating"`
	RatedTier                     string      `json:"ratedTier"`
	Tier                          string      `json:"tier"`
	Warnings                      interface{} `json:"warnings"`
	Wins                          int         `json:"wins"`
	CumulativeLp                  int         `json:"cumulativeLp,omitempty"`
	PreviousSeasonAchievedTier    string      `json:"previousSeasonAchievedTier,omitempty"`
	PreviousSeasonAchievedRank    string      `json:"previousSeasonAchievedRank,omitempty"`
	PremadeMmrRestricted          bool        `json:"premadeMmrRestricted,omitempty"`
}

// RankedStats represents all ranked queue stats
type RankedStatsRefresh struct {
	RankedFlexSR  RankedDetails `json:"RANKED_FLEX_SR"`
	RankedSolo5x5 RankedDetails `json:"RANKED_SOLO_5x5"`
}

// Currencies represents the currency values for an account
type CurrenciesRefresh struct {
	RP             int `json:"RP"`
	LolBlueEssence int `json:"lol_blue_essence"`
}

// RefreshAccount represents the full account data structure expected by the frontend
type RefreshAccount struct {
	IsPhoneVerified bool        `json:"isPhoneVerified"`
	IsEmailVerified bool        `json:"isEmailVerified"`
	LeaverBuster    interface{} `json:"leaverBuster"`
	Username        string      `json:"username"`
	Password        string      `json:"password"`
	GameName        string      `json:"gamename"`
	Error           string      `json:"error,omitempty"` // Can be "wrong_details", "multifactor", "eula", "unknown"
	Tagline         string      `json:"tagline"`
	Type            string      `json:"type,omitempty"`
	Champions       []int       `json:"champions"`
	ChampionSkins   []int       `json:"championSkins"`
	Currencies      Currencies  `json:"currencies"`
	Ban             interface{} `json:"ban"`
	RankedStats     RankedStats `json:"rankedStats"`
	Server          string      `json:"server"`
	AccountLevel    int         `json:"accountLevel"`
}

// Update SummonerBase to align with RefreshAccount structure
type SummonerBaseRefresh struct {
	Tagline         string      `json:"tagline"`
	LCUchampions    []int       `json:"champions"`        // Renamed to match frontend expectation
	LCUskins        []int       `json:"championSkins"`    // Renamed to match frontend expectation
	BlueEssence     int         `json:"lol_blue_essence"` // Will be mapped to currencies
	RiotPoints      int         `json:"RP"`               // Will be mapped to currencies
	Rankings        RankedStats `json:"rankedStats"`      // Renamed from Rankings
	Server          string      `json:"server"`
	AccountLevel    int         `json:"accountLevel"`
	IsPhoneVerified bool        `json:"isPhoneVerified"`
	IsEmailVerified bool        `json:"isEmailVerified"`
	RefundAmount    int         `json:"refundAmount"`
	LeaverBuster    interface{} `json:"leaverBuster"`
	Ban             interface{} `json:"ban"`
}

// SummonerRented keeps compatibility with existing code while adapting to new structure
type SummonerRentedRefresh struct {
	Username     string       `json:"username"`
	Password     string       `json:"password,omitempty"`
	SummonerBase SummonerBase `json:"-"` // Embedded but not directly serialized
	GameName     string       `json:"gamename"`
	Error        string       `json:"error,omitempty"`
	Type         string       `json:"type,omitempty"`
}

// ToRefreshAccount converts a SummonerRented to a RefreshAccount
func (s *SummonerRented) ToRefreshAccount() RefreshAccount {
	// Initialize champions and skins slices
	var champions []int
	var skins []int

	// Handle the case where LCUchampions is already a []int
	if champArr, ok := s.SummonerBase.LCUchampions.([]int); ok {
		champions = champArr
	} else if champArr, ok := s.SummonerBase.LCUchampions.([]interface{}); ok {
		// Handle the case where LCUchampions is a []interface{}
		for _, champ := range champArr {
			if champID, ok := champ.(float64); ok {
				champions = append(champions, int(champID))
			} else if champID, ok := champ.(int); ok {
				champions = append(champions, champID)
			}
		}
	}

	// Handle the case where LCUskins is already a []int
	if skinArr, ok := s.SummonerBase.LCUskins.([]int); ok {
		skins = skinArr
	} else if skinArr, ok := s.SummonerBase.LCUskins.([]interface{}); ok {
		// Handle the case where LCUskins is a []interface{}
		for _, skin := range skinArr {
			if skinID, ok := skin.(float64); ok {
				skins = append(skins, int(skinID))
			} else if skinID, ok := skin.(int); ok {
				skins = append(skins, skinID)
			}
		}
	}

	return RefreshAccount{
		IsPhoneVerified: s.SummonerBase.IsPhoneVerified,
		IsEmailVerified: s.SummonerBase.IsEmailVerified,
		LeaverBuster:    s.SummonerBase.LeaverBuster,
		Username:        s.Username,
		Password:        s.Password,
		GameName:        s.GameName,
		Tagline:         s.SummonerBase.Tagline,
		Type:            s.Type,
		Champions:       champions,
		ChampionSkins:   skins,
		Currencies: Currencies{
			RP:             s.SummonerBase.RiotPoints,
			LolBlueEssence: s.SummonerBase.BlueEssence,
		},
		Ban:         s.SummonerBase.Ban,
		RankedStats: s.SummonerBase.Rankings,
		Server:      s.SummonerBase.Server,
	}
}
