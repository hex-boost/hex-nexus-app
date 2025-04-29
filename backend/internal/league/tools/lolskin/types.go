package lolskin

type Chroma struct {
	ChromaId     int      `json:"chromaId"`
	ChromaColors []string `json:"chromaColors"`
	DownloadUrl  string   `json:"downloadUrl"`
	ChromaImage  string   `json:"chromaImage"`
}

type Skin struct {
	SkinName         string   `json:"skinName"`
	SkinId           int      `json:"skinId"`
	Rarity           string   `json:"rarity"`
	DownloadUrl      string   `json:"downloadUrl"`
	LoadingScreenUrl string   `json:"loadingScreenUrl"`
	Chromas          []Chroma `json:"chromas,omitempty"`
}

type Champion struct {
	ChampionName   string `json:"championName"`
	ChampionKey    int    `json:"championKey"`
	ChampionSquare string `json:"championSquare"`
	ChampionAlias  string `json:"championAlias"`
	Skins          []Skin `json:"skins"`
}

type Catalog struct {
	LastCommitSha string     `json:"lastCommitSha"`
	Catalog       []Champion `json:"catalog"`
}
