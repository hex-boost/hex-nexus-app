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
type SkinJWT struct {
	Sub         string   `json:"sub"`
	Tiers       struct{} `json:"tiers"`
	Containsf2P bool     `json:"containsf2P"`
	ShardId     string   `json:"shardId"`
	Exp         int      `json:"exp"`
	Iat         int      `json:"iat"`
	Items       struct {
		SKIN []int `json:"CHAMPION_SKIN"`
	} `json:"items"`
}

type LolChallengesGameflowPhase string

const (
	LolChallengesGameflowPhaseTerminatedInError     LolChallengesGameflowPhase = "TerminatedInError"
	LolChallengesGameflowPhaseEndOfGame             LolChallengesGameflowPhase = "EndOfGame"
	LolChallengesGameflowPhasePreEndOfGame          LolChallengesGameflowPhase = "PreEndOfGame"
	LolChallengesGameflowPhaseWaitingForStats       LolChallengesGameflowPhase = "WaitingForStats"
	LolChallengesGameflowPhaseReconnect             LolChallengesGameflowPhase = "Reconnect"
	LolChallengesGameflowPhaseInProgress            LolChallengesGameflowPhase = "InProgress"
	LolChallengesGameflowPhaseFailedToLaunch        LolChallengesGameflowPhase = "FailedToLaunch"
	LolChallengesGameflowPhaseGameStart             LolChallengesGameflowPhase = "GameStart"
	LolChallengesGameflowPhaseChampSelect           LolChallengesGameflowPhase = "ChampSelect"
	LolChallengesGameflowPhaseReadyCheck            LolChallengesGameflowPhase = "ReadyCheck"
	LolChallengesGameflowPhaseCheckedIntoTournament LolChallengesGameflowPhase = "CheckedIntoTournament"
	LolChallengesGameflowPhaseMatchmaking           LolChallengesGameflowPhase = "Matchmaking"
	LolChallengesGameflowPhaseLobby                 LolChallengesGameflowPhase = "Lobby"
	LolChallengesGameflowPhaseNone                  LolChallengesGameflowPhase = "None"
)

type LolChampSelectGridChampions struct {
	Disabled           bool          `json:"disabled"`
	FreeToPlay         bool          `json:"freeToPlay"`
	FreeToPlayForQueue bool          `json:"freeToPlayForQueue"`
	ChampionId         int           `json:"id"`
	LoyaltyReward      bool          `json:"loyaltyReward"`
	MasteryLevel       int           `json:"masteryLevel"`
	MasteryPoints      int           `json:"masteryPoints"`
	Name               string        `json:"name"`
	Owned              bool          `json:"owned"`
	PositionsFavorited []interface{} `json:"positionsFavorited"`
	Rented             bool          `json:"rented"`
	Roles              []string      `json:"roles"`
	SelectionStatus    struct {
		BanIntented           bool   `json:"banIntented"`
		BanIntentedByMe       bool   `json:"banIntentedByMe"`
		IsBanned              bool   `json:"isBanned"`
		PickIntented          bool   `json:"pickIntented"`
		PickIntentedByMe      bool   `json:"pickIntentedByMe"`
		PickIntentedPosition  string `json:"pickIntentedPosition"`
		PickedByOtherOrBanned bool   `json:"pickedByOtherOrBanned"`
		SelectedByMe          bool   `json:"selectedByMe"`
	} `json:"selectionStatus"`
	SquarePortraitPath string `json:"squarePortraitPath"`
	XboxGPReward       bool   `json:"xboxGPReward"`
}

