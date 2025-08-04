package types

import "time"

type Avatar struct {
	Id               int                    `json:"id"`
	DocumentId       string                 `json:"documentId"`
	Name             string                 `json:"name"`
	AlternativeText  *string                `json:"alternativeText"`
	Caption          *string                `json:"caption"`
	Width            int                    `json:"width"`
	Height           int                    `json:"height"`
	Formats          map[string]ImageFormat `json:"formats"`
	Hash             string                 `json:"hash"`
	Ext              string                 `json:"ext"`
	Mime             string                 `json:"mime"`
	Size             float64                `json:"size"`
	URL              string                 `json:"url"`
	PreviewURL       *string                `json:"previewUrl"`
	Provider         string                 `json:"provider"`
	ProviderMetadata *interface{}           `json:"provider_metadata"`
	FolderPath       string                 `json:"folderPath"`
	CreatedAt        time.Time              `json:"createdAt"`
	UpdatedAt        time.Time              `json:"updatedAt"`
	PublishedAt      time.Time              `json:"publishedAt"`
	Locale           *string                `json:"locale"`
}

type ImageFormat struct {
	Ext         string  `json:"ext"`
	URL         string  `json:"url"`
	Hash        string  `json:"hash"`
	Mime        string  `json:"mime"`
	Name        string  `json:"name"`
	Path        *string `json:"path"`
	Size        float64 `json:"size"`
	Width       int     `json:"width"`
	Height      int     `json:"height"`
	SizeInBytes int     `json:"sizeInBytes"`
}

type Action struct {
	Id             int       `json:"id"`
	DocumentId     string    `json:"documentId"`
	Type           string    `json:"type"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	PublishedAt    time.Time `json:"publishedAt"`
	Locale         *string   `json:"locale"`
	ExpirationDate time.Time `json:"expirationDate"`
	TimeEnum       int       `json:"timeEnum"`
}

type Ranking struct {
	Id          int       `json:"id"`
	DocumentId  string    `json:"documentId"`
	Game        string    `json:"game"`
	Elo         string    `json:"elo"`
	Division    string    `json:"division"`
	Points      *int      `json:"points"`
	QueueType   string    `json:"queueType"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	PublishedAt time.Time `json:"publishedAt"`
	Locale      *string   `json:"locale"`
	Wins        *int      `json:"wins"`
	Losses      *int      `json:"losses"`
	Type        string    `json:"type"`
}

type LeaverBuster struct {
	Puuid                     string                 `json:"puuid"`
	LeaverBusterEntryDto      map[string]interface{} `json:"leaverBusterEntryDto"`
	RankedRestrictionEntryDto map[string]interface{} `json:"rankedRestrictionEntryDto"`
}
type UserWithJWT struct {
	JWT  string `json:"jwt"`
	User User   `json:"user"`
}
type Premium struct {
	Id                       int         `json:"id"`
	DocumentId               string      `json:"documentId"`
	ExpiresAt                time.Time   `json:"expiresAt"`
	CreatedAt                time.Time   `json:"createdAt"`
	UpdatedAt                time.Time   `json:"updatedAt"`
	PublishedAt              time.Time   `json:"publishedAt"`
	Locale                   interface{} `json:"locale"`
	LastCoinDistributionDate time.Time   `json:"lastCoinDistributionDate"`
	ExpirationWarningSent    bool        `json:"expirationWarningSent"`
	PaidAmount               interface{} `json:"paidAmount"`
	Plan                     struct {
		Id               int         `json:"id"`
		DocumentId       string      `json:"documentId"`
		MonthlyCoins     int         `json:"monthlyCoins"`
		HasLobbyRevealer bool        `json:"hasLobbyRevealer"`
		HasSkinChanger   bool        `json:"hasSkinChanger"`
		CreatedAt        time.Time   `json:"createdAt"`
		UpdatedAt        time.Time   `json:"updatedAt"`
		PublishedAt      time.Time   `json:"publishedAt"`
		Locale           interface{} `json:"locale"`
		Name             string      `json:"name"`
		MonthlyPrice     int         `json:"monthlyPrice"`
		Tier             int         `json:"tier"`
	} `json:"plan"`
}
type User struct {
	Id                 int           `json:"id"`
	DocumentId         string        `json:"documentId"`
	Username           string        `json:"username"`
	Email              string        `json:"email"`
	Provider           string        `json:"provider"`
	Password           string        `json:"password"`
	ResetPasswordToken *string       `json:"resetPasswordToken"`
	ConfirmationToken  *string       `json:"confirmationToken"`
	Confirmed          bool          `json:"confirmed"`
	Blocked            bool          `json:"blocked"`
	Hwid               string        `json:"hwid"`
	Discord            *interface{}  `json:"discord"`
	AccountPermissions []string      `json:"accountPermissions"`
	Coins              int           `json:"coins"`
	CreatedAt          time.Time     `json:"createdAt"`
	UpdatedAt          time.Time     `json:"updatedAt"`
	PublishedAt        time.Time     `json:"publishedAt"`
	Locale             *string       `json:"locale"`
	Actions            []Action      `json:"actions"`
	FavoriteAccounts   []interface{} `json:"favoriteAccounts"`
	Avatar             *Avatar       `json:"avatar"`
	Premium            *Premium      `json:"premium"`
}
