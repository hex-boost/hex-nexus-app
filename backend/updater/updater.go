package updater

import (
	"encoding/json"
	"fmt"
	"github.com/fynelabs/selfupdate"
	"github.com/go-resty/resty/v2"
	cmdUtils "github.com/hex-boost/hex-nexus-app/backend/cmd"
	"io"
	"os"
	"os/exec"
	"strings"
)

var (
	Version    = "development"
	BackendURL = "https:
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
	client := resty.New()
	var result Response
	strapiURL := fmt.Sprintf("%s/api/versions/update", BackendURL)

	resp, err := client.R().
		SetHeader("x-client-version", u.CurrentVersion).
		SetResult(&result).
		Get(strapiURL)
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		var errorResponse struct {
			Data  interface{} `json:"data"`
			Error struct {
				Message string `json:"message"`
			} `json:"error"`
		}

		if err := json.Unmarshal(resp.Body(), &errorResponse); err == nil &&
			errorResponse.Error.Message == "No versions found" {
			
			return &Response{NeedsUpdate: false, Version: "No version on backend"}, nil
		}

		return nil, fmt.Errorf("API returned status: %d for %s", resp.StatusCode(), strapiURL)
	}
	return &result, nil
}

func (u *Updater) UpdateAndRestart() error {
	if err := u.Update(); err != nil {
		return fmt.Errorf("error during update: %w", err)
	}
	return u.restartApplication(os.Args)
}

func (u *Updater) restartApplication(args []string) error {
	execPath, err := os.Executable()
	if err != nil {
		return err
	}
	cmd := exec.Command(execPath, args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	cmd = cmdUtils.HideConsoleWindow(cmd)
	if err := cmd.Start(); err != nil {
		return err
	}
	os.Exit(0)
	return nil
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
	fmt.Println("Starting update process...")
	strapiLatestVersionURL := fmt.Sprintf("%s/api/versions/latest", BackendURL)
	fmt.Printf("Checking for updates at: %s\n", strapiLatestVersionURL)
	var response VersionResponse
	client := resty.New()
	resp, err := client.R().
		Get(strapiLatestVersionURL)
	if err != nil {
		fmt.Printf("Error requesting latest version: %v\n", err)
		return err
	}
	if resp.IsError() {
		fmt.Printf("API error: status code %d, body: %s\n", resp.StatusCode(), resp.String())
		return fmt.Errorf("API returned status: %d", resp.StatusCode())
	}
	fmt.Printf("Received response: %s\n", resp.String())
	err = json.Unmarshal(resp.Body(), &response)
	if err != nil {
		fmt.Printf("Failed to parse response: %v\n", err)
		return fmt.Errorf("error parsing response: %w", err)
	}
	fmt.Printf("Latest version info: %+v\n", response.LatestVersion)
	fileURL := response.LatestVersion.File.URL
	if fileURL == "" {
		fmt.Println("No file URL found in response")
		return fmt.Errorf("no file URL found in response")
	}
	if !strings.HasPrefix(fileURL, "http") {
		fileURL = BackendURL + fileURL
	}
	fmt.Printf("Download URL: %s\n", fileURL)
	fmt.Println("Downloading update file...")
	resp, err = client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		fmt.Printf("Error downloading update: %v\n", err)
		return err
	}
	fmt.Printf("Download response status: %d\n", resp.StatusCode())
	binReader := resp.RawBody()
	defer func(binReader io.ReadCloser) {
		err := binReader.Close()
		if err != nil {
			fmt.Printf("Error closing response body: %v\n", err)
		}
	}(binReader)
	fmt.Println("Applying update...")
	err = selfupdate.Apply(binReader, selfupdate.Options{})
	if err != nil {
		fmt.Printf("Error applying update: %v\n", err)
		return fmt.Errorf("error applying update: %w", err)
	}
	fmt.Println("Update successfully applied")
	return nil
}
