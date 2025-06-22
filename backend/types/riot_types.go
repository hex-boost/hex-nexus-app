package types

// PlayerPlatformEdgeURL maps region codes to their corresponding player platform edge URLs.
// KR, PBE, TW2 are not supported yet.
// Example: euc1-red.pp.sgp.pvp.net
// Can be found in C:\Riot Games\League of Legends\system.yaml in the player_platform_edge_url field.
var PlayerPlatformEdgeURL = map[string]string{
	"EUW1": "https://euc1-red.pp.sgp.pvp.net",
	"EUN1": "https://euc1-red.pp.sgp.pvp.net",
	"NA1":  "https://usw2-red.pp.sgp.pvp.net",
	"LA1":  "https://usw2-red.pp.sgp.pvp.net",
	"LA2":  "https://usw2-red.pp.sgp.pvp.net",
	"TR1":  "https://euc1-red.pp.sgp.pvp.net",
	"ME1":  "https://euc1-red.pp.sgp.pvp.net",
	"RU":   "https://euc1-red.pp.sgp.pvp.net",
	"OC1":  "https://apse1-red.pp.sgp.pvp.net",
	"BR1":  "https://usw2-red.pp.sgp.pvp.net",
	"JP1":  "https://apne1-red.pp.sgp.pvp.net",
	"SG2":  "https://apse1-red.pp.sgp.pvp.net",
	"PH2":  "https://apse1-red.pp.sgp.pvp.net",
	"VN2":  "https://apse1-red.pp.sgp.pvp.net",
	"TH2":  "https://apse1-red.pp.sgp.pvp.net",
}

// Can be found in C:\Riot Games\League of Legends\system.yaml in the league_edge_url field.
var LeagueEdgeURL = map[string]string{
	"ME1":  "https://me1-red.lol.sgp.pvp.net",
	"BR1":  "https://br-red.lol.sgp.pvp.net",
	"EUN1": "https://eune-red.lol.sgp.pvp.net",
	"EUW1": "https://euw-red.lol.sgp.pvp.net",
	"JP1":  "https://jp-red.lol.sgp.pvp.net",
	"LA1":  "https://lan-red.lol.sgp.pvp.net",
	"LA2":  "https://las-red.lol.sgp.pvp.net",
	"NA1":  "https://na-red.lol.sgp.pvp.net",
	"OC1":  "https://oce-red.lol.sgp.pvp.net",
	"RU":   "https://ru-red.lol.sgp.pvp.net",
	"TR1":  "https://tr-red.lol.sgp.pvp.net",
	"SG2":  "https://sg2-red.lol.sgp.pvp.net",
	"PH2":  "https://ph2-red.lol.sgp.pvp.net",
	"VN2":  "https://vn2-red.lol.sgp.pvp.net",
	"TH2":  "https://th2-red.lol.sgp.pvp.net",
}

// DiscoverousServiceLocation maps region codes to their discoverous service location.
// KR, PBE, TW2 are not supported yet.
// Example: lolriot.aws-euc1-prod.euw1
// Can be found in C:\Riot Games\League of Legends\system.yaml in the discoverous_service_location field.
var DiscoverousServiceLocation = map[string]string{
	"BR1":  "lolriot.aws-usw2-prod.br1",
	"EUN1": "lolriot.aws-euc1-prod.eun1",
	"EUW1": "lolriot.aws-euc1-prod.euw1",
	"JP1":  "lolriot.aws-apne1-prod.jp1",
	"LA1":  "lolriot.aws-usw2-prod.la1",
	"LA2":  "lolriot.aws-usw2-prod.la2",
	"NA1":  "lolriot.aws-usw2-prod.na1",
	"OC1":  "lolriot.aws-apse1-prod.oc1",
	"RU":   "lolriot.aws-euc1-prod.ru",
	"TR1":  "lolriot.aws-euc1-prod.tr1",
	"SG2":  "lolriot.aws-euc1-prod.sg2",
	"PH2":  "lolriot.aws-euc1-prod.ph2",
	"VN2":  "lolriot.aws-euc1-prod.vn2",
	"TH2":  "lolriot.aws-euc1-prod.th2",
}

// InventoryType defines the type for inventory items.
type InventoryType string

const (
	Champion     InventoryType = "CHAMPION"
	ChampionSkin InventoryType = "CHAMPION_SKIN"
	EventPass    InventoryType = "EVENT_PASS"
	SkinAugment  InventoryType = "SKIN_AUGMENT"
	SkinBorder   InventoryType = "SKIN_BORDER"
	QueueEntry   InventoryType = "QUEUE_ENTRY"
)

// LootNameType defines the type for loot names.
type LootNameType string

const (
	KeyFragment          LootNameType = "MATERIAL_key_fragment"
	Key                  LootNameType = "MATERIAL_key"
	GenericChest         LootNameType = "CHEST_generic"
	ChampionMasteryChest LootNameType = "CHEST_champion_mastery"
	MasterworkChest      LootNameType = "CHEST_224"
	BlueEssence          LootNameType = "CURRENCY_champion"
	OrangeEssence        LootNameType = "CURRENCY_cosmetic"
	MythicEssence        LootNameType = "CURRENCY_mythic"
	ChestNewPlayer       LootNameType = "CHEST_new_player"
	ChestDayOne          LootNameType = "CHEST_day_one"
)
