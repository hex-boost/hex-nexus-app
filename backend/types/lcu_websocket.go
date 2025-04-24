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
