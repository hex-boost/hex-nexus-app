package updater

import (
	"encoding/json"
	"fmt"
	"github.com/fynelabs/selfupdate"
	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"go.uber.org/zap"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

var (
	BackendURL = "https://nexus-back.up.railway.app"
)

type Updater struct {
	config *config.Config
	log    *utils.Logger
	utils  *utils.Utils
}

func NewUpdater(cfg *config.Config, log *utils.Logger) *Updater {
	return &Updater{
		utils:  utils.NewUtils(),
		config: cfg,
		log:    log,
	}
}

type Response struct {
	NeedsUpdate bool   `json:"needsUpdate"`
	Version     string `json:"version"`
}

func (u *Updater) Start() {

	if u.config.Version == "dev" {
		u.log.Info("Running in development mode, skipping update check")
		return
	}
	u.log.Info("Checking for updates. Current version: " + u.config.Version)
	response, err := u.CheckForUpdates()
	if err != nil {
		u.log.Error("Error checking for updates: %v", zap.Error(err))
		return
	}
	if response != nil {
		u.log.Sugar().Infoln("Server response: update needed=%t, available version=%s",
			response.NeedsUpdate, response.Version)
		if response.NeedsUpdate {
			u.log.Info("Starting update process to version " + response.Version)
			err := u.UpdateAndRestart()
			if err != nil {
				u.log.Error("Update failed: %v", zap.Error(err))
				return
			}
			u.log.Info("Update completed successfully. Restarting application.")
			os.Exit(0)
		} else {
			u.log.Info("The application is up to date.")
		}
	} else {
		u.log.Warn("Empty response from update server")
	}
	u.log.Info("Checking for .old files to clean up")
	execPath, err := os.Executable()
	if err != nil {
		u.log.Error("Failed to get executable path: %v", zap.Error(err))
		return
	}
	execDir := filepath.Dir(execPath)
	oldFiles, err := filepath.Glob(filepath.Join(execDir, "*.old"))
	if err != nil {
		u.log.Error("Failed to scan for .old files: %v", zap.Error(err))
		return
	}
	for _, oldFile := range oldFiles {
		u.log.Info("Removing old file", zap.Any("Old file", oldFile))

		if err := os.Remove(oldFile); err != nil {
			u.log.Sugar().Infoln("Failed to remove %s: %v", oldFile, err)
		}
	}
	if len(oldFiles) > 0 {
		u.log.Sugar().Infoln("Cleaned up %d .old files", len(oldFiles))
	} else {
		u.log.Info("No .old files found")
	}

}
func (u *Updater) CheckForUpdates() (*Response, error) {
	client := resty.New()
	var result Response
	strapiURL := fmt.Sprintf("%s/api/versions/update", u.config.BackendURL)

	resp, err := client.R().
		SetHeader("x-client-version", u.config.Version).
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
	cmd = u.utils.HideConsoleWindow(cmd)
	if err := cmd.Start(); err != nil {
		return err
	}
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
