package types

// Currency represents LoL and TFT account currencies
type Currency struct {
	RP                   int `json:"RP"`
	LolBlueEssence       int `json:"lol_blue_essence"`
	LolClashTickets      int `json:"lol_clash_tickets"`
	LolMsi22PremiumToken int `json:"lol_msi22_premium_token"`
	LolMythicEssence     int `json:"lol_mythic_essence"`
	LolOrangeEssence     int `json:"lol_orange_essence"`
	TftStandardCoin      int `json:"tft_standard_coin"`
	TftStarFragments     int `json:"tft_star_fragments"`
}

// RerollPoints represents ARAM/event game mode reroll points
type RerollPoints struct {
	CurrentPoints    int `json:"currentPoints"`
	MaxRolls         int `json:"maxRolls"`
	NumberOfRolls    int `json:"numberOfRolls"`
	PointsCostToRoll int `json:"pointsCostToRoll"`
	PointsToReroll   int `json:"pointsToReroll"`
}

// Privacy type for summoner privacy setting
type Privacy string

const (
	PrivacyPublic  Privacy = "PUBLIC"
	PrivacyPrivate Privacy = "PRIVATE"
)

// CurrentSummoner represents LoL summoner profile data
type CurrentSummoner struct {
	AccountId                   int          `json:"accountId"`
	DisplayName                 string       `json:"displayName"`
	GameName                    string       `json:"gameName"`
	InternalName                string       `json:"internalName"`
	NameChangeFlag              bool         `json:"nameChangeFlag"`
	PercentCompleteForNextLevel int          `json:"percentCompleteForNextLevel"`
	Privacy                     Privacy      `json:"privacy"`
	ProfileIconId               int          `json:"profileIconId"`
	Puuid                       string       `json:"puuid"`
	RerollPoints                RerollPoints `json:"rerollPoints"`
	SummonerId                  int          `json:"summonerId"`
	SummonerLevel               int          `json:"summonerLevel"`
	TagLine                     string       `json:"tagLine"`
	Unnamed                     bool         `json:"unnamed"`
	XpSinceLastLevel            int          `json:"xpSinceLastLevel"`
	XpUntilNextLevel            int          `json:"xpUntilNextLevel"`
}

// LoginSession represents LoL account session data
type LoginSession struct {
	AccountId      int     `json:"accountId"`
	Connected      bool    `json:"connected"`
	Error          *string `json:"error,omitempty"`
	IdToken        string  `json:"idToken"`
	IsInLoginQueue bool    `json:"isInLoginQueue"`
	IsNewPlayer    bool    `json:"isNewPlayer"`
	Puuid          string  `json:"puuid"`
	State          string  `json:"state"`
	SummonerId     int     `json:"summonerId"`
	UserAuthToken  string  `json:"userAuthToken"`
	Username       string  `json:"username"`
}

// AccountInfo represents basic LoL account information
type AccountInfo struct {
	Puuid      string `json:"puuid"`
	AccountId  int    `json:"accountId"`
	Username   string `json:"username"`
	SummonerId int    `json:"summonerId"`
}

// LoginState represents LoL login state
type LoginState struct {
	Connected      bool    `json:"connected"`
	State          string  `json:"state"`
	IsInLoginQueue bool    `json:"isInLoginQueue"`
	Error          *string `json:"error,omitempty"`
}

// RentalInfo represents champion rental information
type RentalInfo struct {
	EndDate           int  `json:"endDate"`
	PurchaseDate      int  `json:"purchaseDate"`
	Rented            bool `json:"rented"`
	WinCountRemaining int  `json:"winCountRemaining"`
}

// OwnershipInfo represents champion ownership information
type OwnershipInfo struct {
	LoyaltyReward bool       `json:"loyaltyReward"`
	Owned         bool       `json:"owned"`
	Rental        RentalInfo `json:"rental"`
	XboxGPReward  bool       `json:"xboxGPReward"`
}

// InventoryAsset represents LoL champion data
type InventoryAsset struct {
	Active             bool          `json:"active"`
	Alias              string        `json:"alias"`
	BanVoPath          string        `json:"banVoPath"`
	BaseLoadScreenPath string        `json:"baseLoadScreenPath"`
	BaseSplashPath     string        `json:"baseSplashPath"`
	BotEnabled         bool          `json:"botEnabled"`
	ChooseVoPath       string        `json:"chooseVoPath"`
	DisabledQueues     []string      `json:"disabledQueues"`
	FreeToPlay         bool          `json:"freeToPlay"`
	Id                 int           `json:"id"`
	Name               string        `json:"name"`
	Ownership          OwnershipInfo `json:"ownership"`
	Purchased          int           `json:"purchased"`
	RankedPlayEnabled  bool          `json:"rankedPlayEnabled"`
	Roles              []string      `json:"roles"`
	SquarePortraitPath string        `json:"squarePortraitPath"`
	StingerSfxPath     string        `json:"stingerSfxPath"`
	Title              string        `json:"title"`
}

// Season represents ranked season information
type Season struct {
	CurrentSeasonEnd int `json:"currentSeasonEnd"`
	CurrentSeasonId  int `json:"currentSeasonId"`
	NextSeasonStart  int `json:"nextSeasonStart"`
}

// QueueType represents the ranked queue types
type QueueType string

const (
	QueueTypeTFT         QueueType = "RANKED_TFT"
	QueueTypeSolo        QueueType = "RANKED_SOLO_5x5"
	QueueTypeFlex        QueueType = "RANKED_FLEX_SR"
	QueueTypeTFTTurbo    QueueType = "RANKED_TFT_TURBO"
	QueueTypeTFTDoubleUp QueueType = "RANKED_TFT_DOUBLE_UP"
)