type DDChampionByID struct {
	Id           int    `json:"id"`
	Name         string `json:"name"`
	Alias        string `json:"alias"`
	Title        string `json:"title"`
	ShortBio     string `json:"shortBio"`
	TacticalInfo struct {
		Style      int    `json:"style"`
		Difficulty int    `json:"difficulty"`
		DamageType string `json:"damageType"`
	} `json:"tacticalInfo"`
	PlaystyleInfo struct {
		Damage       int `json:"damage"`
		Durability   int `json:"durability"`
		CrowdControl int `json:"crowdControl"`
		Mobility     int `json:"mobility"`
		Utility      int `json:"utility"`
	} `json:"playstyleInfo"`
	SquarePortraitPath      string        `json:"squarePortraitPath"`
	StingerSfxPath          string        `json:"stingerSfxPath"`
	ChooseVoPath            string        `json:"chooseVoPath"`
	BanVoPath               string        `json:"banVoPath"`
	Roles                   []string      `json:"roles"`
	RecommendedItemDefaults []interface{} `json:"recommendedItemDefaults"`
	Skins                   []struct {
		Id                           int         `json:"id"`
		ContentId                    string      `json:"contentId"`
		IsBase                       bool        `json:"isBase"`
		Name                         string      `json:"name"`
		SplashPath                   string      `json:"splashPath"`
		UncenteredSplashPath         string      `json:"uncenteredSplashPath"`
		TilePath                     string      `json:"tilePath"`
		LoadScreenPath               string      `json:"loadScreenPath"`
		SkinType                     string      `json:"skinType"`
		Rarity                       string      `json:"rarity"`
		IsLegacy                     bool        `json:"isLegacy"`
		SplashVideoPath              interface{} `json:"splashVideoPath"`
		CollectionSplashVideoPath    interface{} `json:"collectionSplashVideoPath"`
		CollectionCardHoverVideoPath interface{} `json:"collectionCardHoverVideoPath"`
		FeaturesText                 interface{} `json:"featuresText"`
		ChromaPath                   *string     `json:"chromaPath"`
		Emblems                      interface{} `json:"emblems"`
		RegionRarityId               int         `json:"regionRarityId"`
		RarityGemPath                interface{} `json:"rarityGemPath"`
		SkinLines                    []struct {
			Id int `json:"id"`
		} `json:"skinLines"`
		Description *string `json:"description"`
		Chromas     []struct {
			Id           int      `json:"id"`
			Name         string   `json:"name"`
			ContentId    string   `json:"contentId"`
			ChromaPath   string   `json:"chromaPath"`
			Colors       []string `json:"colors"`
			Descriptions []struct {
				Region      string `json:"region"`
				Description string `json:"description"`
			} `json:"descriptions"`
			Rarities []struct {
				Region string `json:"region"`
				Rarity int    `json:"rarity"`
			} `json:"rarities"`
		} `json:"chromas,omitempty"`
		LoadScreenVintagePath string `json:"loadScreenVintagePath,omitempty"`
	} `json:"skins"`
	Passive struct {
		Name                  string `json:"name"`
		AbilityIconPath       string `json:"abilityIconPath"`
		AbilityVideoPath      string `json:"abilityVideoPath"`
		AbilityVideoImagePath string `json:"abilityVideoImagePath"`
		Description           string `json:"description"`
	} `json:"passive"`
	Spells []struct {
		SpellKey              string `json:"spellKey"`
		Name                  string `json:"name"`
		AbilityIconPath       string `json:"abilityIconPath"`
		AbilityVideoPath      string `json:"abilityVideoPath"`
		AbilityVideoImagePath string `json:"abilityVideoImagePath"`
		Cost                  string `json:"cost"`
		Cooldown              string `json:"cooldown"`
		Description           string `json:"description"`
		DynamicDescription    string `json:"dynamicDescription"`
		Range                 []int  `json:"range"`
		CostCoefficients      []int  `json:"costCoefficients"`
		CooldownCoefficients  []int  `json:"cooldownCoefficients"`
		Coefficients          struct {
			Coefficient1 int `json:"coefficient1"`
			Coefficient2 int `json:"coefficient2"`
		} `json:"coefficients"`
		EffectAmounts struct {
			Effect1Amount  []int `json:"Effect1Amount"`
			Effect2Amount  []int `json:"Effect2Amount"`
			Effect3Amount  []int `json:"Effect3Amount"`
			Effect4Amount  []int `json:"Effect4Amount"`
			Effect5Amount  []int `json:"Effect5Amount"`
			Effect6Amount  []int `json:"Effect6Amount"`
			Effect7Amount  []int `json:"Effect7Amount"`
			Effect8Amount  []int `json:"Effect8Amount"`
			Effect9Amount  []int `json:"Effect9Amount"`
			Effect10Amount []int `json:"Effect10Amount"`
		} `json:"effectAmounts"`
		Ammo struct {
			AmmoRechargeTime []int `json:"ammoRechargeTime"`
			MaxAmmo          []int `json:"maxAmmo"`
		} `json:"ammo"`
		MaxLevel int `json:"maxLevel"`
	} `json:"spells"`
}

