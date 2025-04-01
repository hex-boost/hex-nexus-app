package updater

import (
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/fynelabs/selfupdate"
	"github.com/go-resty/resty/v2"
)

var (
	Version    = "1.0.0"
	BackendURL = "https://nexus-back.up.railway.app"
	APIToken   = "8d1052df2be1c2318e11927a9c5a05b7376688ccf98902101bef3d7da66d65db2ab781fb5e4d8efde8f8224baaba3e745d0191f9b0f6ce85ddfd5fd625e2306698a6214913aa8023a754a423427d993449f03214965b813876bce3c1fbe11469e4fa742e6e5faf9f3358c36f14284c95bfc5bd8af9b67a57e385ebd77a274bf5"
)

type Updater struct {
	CurrentVersion  string
	BackupDirectory string
}

func NewUpdater() *Updater {
	return &Updater{
		CurrentVersion: Version,
	}
}

func (u *Updater) GetCurrentVersion() string {
	return u.CurrentVersion
}

type Response struct {
	NeedsUpdate bool   `json:"needsUpdate"`
	Version     string `json:"version"`
}

func (u *Updater) CheckForUpdates() (*Response, error) {
	client := resty.New().
		SetTimeout(10 * time.Second)
	var result Response
	strapiURL := fmt.Sprintf("%s/api/versions/update", BackendURL)
	resp, err := client.R().
		SetHeader("x-client-version", u.CurrentVersion).
		SetAuthToken("Bearer " + APIToken).
		SetResult(&result).
		Get(strapiURL)
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, fmt.Errorf("API returned status: %d", resp.StatusCode())
	}
	return &result, nil
}

type VersionResponse struct {
	LatestVersion struct {
		ID          int     `json:"id"`
		DocumentID  string  `json:"documentId"`
		Version     string  `json:"version"`
		CreatedAt   string  `json:"createdAt"`
		UpdatedAt   string  `json:"updatedAt"`
		PublishedAt string  `json:"publishedAt"`
		Locale      *string `json:"locale"`
		File        struct {
			ID               int     `json:"id"`
			DocumentID       string  `json:"documentId"`
			Name             string  `json:"name"`
			AlternativeText  *string `json:"alternativeText"`
			Caption          *string `json:"caption"`
			Width            *int    `json:"width"`
			Height           *int    `json:"height"`
			Formats          *string `json:"formats"`
			Hash             string  `json:"hash"`
			Ext              string  `json:"ext"`
			Mime             string  `json:"mime"`
			Size             float64 `json:"size"`
			URL              string  `json:"url"`
			PreviewURL       *string `json:"previewUrl"`
			Provider         string  `json:"provider"`
			ProviderMetadata *string `json:"provider_metadata"`
			FolderPath       string  `json:"folderPath"`
			CreatedAt        string  `json:"createdAt"`
			UpdatedAt        string  `json:"updatedAt"`
			PublishedAt      string  `json:"publishedAt"`
			Locale           *string `json:"locale"`
		} `json:"file"`
	} `json:"latestVersion"`
}

func (u *Updater) Update() error {
	_, err := os.Executable()
	strapiLatestVersionURL := fmt.Sprintf("%s/api/versions/latest", BackendURL)
	if err != nil {
		return err
	}
	var response VersionResponse
	client := resty.New()
	resp, err := client.R().
		SetResult(&response).SetAuthToken("Bearer " + APIToken).
		Get(strapiLatestVersionURL)
	if err != nil {
		return err
	}
	if resp.IsError() {
		return fmt.Errorf("API returned status: %d", resp.StatusCode())
	}
	fileURL := response.LatestVersion.File.URL
	if fileURL == "" {
		return fmt.Errorf("no file URL found in response")
	}
	if !strings.HasPrefix(fileURL, "http") {
		fileURL = BackendURL + fileURL
	}
	resp, err = client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		return err
	}
	binReader := resp.RawBody()
	defer func(binReader io.ReadCloser) {
		err := binReader.Close()
		if err != nil {
		}
	}(binReader)
	err = selfupdate.Apply(binReader, selfupdate.Options{})
	if err != nil {
		return err
	}
	return nil
}
