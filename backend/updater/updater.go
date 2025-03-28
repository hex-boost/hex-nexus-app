package updater

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
)

type Updater struct {
	CurrentVersion string
	UpdateURL      string
	TempDir        string
}

func NewUpdater(version, updateURL string) *Updater {
	tempDir := filepath.Join(os.TempDir(), "hexnexus-updates")
	os.MkdirAll(tempDir, 0755)

	return &Updater{
		CurrentVersion: version,
		UpdateURL:      updateURL,
		TempDir:        tempDir,
	}
}

// CheckForUpdate checks if an update is available
func (u *Updater) CheckForUpdate() (bool, string, error) {
	resp, err := http.Get(u.UpdateURL + "/version.json")
	if err != nil {
		return false, "", err
	}
	defer resp.Body.Close()

	var versionInfo struct {
		Version     string `json:"version"`
		ReleaseDate string `json:"releaseDate"`
		DownloadURL string `json:"downloadUrl"`
		Checksum    string `json:"checksum"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&versionInfo); err != nil {
		return false, "", err
	}

	// Compare versions (simple string comparison or use semver)
	updateAvailable := versionInfo.Version != u.CurrentVersion

	return updateAvailable, versionInfo.Version, nil
}

// DownloadAndInstallUpdate downloads and replaces the executable
func (u *Updater) DownloadAndInstallUpdate() error {
	// Check for update first
	hasUpdate, _, err := u.CheckForUpdate()
	if err != nil {
		return err
	}

	if !hasUpdate {
		return nil // No update needed
	}

	// Get version info again to get download URL
	resp, err := http.Get(u.UpdateURL + "/version.json")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var versionInfo struct {
		Version     string `json:"version"`
		DownloadURL string `json:"downloadUrl"`
		Checksum    string `json:"checksum"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&versionInfo); err != nil {
		return err
	}

	// Download the update
	updatePath := filepath.Join(u.TempDir, "update.exe")
	if err := downloadFile(versionInfo.DownloadURL, updatePath); err != nil {
		return err
	}

	// Verify checksum
	if versionInfo.Checksum != "" {
		checksum, err := calculateSHA256(updatePath)
		if err != nil {
			return err
		}

		if checksum != versionInfo.Checksum {
			return fmt.Errorf("checksum verification failed")
		}
	}

	// Create updater script
	if err := u.createUpdateScript(updatePath); err != nil {
		return err
	}

	return nil
}

func downloadFile(url, destPath string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	out, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}

func calculateSHA256(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

func (u *Updater) createUpdateScript(updatePath string) error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	scriptPath := filepath.Join(u.TempDir, "updater.bat")
	script := fmt.Sprintf(`@echo off
timeout /t 2 /nobreak > NUL
copy /Y "%s" "%s"
start "" "%s"
del "%s"
exit
`, updatePath, exePath, exePath, scriptPath)

	err = os.WriteFile(scriptPath, []byte(script), 0755)
	if err != nil {
		return err
	}

	// Start the updater script
	cmd := exec.Command("cmd", "/C", scriptPath)
	return cmd.Start()
}
