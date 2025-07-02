package updater

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"
	"unsafe"

	"github.com/go-resty/resty/v2"
	updaterUtils "github.com/hex-boost/hex-nexus-app/backend/cmd/updater/utils"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
)

// BackendUpdateStatus contains progress information to send to frontend
type BackendUpdateStatus struct {
	Progress float64 `json:"progress"`
	Error    string  `json:"error,omitempty"`
}

type UpdateManager struct {
	client        *resty.Client
	currentVer    string
	command       *command.Command
	updaterUtils  *updaterUtils.UpdaterUtils
	config        *config.Config
	instanceMutex syscall.Handle

	logger *logger.Logger
	app    *application.App // Added for emitting events
}

func NewUpdateManager(config *config.Config, updaterUtils *updaterUtils.UpdaterUtils, logger *logger.Logger) *UpdateManager {
	return &UpdateManager{
		config:       config,
		updaterUtils: updaterUtils,
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
func (u *UpdateManager) createNamedMutex(name string) (syscall.Handle, error) {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	createMutex := kernel32.NewProc("CreateMutexW")

	namePtr, err := syscall.UTF16PtrFromString(name)
	if err != nil {
		return 0, err
	}

	handle, _, err := createMutex.Call(
		0,                                // lpMutexAttributes
		1,                                // bInitialOwner
		uintptr(unsafe.Pointer(namePtr)), // lpName
	)

	if handle == 0 {
		return 0, err
	}

	return syscall.Handle(handle), nil
}
func (u *UpdateManager) ReleaseMutex() error {
	if u.instanceMutex != 0 {
		kernel32 := syscall.NewLazyDLL("kernel32.dll")
		releaseMutex := kernel32.NewProc("ReleaseMutex")
		closeHandle := kernel32.NewProc("CloseHandle")

		releaseMutex.Call(uintptr(u.instanceMutex))
		closeHandle.Call(uintptr(u.instanceMutex))
		u.instanceMutex = 0
	}
	return nil
}
func (u *UpdateManager) tryAcquireMutex(mutex syscall.Handle, timeout time.Duration) (bool, error) {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	waitForSingleObject := kernel32.NewProc("WaitForSingleObject")

	timeoutMs := uint32(timeout.Milliseconds())
	if timeout == 0 {
		timeoutMs = 0xFFFFFFFF // INFINITE
	}

	result, _, err := waitForSingleObject.Call(
		uintptr(mutex),
		uintptr(timeoutMs),
	)

	switch result {
	case 0: // WAIT_OBJECT_0 - success
		return true, nil
	case 258: // WAIT_TIMEOUT
		return false, nil
	default:
		return false, err
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
func (u *UpdateManager) getLatestVersionWithUpdater(versions []struct {
	Version string
	Updater *struct {
		Url string `json:"url"`
	}
}) (string, error) {
	if len(versions) == 0 {
		return "", fmt.Errorf("no versions available")
	}

	type Version struct {
		versionStr          string
		updaterUrl          string
		major, minor, patch int
	}

	var validVersions []Version

	// Parse and filter versions that have updaters
	for _, v := range versions {
		if v.Updater == nil {
			continue
		}

		parts := strings.Split(v.Version, ".")
		if len(parts) != 3 {
			continue
		}

		major, err1 := strconv.Atoi(parts[0])
		minor, err2 := strconv.Atoi(parts[1])
		patch, err3 := strconv.Atoi(parts[2])

		if err1 != nil || err2 != nil || err3 != nil {
			continue
		}

		validVersions = append(validVersions, Version{
			versionStr: v.Version,
			updaterUrl: v.Updater.Url,
			major:      major,
			minor:      minor,
			patch:      patch,
		})
	}

	if len(validVersions) == 0 {
		return "", fmt.Errorf("no versions with updaters found")
	}

	// Sort versions in descending order (highest first)
	sort.Slice(validVersions, func(i, j int) bool {
		if validVersions[i].major != validVersions[j].major {
			return validVersions[i].major > validVersions[j].major
		}
		if validVersions[i].minor != validVersions[j].minor {
			return validVersions[i].minor > validVersions[j].minor
		}
		return validVersions[i].patch > validVersions[j].patch
	})

	// Return the URL of the highest version with updater
	return validVersions[0].updaterUrl, nil
}

// CheckAndDownloadUpdater ensures the updater.exe exists, downloads it if missing
func (u *UpdateManager) CheckAndDownloadUpdater() error {
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}

	execPath, err = filepath.Abs(execPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute executable path: %w", err)
	}

	parentPath := filepath.Dir(execPath)
	updaterPath := filepath.Join(filepath.Dir(parentPath), "updater.exe")

	// Check if updater already exists
	if _, err := os.Stat(updaterPath); err == nil {
		u.logger.Info("Updater already exists", zap.String("path", updaterPath))
		return nil
	}

	u.logger.Info("Updater not found, downloading...", zap.String("path", updaterPath))

	// Download updater
	return u.downloadUpdater(updaterPath)
}

// downloadUpdater downloads the updater executable from the API
func (u *UpdateManager) downloadUpdater(targetPath string) error {
	// Get updater download information
	resp, err := u.client.R().Get(fmt.Sprintf("%s/api/versions?populate=*", u.config.BackendURL))
	if err != nil {
		u.logger.Error("Failed to get updater information", zap.Error(err))
		return fmt.Errorf("failed to get updater information: %w", err)
	}

	var updaterResp VersionResponse

	if err := json.Unmarshal(resp.Body(), &updaterResp); err != nil {
		u.logger.Error("Failed to parse updater information", zap.Error(err))
		return fmt.Errorf("failed to parse updater information: %w", err)
	}

	// Convert to format expected by GetLatestVersionWithUpdater
	versions := make([]struct {
		Version string
		Updater *struct {
			Url string `json:"url"`
		}
	}, len(updaterResp.Data))

	for i, item := range updaterResp.Data {
		versions[i].Version = item.Version
		if item.Updater != nil {
			versions[i].Updater = &struct {
				Url string `json:"url"`
			}{
				Url: item.Updater.Url,
			}
		}
	}

	// Find the highest version with updater available
	fileURL, err := u.getLatestVersionWithUpdater(versions)
	if err != nil {
		u.logger.Error("No updater found", zap.Error(err))
		return fmt.Errorf("no updater found: %w", err)
	}

	// Add base domain if needed
	if fileURL[0] == '/' {
		fileURL = u.config.BackendURL + fileURL
	}

	u.logger.Info("Downloading updater from", zap.String("url", fileURL))

	// Download updater
	respDownload, err := u.client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		u.logger.Error("Failed to download updater", zap.Error(err))
		return fmt.Errorf("failed to download updater: %w", err)
	}
	defer respDownload.RawBody().Close()

	// Ensure target directory exists
	targetDir := filepath.Dir(targetPath)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		u.logger.Error("Failed to create target directory", zap.Error(err))
		return fmt.Errorf("failed to create target directory: %w", err)
	}

	// Create the target file
	outFile, err := os.Create(targetPath)
	if err != nil {
		u.logger.Error("Failed to create updater file", zap.Error(err))
		return fmt.Errorf("failed to create updater file: %w", err)
	}
	defer outFile.Close()

	// Copy the downloaded content
	written, err := io.Copy(outFile, respDownload.RawBody())
	if err != nil {
		u.logger.Error("Failed to save updater file", zap.Error(err))
		return fmt.Errorf("failed to save updater file: %w", err)
	}

	// Ensure file is written to disk
	outFile.Sync()

	u.logger.Info("Downloaded updater successfully",
		zap.String("path", targetPath),
		zap.Int64("bytes", written))

	return nil
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

	if err := os.MkdirAll(newAppDir, 0o755); err != nil {
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

	if err = os.WriteFile(targetPath, source, 0o755); err != nil {
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

	_, err = u.command.Start(appPath)
	if err != nil {
		u.logger.Error("Failed to start application", zap.Error(err))
		return err
	}

	return nil // This line is never reached but needed for compiler
}

func (u *UpdateManager) IsAnotherInstanceRunning() bool {
	mutexName := "Global\\NexusAppMutex"

	// Platform-specific mutex creation
	mutex, err := u.createNamedMutex(mutexName)
	if err != nil {
		u.logger.Error("Failed to create mutex", zap.Error(err))
		return true
	}

	// Try to acquire mutex
	acquired, err := u.tryAcquireMutex(mutex, 100*time.Millisecond)
	if err != nil || !acquired {
		return true
	}

	// Store mutex reference for cleanup
	u.instanceMutex = mutex
	return false
}

func (u *UpdateManager) StartUpdate() error {
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}

	execPath, err = filepath.Abs(execPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute executable path: %w", err)
	}

	parentPath := filepath.Dir(execPath)
	updatePath := filepath.Join(filepath.Dir(parentPath), "updater.exe")

	if _, err := os.Stat(updatePath); os.IsNotExist(err) {
		alternativePath := filepath.Join(filepath.Dir(parentPath), "updater.exe")
		if _, err := os.Stat(alternativePath); err == nil {
			updatePath = alternativePath
		} else {
			return fmt.Errorf("updater.exe not found at either %s or %s", updatePath, alternativePath)
		}
	}

	_, err = u.command.Start(updatePath, execPath)
	if err != nil {
		return fmt.Errorf("failed to start update process: %w", err)
	}

	// Release mutex before exiting
	err = u.ReleaseMutex()
	if err != nil {
		u.logger.Error("Failed to release mutex", zap.Error(err))
		return fmt.Errorf("failed to release mutex: %w", err)
	}

	os.Exit(0)
	return nil
}