type LolGameflowV1Session struct {
	GameClient struct {
		ObserverServerIp   string `json:"observerServerIp"`
		ObserverServerPort int    `json:"observerServerPort"`
		Running            bool   `json:"running"`
		ServerIp           string `json:"serverIp"`
		ServerPort         int    `json:"serverPort"`
		Visible            bool   `json:"visible"`
	} `json:"gameClient"`
	GameData struct {
		GameId                   int           `json:"gameId"`
		GameName                 string        `json:"gameName"`
		IsCustomGame             bool          `json:"isCustomGame"`
		Password                 string        `json:"password"`
		PlayerChampionSelections []interface{} `json:"playerChampionSelections"`
		Queue                    struct {
			AllowablePremadeSizes   []interface{} `json:"allowablePremadeSizes"`
			AreFreeChampionsAllowed bool          `json:"areFreeChampionsAllowed"`
			AssetMutator            string        `json:"assetMutator"`
			Category                string        `json:"category"`
			ChampionsRequiredToPlay int           `json:"championsRequiredToPlay"`
			Description             string        `json:"description"`
			DetailedDescription     string        `json:"detailedDescription"`
			GameMode                string        `json:"gameMode"`
			GameTypeConfig          struct {
				AdvancedLearningQuests bool   `json:"advancedLearningQuests"`
				AllowTrades            bool   `json:"allowTrades"`
				BanMode                string `json:"banMode"`
				BanTimerDuration       int    `json:"banTimerDuration"`
				BattleBoost            bool   `json:"battleBoost"`
				CrossTeamChampionPool  bool   `json:"crossTeamChampionPool"`
				DeathMatch             bool   `json:"deathMatch"`
				DoNotRemove            bool   `json:"doNotRemove"`
				DuplicatePick          bool   `json:"duplicatePick"`
				ExclusivePick          bool   `json:"exclusivePick"`
				Id                     int    `json:"id"`
				LearningQuests         bool   `json:"learningQuests"`
				MainPickTimerDuration  int    `json:"mainPickTimerDuration"`
				MaxAllowableBans       int    `json:"maxAllowableBans"`
				Name                   string `json:"name"`
				OnboardCoopBeginner    bool   `json:"onboardCoopBeginner"`
				PickMode               string `json:"pickMode"`
				PostPickTimerDuration  int    `json:"postPickTimerDuration"`
				Reroll                 bool   `json:"reroll"`
				TeamChampionPool       bool   `json:"teamChampionPool"`
			} `json:"gameTypeConfig"`
			Id                         int    `json:"id"`
			IsRanked                   bool   `json:"isRanked"`
			IsTeamBuilderManaged       bool   `json:"isTeamBuilderManaged"`
			LastToggledOffTime         int    `json:"lastToggledOffTime"`
			LastToggledOnTime          int    `json:"lastToggledOnTime"`
			MapId                      int    `json:"mapId"`
			MaximumParticipantListSize int    `json:"maximumParticipantListSize"`
			MinLevel                   int    `json:"minLevel"`
			MinimumParticipantListSize int    `json:"minimumParticipantListSize"`
			Name                       string `json:"name"`
			NumPlayersPerTeam          int    `json:"numPlayersPerTeam"`
			QueueAvailability          string `json:"queueAvailability"`
			QueueRewards               struct {
				IsChampionPointsEnabled bool          `json:"isChampionPointsEnabled"`
				IsIpEnabled             bool          `json:"isIpEnabled"`
				IsXpEnabled             bool          `json:"isXpEnabled"`
				PartySizeIpRewards      []interface{} `json:"partySizeIpRewards"`
			} `json:"queueRewards"`
			RemovalFromGameAllowed      bool   `json:"removalFromGameAllowed"`
			RemovalFromGameDelayMinutes int    `json:"removalFromGameDelayMinutes"`
			ShortName                   string `json:"shortName"`
			ShowPositionSelector        bool   `json:"showPositionSelector"`
			SpectatorEnabled            bool   `json:"spectatorEnabled"`
			Type                        string `json:"type"`
		} `json:"queue"`
		SpectatorsAllowed bool          `json:"spectatorsAllowed"`
		TeamOne           []interface{} `json:"teamOne"`
		TeamTwo           []interface{} `json:"teamTwo"`
	} `json:"gameData"`
	GameDodge struct {
		DodgeIds []interface{} `json:"dodgeIds"`
		Phase    string        `json:"phase"`
		State    string        `json:"state"`
	} `json:"gameDodge"`
	Map struct {
		Assets struct {
			ChampSelectBackgroundSound  string `json:"champ-select-background-sound"`
			ChampSelectFlyoutBackground string `json:"champ-select-flyout-background"`
			ChampSelectPlanningIntro    string `json:"champ-select-planning-intro"`
			GameSelectIconActive        string `json:"game-select-icon-active"`
			GameSelectIconActiveVideo   string `json:"game-select-icon-active-video"`
			GameSelectIconDefault       string `json:"game-select-icon-default"`
			GameSelectIconDisabled      string `json:"game-select-icon-disabled"`
			GameSelectIconHover         string `json:"game-select-icon-hover"`
			GameSelectIconIntroVideo    string `json:"game-select-icon-intro-video"`
			GameflowBackground          string `json:"gameflow-background"`
			GameselectButtonHoverSound  string `json:"gameselect-button-hover-sound"`
			IconDefeat                  string `json:"icon-defeat"`
			IconDefeatVideo             string `json:"icon-defeat-video"`
			IconEmpty                   string `json:"icon-empty"`
			IconHover                   string `json:"icon-hover"`
			IconLeaver                  string `json:"icon-leaver"`
			IconVictory                 string `json:"icon-victory"`
			IconVictoryVideo            string `json:"icon-victory-video"`
			MapNorth                    string `json:"map-north"`
			MapSouth                    string `json:"map-south"`
			MusicInqueueLoopSound       string `json:"music-inqueue-loop-sound"`
			PartiesBackground           string `json:"parties-background"`
			PostgameAmbienceLoopSound   string `json:"postgame-ambience-loop-sound"`
			ReadyCheckBackground        string `json:"ready-check-background"`
			ReadyCheckBackgroundSound   string `json:"ready-check-background-sound"`
			SfxAmbiencePregameLoopSound string `json:"sfx-ambience-pregame-loop-sound"`
			SocialIconLeaver            string `json:"social-icon-leaver"`
			SocialIconVictory           string `json:"social-icon-victory"`
		} `json:"assets"`
		CategorizedContentBundles struct {
		} `json:"categorizedContentBundles"`
		Description                         string `json:"description"`
		GameMode                            string `json:"gameMode"`
		GameModeName                        string `json:"gameModeName"`
		GameModeShortName                   string `json:"gameModeShortName"`
		GameMutator                         string `json:"gameMutator"`
		Id                                  int    `json:"id"`
		IsRGM                               bool   `json:"isRGM"`
		MapStringId                         string `json:"mapStringId"`
		Name                                string `json:"name"`
		PerPositionDisallowedSummonerSpells struct {
		} `json:"perPositionDisallowedSummonerSpells"`
		PerPositionRequiredSummonerSpells struct {
		} `json:"perPositionRequiredSummonerSpells"`
		PlatformId   string `json:"platformId"`
		PlatformName string `json:"platformName"`
		Properties   struct {
			SuppressRunesMasteriesPerks bool `json:"suppressRunesMasteriesPerks"`
		} `json:"properties"`
	} `json:"map"`
	Phase string `json:"phase"`
}
type CurrentSummonerProfile struct {
	BackgroundSkinId       int    `json:"backgroundSkinId"`
	Regalia                string `json:"regalia"`
	BackgroundSkinAugments string `json:"backgroundSkinAugments"`
}
type LocalPlayerChampionMastery struct {
	ChampionId                   int           `json:"championId"`
	ChampionLevel                int           `json:"championLevel"`
	ChampionPoints               int           `json:"championPoints"`
	ChampionPointsSinceLastLevel int           `json:"championPointsSinceLastLevel"`
	ChampionPointsUntilNextLevel int           `json:"championPointsUntilNextLevel"`
	ChampionSeasonMilestone      int           `json:"championSeasonMilestone"`
	HighestGrade                 string        `json:"highestGrade"`
	LastPlayTime                 int64         `json:"lastPlayTime"`
	MarkRequiredForNextLevel     int           `json:"markRequiredForNextLevel"`
	MilestoneGrades              []interface{} `json:"milestoneGrades"`
	NextSeasonMilestone          struct {
		Bonus              bool `json:"bonus"`
		RequireGradeCounts struct {
			A int `json:"A-"`
		} `json:"requireGradeCounts"`
		RewardConfig struct {
			MaximumReward int    `json:"maximumReward"`
			RewardValue   string `json:"rewardValue"`
		} `json:"rewardConfig"`
		RewardMarks int `json:"rewardMarks"`
	} `json:"nextSeasonMilestone"`
	Puuid        string `json:"puuid"`
	TokensEarned int    `json:"tokensEarned"`
}
type LeaverBusterGamesRemaining struct {
	NeedsAck               bool `json:"needsAck"`
	PunishedGamesRemaining int  `json:"punishedGamesRemaining"`
}
