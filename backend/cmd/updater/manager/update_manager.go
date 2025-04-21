package manager

import (
	"encoding/json"
	"fmt"
	updaterUtils "github.com/hex-boost/hex-nexus-app/backend/cmd/updater/utils"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/go-resty/resty/v2"
)

// BackendUpdateStatus contains progress information to send to frontend
type BackendUpdateStatus struct {
	Progress float64 `json:"progress"`
	Error    string  `json:"error,omitempty"`
}

type UpdateManager struct {
	client       *resty.Client
	currentVer   string
	updaterUtils *updaterUtils.UpdaterUtils
	config       *config.Config
	logger       *utils.Logger
	app          *application.App // Added for emitting events
}

func NewUpdateManager(config *config.Config, utils *updaterUtils.UpdaterUtils, logger *utils.Logger) *UpdateManager {
	return &UpdateManager{
		config:       config,
		updaterUtils: utils,
		logger:       logger,
		client:       resty.New(),
	}
}

// emitProgress sends progress updates to the frontend
func (u *UpdateManager) emitProgress(progress float64, errorMsg string) {
	if u.app != nil {
		u.app.EmitEvent("updater:status-change", BackendUpdateStatus{
			Progress: progress,
			Error:    errorMsg,
		})
	}
}

// CheckForUpdates verifies if an update is needed and returns the result
func (u *UpdateManager) CheckForUpdates() (bool, string) {
	// Get current version from the application directory
	appDir, err := u.updaterUtils.GetLatestAppDir()
	if err == nil {
		dirName := filepath.Base(appDir)
		if strings.HasPrefix(dirName, "app-") {
			u.currentVer = strings.TrimPrefix(dirName, "app-")
		} else {
			// Fallback to the version from config
			u.currentVer = u.config.Version
		}
	} else {
		u.currentVer = u.config.Version
	}

	// Check for update
	resp, err := u.client.R().
		SetHeader("x-client-version", u.currentVer).
		Get(fmt.Sprintf("%s/api/versions/update", u.config.BackendURL))

	if err != nil {
		u.emitProgress(0, "Error connecting to server")
		return false, ""
	}

	var result struct {
		NeedsUpdate bool   `json:"needsUpdate"`
		Version     string `json:"version"`
	}

	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		u.emitProgress(0, "Error processing server response")
		return false, ""
	}

	// Just return data without managing UI state
	return result.NeedsUpdate, result.Version
}

// DownloadUpdate downloads the latest update and returns the path and version
func (u *UpdateManager) DownloadUpdate() (downloadPath string, version string, err error) {
	// Get update information
	resp, err := u.client.R().Get(fmt.Sprintf("%s/api/versions/latest", u.config.BackendURL))
	if err != nil {
		u.emitProgress(0, "Failed to get update information")
		return "", "", err
	}

	var versionResp struct {
		LatestVersion struct {
			Version string `json:"version"`
			File    struct {
				URL string `json:"url"`
			} `json:"file"`
		} `json:"latestVersion"`
	}

	if err := json.Unmarshal(resp.Body(), &versionResp); err != nil {
		u.emitProgress(0, "Failed to parse update information")
		return "", "", err
	}

	fileURL := versionResp.LatestVersion.File.URL
	if fileURL == "" {
		u.emitProgress(0, "Update URL not found")
		return "", "", fmt.Errorf("update URL not found")
	}

	// Add base domain if needed
	if fileURL[0] == '/' {
		fileURL = u.config.BackendURL + fileURL
	}

	// Download update
	u.emitProgress(20, "")
	respDownload, err := u.client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		u.emitProgress(0, "Failed to download update")
		return "", "", err
	}

	// Create a temp file for the download
	tempFile, err := os.CreateTemp("", "nexus-update-*.exe")
	if err != nil {
		u.emitProgress(0, "Failed to create temporary file")
		return "", "", err
	}
	defer tempFile.Close()

	// Extract and save binary
	binReader := respDownload.RawBody()
	defer binReader.Close()

	// Update progress during download
	u.emitProgress(40, "")

	if _, err = io.Copy(tempFile, binReader); err != nil {
		u.emitProgress(0, "Failed to save update file")
		return "", "", err
	}

	u.emitProgress(50, "")
	return tempFile.Name(), versionResp.LatestVersion.Version, nil
}

// InstallUpdate installs the downloaded update
func (u *UpdateManager) InstallUpdate(downloadPath string, version string) error {
	u.emitProgress(60, "")

	// Create destination directory
	baseDir, err := updaterUtils.ExecutableFn()
	if err != nil {
		u.emitProgress(0, "Failed to determine installation directory")
		return err
	}

	baseDir = filepath.Dir(baseDir)
	newAppDir := filepath.Join(baseDir, "app-"+version)

	if err := os.MkdirAll(newAppDir, 0755); err != nil {
		u.emitProgress(0, "Failed to create installation directory")
		return err
	}

	// Save the new executable
	targetPath := filepath.Join(newAppDir, "Nexus.exe")

	u.emitProgress(75, "")

	// Copy from the temp file to the destination
	source, err := os.Open(downloadPath)
	if err != nil {
		u.emitProgress(0, "Failed to access update file")
		return err
	}
	defer source.Close()

	outFile, err := os.Create(targetPath)
	if err != nil {
		u.emitProgress(0, "Failed to create destination file")
		return err
	}
	defer outFile.Close()

	if _, err = io.Copy(outFile, source); err != nil {
		u.emitProgress(0, "Failed to copy update")
		return err
	}

	// Clean up the temp file
	os.Remove(downloadPath)

	u.emitProgress(100, "")
	return nil
}

// StartMainApplication starts the main application executable
func (u *UpdateManager) StartMainApplication(exeName string) error {
	appDir, err := u.updaterUtils.GetLatestAppDir()
	if err != nil {
		u.logger.Error("Failed to determine app directory", zap.Error(err))
		return err
	}

	appPath := filepath.Join(appDir, exeName)
	cmd := exec.Command(appPath)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		u.logger.Error("Failed to start application", zap.Error(err))
		return err
	}

	// Exit this process after starting the main app
	os.Exit(0)
	return nil // This line is never reached but needed for compiler
}
