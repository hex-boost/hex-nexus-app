package types

import "time"

type User struct {
	Id          int         `json:"id"`
	DocumentId  string      `json:"documentId"`
	Username    string      `json:"username"`
	Email       string      `json:"email"`
	Provider    string      `json:"provider"`
	Confirmed   bool        `json:"confirmed"`
	Blocked     bool        `json:"blocked"`
	Hwid        interface{} `json:"hwid"`
	Discord     interface{} `json:"discord"`
	CreatedAt   time.Time   `json:"createdAt"`
	UpdatedAt   time.Time   `json:"updatedAt"`
	PublishedAt time.Time   `json:"publishedAt"`
}
