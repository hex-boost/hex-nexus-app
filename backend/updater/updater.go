package updater

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/fynelabs/selfupdate"
	"github.com/go-resty/resty/v2"
)

var (
	Version    = "development"
	BackendURL = "https://nexus-back.up.railway.app"
	APIToken   = "e5bd04e90e05b51937ba00e4a43ae8fe91e722db62b4d616ee7bd692dbdc28f603595c207716c8e662392d3b83b67b1057bf002701edb5edadd0f2061ae7ad83e43e67d0b64aff715b7289af290c22d846400756ac63f23c069e73a4bd4eb81738ed6c8862d0aec0c67e80c29a3027fdf60d174066244ef532b25a5d3509020e"
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
		SetResult(&result).
		Get(strapiURL)
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, fmt.Errorf("API returned status: %d for %s", resp.StatusCode(), strapiURL)
	}
	return &result, nil
}

func (u *Updater) LogBuildInfo(filepath string) error {
	info := fmt.Sprintf("Versão: %s\nBackendURL: %s\nAPIToken: %s\nData de verificação: %s\n",
		Version, BackendURL, APIToken, time.Now().Format(time.RFC3339))

	return os.WriteFile(filepath, []byte(info), 0644)
}

func (u *Updater) UpdateAndRestart() error {
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("erro ao obter caminho do executável: %w", err)
	}
	realPath, err := filepath.EvalSymlinks(execPath)
	if err != nil {
		return fmt.Errorf("erro ao resolver symlink: %w", err)
	}
	backupPath := realPath + ".bak"
	if err := os.Rename(realPath, backupPath); err != nil {
		return fmt.Errorf("erro ao criar backup: %w", err)
	}
	if err := u.Update(); err != nil {
		os.Rename(backupPath, realPath)
		return fmt.Errorf("erro na atualização: %w", err)
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
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP}
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
	fmt.Println("Creating temporary file...")
	tempFile, err := os.CreateTemp("", "nexus_update_*.bin")
	if err != nil {
		fmt.Printf("Error creating temporary file: %v\n", err)
		return fmt.Errorf("error creating temporary file: %w", err)
	}
	fmt.Printf("Temporary file created: %s\n", tempFile.Name())
	defer os.Remove(tempFile.Name())
	fmt.Println("Writing update data to temporary file...")
	fileSize, err := io.Copy(tempFile, binReader)
	if err != nil {
		fmt.Printf("Error writing update data: %v\n", err)
		return fmt.Errorf("error writing temporary file: %w", err)
	}
	if fileSize == 0 {
		fmt.Println("Error: update file is empty")
		return fmt.Errorf("update file is empty")
	}
	fmt.Printf("Downloaded update file: %d bytes\n", fileSize)
	if _, err := tempFile.Seek(0, 0); err != nil {
		fmt.Printf("Error repositioning file: %v\n", err)
		return fmt.Errorf("error repositioning file: %w", err)
	}
	fmt.Println("Applying update...")
	err = selfupdate.Apply(tempFile, selfupdate.Options{})
	if err != nil {
		fmt.Printf("Error applying update: %v\n", err)
		return fmt.Errorf("error applying update: %w", err)
	}
	fmt.Println("Update successfully applied")
	return nil
}
