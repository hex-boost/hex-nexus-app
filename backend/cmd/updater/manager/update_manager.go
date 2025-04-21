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
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"

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

	u.logger.Info("Downloading update from", zap.String("url", fileURL))

	// Download update
	u.emitProgress(20, "")
	respDownload, err := u.client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		u.emitProgress(0, "Failed to download update")
		return "", "", err
	}

	// Create a temp file for the download with .exe extension
	tempDir, err := os.MkdirTemp("", "nexus-update-*")
	if err != nil {
		u.emitProgress(0, "Failed to create temporary directory")
		return "", "", err
	}

	tempFile := filepath.Join(tempDir, "Nexus.exe")
	outFile, err := os.Create(tempFile)
	if err != nil {
		u.emitProgress(0, "Failed to create temporary file")
		return "", "", err
	}
	defer outFile.Close()

	// Extract and save binary
	binReader := respDownload.RawBody()
	defer binReader.Close()

	// Update progress during download
	u.emitProgress(40, "")

	written, err := io.Copy(outFile, binReader)
	if err != nil {
		u.emitProgress(0, "Failed to save update file")
		return "", "", err
	}

	// Log download size for debugging
	u.logger.Info("Downloaded update file", zap.Int64("bytes", written))

	// Make sure file is written to disk
	outFile.Sync()
	outFile.Close()

	u.emitProgress(50, "")
	return tempFile, versionResp.LatestVersion.Version, nil
}

func (u *UpdateManager) Exit() {
	os.Exit(0)
}

// InstallUpdate installs the downloaded update
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

	// Remove existing directory if it exists
	if _, err := os.Stat(newAppDir); err == nil {
		if err := os.RemoveAll(newAppDir); err != nil {
			u.emitProgress(0, "Failed to clean existing directory")
			return err
		}
	}

	if err := os.MkdirAll(newAppDir, 0755); err != nil {
		u.emitProgress(0, "Failed to create installation directory")
		return err
	}

	// Target path for the new executable
	targetPath := filepath.Join(newAppDir, "Nexus.exe")

	u.emitProgress(75, "")

	// Log file sizes for debugging
	sourceInfo, err := os.Stat(downloadPath)
	if err != nil {
		u.logger.Error("Failed to stat source file", zap.Error(err))
		u.emitProgress(0, "Failed to verify update file")
		return err
	}

	u.logger.Info("Copying update",
		zap.String("from", downloadPath),
		zap.String("to", targetPath),
		zap.Int64("size", sourceInfo.Size()))

	// Copy file with OS-specific commands to ensure binary integrity
	source, err := os.ReadFile(downloadPath)
	if err != nil {
		u.emitProgress(0, "Failed to read update file")
		return err
	}

	if err = os.WriteFile(targetPath, source, 0755); err != nil {
		u.emitProgress(0, "Failed to write update file")
		return err
	}

	// Verify the file was copied correctly
	targetInfo, err := os.Stat(targetPath)
	if err != nil {
		u.logger.Error("Failed to verify installed file", zap.Error(err))
	} else {
		u.logger.Info("Update installed",
			zap.String("path", targetPath),
			zap.Int64("size", targetInfo.Size()))

		if sourceInfo.Size() != targetInfo.Size() {
			u.logger.Error("Size mismatch in installed file",
				zap.Int64("source", sourceInfo.Size()),
				zap.Int64("target", targetInfo.Size()))
		}
	}

	// Clean up the temp file and directory
	os.Remove(downloadPath)
	os.RemoveAll(filepath.Dir(downloadPath))

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

	return nil // This line is never reached but needed for compiler
}

func (u *UpdateManager) IsAnotherInstanceRunning() bool {

	// Option 1: Check for a lock file
	lockFilePath := filepath.Join(os.TempDir(), "Nexus.lock")

	// Try to create/open the lock file
	file, err := os.OpenFile(lockFilePath, os.O_CREATE|os.O_EXCL|os.O_RDWR, 0666)
	if err != nil {
		// If we can't create the file, another instance is likely running
		return true
	}

	// If we created the file, clean it up when the app exits
	pid := os.Getpid()
	_, err = fmt.Fprintf(file, "%d", pid)
	if err != nil {
		file.Close()
		return false
	}

	// Set up cleanup on program exit
	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt, syscall.SIGTERM)
		<-c
		os.Remove(lockFilePath)
		os.Exit(0)
	}()

	return false
}
