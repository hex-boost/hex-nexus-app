package updater

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/fynelabs/selfupdate"
	"github.com/go-resty/resty/v2"
)

var (
	Version    = "development"
	BackendURL = "http://localhost:1337"
	APIToken   = "b632ef87c3cbdda0975786fc85c1f452083bf07ef0977170400562577c627d2309949ba4e9b74a2c4c30d9ac575521ba97e3a61fac31f635390629a102674ac860c4935fcf98c8934a7af1052141d30cc31060939d1074ec3a055b9f1589c4c2fab46f6cbcee61bc06a5bceb3102d13d860c15106cd9a306248f890f31c2bfbff"
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
	fmt.Printf("apitoken: " + APIToken + "\nbackendurl: " + BackendURL + "\n")
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

func (u *Updater) Update(ctx context.Context) error {
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
			fmt.Printf("Error closing binary reader: %v\n", err)
		}
	}(binReader)
	err = selfupdate.Apply(binReader, selfupdate.Options{})
	if err != nil {
		if err != nil {
			return err
		}
		return err
	}
	//runtime.Quit(ctx)
	return nil
}
