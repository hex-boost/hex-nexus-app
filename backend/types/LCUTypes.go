package types

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

type RerollPoints struct {
	CurrentPoints    int `json:"currentPoints"`
	MaxRolls         int `json:"maxRolls"`
	NumberOfRolls    int `json:"numberOfRolls"`
	PointsCostToRoll int `json:"pointsCostToRoll"`
	PointsToReroll   int `json:"pointsToReroll"`
}

type Privacy string

const (
	PrivacyPublic  Privacy = "PUBLIC"
	PrivacyPrivate Privacy = "PRIVATE"
)

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

type AccountInfo struct {
	Puuid      string `json:"puuid"`
	AccountId  int    `json:"accountId"`
	Username   string `json:"username"`
	SummonerId int    `json:"summonerId"`
}

type LoginState struct {
	Connected      bool    `json:"connected"`
	State          string  `json:"state"`
	IsInLoginQueue bool    `json:"isInLoginQueue"`
	Error          *string `json:"error,omitempty"`
}

type RentalInfo struct {
	EndDate           int  `json:"endDate"`
	PurchaseDate      int  `json:"purchaseDate"`
	Rented            bool `json:"rented"`
	WinCountRemaining int  `json:"winCountRemaining"`
}

type OwnershipInfo struct {
	LoyaltyReward bool       `json:"loyaltyReward"`
	Owned         bool       `json:"owned"`
	Rental        RentalInfo `json:"rental"`
	XboxGPReward  bool       `json:"xboxGPReward"`
}

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

type Season struct {
	CurrentSeasonEnd int `json:"currentSeasonEnd"`
	CurrentSeasonId  int `json:"currentSeasonId"`
	NextSeasonStart  int `json:"nextSeasonStart"`
}

type QueueType string

const (
	QueueTypeTFT         QueueType = "RANKED_TFT"
	QueueTypeSolo        QueueType = "RANKED_SOLO_5x5"
	QueueTypeFlex        QueueType = "RANKED_FLEX_SR"
	QueueTypeTFTTurbo    QueueType = "RANKED_TFT_TURBO"
	QueueTypeTFTDoubleUp QueueType = "RANKED_TFT_DOUBLE_UP"
)

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

type QueueMap struct {
	RankedFlexSR      RankedEntry `json:"RANKED_FLEX_SR"`
	RankedSolo5x5     RankedEntry `json:"RANKED_SOLO_5x5"`
	RankedTFT         RankedEntry `json:"RANKED_TFT"`
	RankedTFTDoubleUp RankedEntry `json:"RANKED_TFT_DOUBLE_UP"`
	RankedTFTTurbo    RankedEntry `json:"RANKED_TFT_TURBO"`
}

type GameStatus string

const (
	GameStatusInGame      GameStatus = "inGame"
	GameStatusOutOfGame   GameStatus = "outOfGame"
	GameStatusChampSelect GameStatus = "champSelect"
	GameStatusSpectating  GameStatus = "spectating"
)

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

type Availability string

const (
	AvailabilityChat    Availability = "chat"
	AvailabilityAway    Availability = "away"
	AvailabilityDnd     Availability = "dnd"
	AvailabilityMobile  Availability = "mobile"
	AvailabilityOffline Availability = "offline"
	AvailabilityOnline  Availability = "online"
)

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

type RCUUserinfo struct {
	UserInfo string `json:"userInfo"`
}
type UserinfoJWT struct {
	UserInfo string `json:"userInfo"`
}
type UserInfo struct {
	Country             string      `json:"country"`
	Sub                 string      `json:"sub"`
	LOLAccount          LOLAccount  `json:"lol_account"`
	EmailVerified       bool        `json:"email_verified"`
	PlayerPLocale       string      `json:"player_plocale"`
	CountryAt           interface{} `json:"country_at"`
	PW                  Password    `json:"pw"`
	LOL                 LOLInfo     `json:"lol"`
	OriginalPlatformID  string      `json:"original_platform_id"`
	OriginalAccountID   int         `json:"original_account_id"`
	PhoneNumberVerified bool        `json:"phone_number_verified"`
	Photo               string      `json:"photo"`
	PreferredUsername   string      `json:"preferred_username"`
	Ban                 Ban         `json:"ban"`
	PPID                interface{} `json:"ppid"`
	LOLRegion           []LOLInfo   `json:"lol_region"`
	PlayerLocale        string      `json:"player_locale"`
	PvpNetAccountID     int         `json:"pvpnet_account_id"`
	Region              Region      `json:"region"`
	Acct                Account     `json:"acct"`
	JTI                 string      `json:"jti"`
	Username            string      `json:"username"`
}
type LOLAccount struct {
	SummonerID    int    `json:"summoner_id"`
	ProfileIcon   int    `json:"profile_icon"`
	SummonerLevel int    `json:"summoner_level"`
	SummonerName  string `json:"summoner_name"`
}

type Password struct {
	CngAt     int64 `json:"cng_at"`
	Reset     bool  `json:"reset"`
	MustReset bool  `json:"must_reset"`
}

type LOLInfo struct {
	CUID    int     `json:"cuid"`
	CPID    string  `json:"cpid"`
	UID     int     `json:"uid"`
	PID     string  `json:"pid"`
	APID    *string `json:"apid"`
	PLocale string  `json:"ploc,omitempty"`
	LP      bool    `json:"lp"`
	Active  bool    `json:"active"`
}

type Restriction struct {
	Type   string                 `json:"type"`
	Reason string                 `json:"reason"`
	Scope  string                 `json:"scope"`
	Data   map[string]interface{} `json:"dat"`
}

type Region struct {
	Locales []string `json:"locales"`
	ID      string   `json:"id"`
	Tag     string   `json:"tag"`
}

type Account struct {
	Type      int    `json:"type"`
	State     string `json:"state"`
	Adm       bool   `json:"adm"`
	GameName  string `json:"game_name"`
	TagLine   string `json:"tag_line"`
	CreatedAt int64  `json:"created_at"`
}
type ChampionJWT struct {
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
type SkinJWT struct {
	Sub   string `json:"sub"`
	Tiers struct {
	} `json:"tiers"`
	Containsf2P bool   `json:"containsf2P"`
	ShardId     string `json:"shardId"`
	Exp         int    `json:"exp"`
	Iat         int    `json:"iat"`
	Items       struct {
		SKIN []int `json:"CHAMPION_SKIN"`
	} `json:"items"`
}
