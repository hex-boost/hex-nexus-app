package updater

import "time"

type VersionResponse struct {
	Data []struct {
		Id          int       `json:"id"`
		DocumentId  string    `json:"documentId"`
		Version     string    `json:"version"`
		CreatedAt   time.Time `json:"createdAt"`
		UpdatedAt   time.Time `json:"updatedAt"`
		PublishedAt time.Time `json:"publishedAt"`
		Updater     *struct {
			Id               int         `json:"id"`
			DocumentId       string      `json:"documentId"`
			Name             string      `json:"name"`
			AlternativeText  interface{} `json:"alternativeText"`
			Caption          interface{} `json:"caption"`
			Width            interface{} `json:"width"`
			Height           interface{} `json:"height"`
			Formats          interface{} `json:"formats"`
			Hash             string      `json:"hash"`
			Ext              string      `json:"ext"`
			Mime             string      `json:"mime"`
			Size             float64     `json:"size"`
			Url              string      `json:"url"`
			PreviewUrl       interface{} `json:"previewUrl"`
			Provider         string      `json:"provider"`
			ProviderMetadata interface{} `json:"provider_metadata"`
			CreatedAt        time.Time   `json:"createdAt"`
			UpdatedAt        time.Time   `json:"updatedAt"`
			PublishedAt      time.Time   `json:"publishedAt"`
		} `json:"updater"`
	} `json:"data"`
	Meta struct {
		Pagination struct {
			Page      int `json:"page"`
			PageSize  int `json:"pageSize"`
			PageCount int `json:"pageCount"`
			Total     int `json:"total"`
		} `json:"pagination"`
	} `json:"meta"`
}
