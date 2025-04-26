package types

// LCUInventoryItem represents a single inventory item from the LCU
type LCUInventoryItem struct {
	ExpirationDate string        `json:"expirationDate"`
	F2P            bool          `json:"f2p"`
	InventoryType  string        `json:"inventoryType"`
	ItemID         int           `json:"itemId"`
	Loyalty        bool          `json:"loyalty"`
	LoyaltySources []interface{} `json:"loyaltySources"`
	Owned          bool          `json:"owned"`
	OwnershipType  string        `json:"ownershipType"`
	Payload        interface{}   `json:"payload"`
	PurchaseDate   string        `json:"purchaseDate"`
	Quantity       int           `json:"quantity"`
	Rental         bool          `json:"rental"`
	UUID           string        `json:"uuid"`
	Wins           int           `json:"wins"`
}
type Wallet struct {
	LolBlueEssence int `json:"lol_blue_essence"`
}

type ChampionsMinimal struct {
	Active             bool          `json:"active"`
	Alias              string        `json:"alias"`
	BanVoPath          string        `json:"banVoPath"`
	BaseLoadScreenPath string        `json:"baseLoadScreenPath"`
	BaseSplashPath     string        `json:"baseSplashPath"`
	BotEnabled         bool          `json:"botEnabled"`
	ChooseVoPath       string        `json:"chooseVoPath"`
	DisabledQueues     []interface{} `json:"disabledQueues"`
	FreeToPlay         bool          `json:"freeToPlay"`
	Id                 int           `json:"id"`
	Name               string        `json:"name"`
	Ownership          struct {
		LoyaltyReward bool `json:"loyaltyReward"`
		Owned         bool `json:"owned"`
		Rental        struct {
			EndDate           int     `json:"endDate"`
			PurchaseDate      float64 `json:"purchaseDate"`
			Rented            bool    `json:"rented"`
			WinCountRemaining int     `json:"winCountRemaining"`
		} `json:"rental"`
		XboxGPReward bool `json:"xboxGPReward"`
	} `json:"ownership"`
	Purchased          float64  `json:"purchased"`
	RankedPlayEnabled  bool     `json:"rankedPlayEnabled"`
	Roles              []string `json:"roles"`
	SquarePortraitPath string   `json:"squarePortraitPath"`
	StingerSfxPath     string   `json:"stingerSfxPath"`
	Title              string   `json:"title"`
}