// RankedEntry represents player's ranked stats in a specific queue
type RankedEntry struct {
	Division                      string    `json:"division"`
	HighestDivision               string    `json:"highestDivision"`
	HighestTier                   string    `json:"highestTier"`
	IsProvisional                 bool      `json:"isProvisional"`
	LeaguePoints                  int       `json:"leaguePoints"`
	Losses                        int       `json:"losses"`
	MiniSeriesProgress            string    `json:"miniSeriesProgress"`
	PreviousSeasonEndDivision     string    `json:"previousSeasonEndDivision"`
	PreviousSeasonEndTier         string    `json:"previousSeasonEndTier"`
	PreviousSeasonHighestDivision string    `json:"previousSeasonHighestDivision"`
	PreviousSeasonHighestTier     string    `json:"previousSeasonHighestTier"`
	ProvisionalGameThreshold      int       `json:"provisionalGameThreshold"`
	ProvisionalGamesRemaining     int       `json:"provisionalGamesRemaining"`
	QueueType                     QueueType `json:"queueType"`
	RatedRating                   int       `json:"ratedRating"`
	RatedTier                     string    `json:"ratedTier"`
	Tier                          string    `json:"tier"`
	Warnings                      *string   `json:"warnings,omitempty"`
	Wins                          int       `json:"wins"`
}

// QueueMap represents queue mapping containing all ranked queues
type QueueMap struct {
	RankedFlexSR      RankedEntry `json:"RANKED_FLEX_SR"`
	RankedSolo5x5     RankedEntry `json:"RANKED_SOLO_5x5"`
	RankedTFT         RankedEntry `json:"RANKED_TFT"`
	RankedTFTDoubleUp RankedEntry `json:"RANKED_TFT_DOUBLE_UP"`
	RankedTFTTurbo    RankedEntry `json:"RANKED_TFT_TURBO"`
}

// GameStatus represents player's game status
type GameStatus string

const (
	GameStatusInGame      GameStatus = "inGame"
	GameStatusOutOfGame   GameStatus = "outOfGame"
	GameStatusChampSelect GameStatus = "champSelect"
	GameStatusSpectating  GameStatus = "spectating"
)

// PresenceData represents LoL specific presence data
type PresenceData struct {
	ChampionId               string     `json:"championId"`
	CompanionId              string     `json:"companionId"`
	DamageSkinId             string     `json:"damageSkinId"`
	GameQueueType            string     `json:"gameQueueType"`
	GameStatus               GameStatus `json:"gameStatus"`
	IconOverride             string     `json:"iconOverride"`
	InitSummoner             string     `json:"initSummoner"`
	LegendaryMasteryScore    string     `json:"legendaryMasteryScore"`
	Level                    string     `json:"level"`
	MapId                    string     `json:"mapId"`
	MapSkinId                string     `json:"mapSkinId"`
	Puuid                    string     `json:"puuid"`
	RankedPrevSeasonDivision string     `json:"rankedPrevSeasonDivision"`
	RankedPrevSeasonTier     string     `json:"rankedPrevSeasonTier"`
	Regalia                  string     `json:"regalia"`
	SkinVariant              string     `json:"skinVariant"`
	Skinname                 string     `json:"skinname"`
}

// Availability represents friend availability status
type Availability string

const (
	AvailabilityChat    Availability = "chat"
	AvailabilityAway    Availability = "away"
	AvailabilityDnd     Availability = "dnd"
	AvailabilityMobile  Availability = "mobile"
	AvailabilityOffline Availability = "offline"
	AvailabilityOnline  Availability = "online"
)

// FriendPresence represents a friend's presence information in League client
type FriendPresence struct {
	Availability            Availability `json:"availability"`
	GameName                string       `json:"gameName"`
	GameTag                 string       `json:"gameTag"`
	Icon                    int          `json:"icon"`
	Id                      string       `json:"id"`
	LastSeenOnlineTimestamp *int         `json:"lastSeenOnlineTimestamp,omitempty"`
	Lol                     PresenceData `json:"lol"`
	Name                    string       `json:"name"`
	ObfuscatedSummonerId    int          `json:"obfuscatedSummonerId"`
	Patchline               string       `json:"patchline"`
	Pid                     string       `json:"pid"`
	PlatformId              string       `json:"platformId"`
	Product                 string       `json:"product"`
	ProductName             string       `json:"productName"`
	Puuid                   string       `json:"puuid"`
	StatusMessage           string       `json:"statusMessage"`
	Summary                 string       `json:"summary"`
	SummonerId              int          `json:"summonerId"`
	Time                    int          `json:"time"`
}

// RankedDataV2 represents comprehensive LoL ranked data (v2 format)
type RankedDataV2 struct {
	CurrentSeasonSplitPoints          int                    `json:"currentSeasonSplitPoints"`
	EarnedRegaliaRewardIds            []string               `json:"earnedRegaliaRewardIds"`
	HighestCurrentSeasonReachedTierSR string                 `json:"highestCurrentSeasonReachedTierSR"`
	HighestPreviousSeasonEndDivision  string                 `json:"highestPreviousSeasonEndDivision"`
	HighestPreviousSeasonEndTier      string                 `json:"highestPreviousSeasonEndTier"`
	HighestRankedEntry                RankedEntry            `json:"highestRankedEntry"`
	HighestRankedEntrySR              RankedEntry            `json:"highestRankedEntrySR"`
	PreviousSeasonSplitPoints         int                    `json:"previousSeasonSplitPoints"`
	QueueMap                          QueueMap               `json:"queueMap"`
	Queues                            []RankedEntry          `json:"queues"`
	RankedRegaliaLevel                int                    `json:"rankedRegaliaLevel"`
	Seasons                           map[string]Season      `json:"seasons"`
	SplitsProgress                    map[string]interface{} `json:"splitsProgress"`
}
