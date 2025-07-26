package lolskin

import (
	"archive/zip"
	"bufio"
	"bytes"
	"embed"
	"encoding/json"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"go.uber.org/zap"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type LolSkin struct {
	modToolsExe     embed.FS
	csLolDLL        embed.FS
	game            string
	mutex           sync.Mutex
	logger          *logger.Logger
	patcherProcess  *exec.Cmd
	patcherStdin    *os.File
	onStatusChanged func(string)

	tempDir string // new field to store the temp directory
}

// CSLOLState represents the different states of the tool

// Platform-specific constants
const ModToolsExe = "mod-tools.exe"
const CsLolDLL = "cslol-dll.dll"

func New(logger *logger.Logger, leaguePath string, catalog, csLolDLL, modToolsExe embed.FS) *LolSkin {
	// Create a temporary directory for our extracted files

	exePath, err := os.Executable()
	if err != nil {
		fmt.Printf("Failed to get executable path: %v\n", err)
		return nil
	}

	// Get parent directory of the executable
	parentDir := filepath.Dir(filepath.Dir(exePath))

	// Create the lolskin directory in the parent directory
	tempDir := filepath.Join(parentDir, "lolskin")
	err = os.MkdirAll(tempDir, 0755) // Using MkdirAll to create intermediate directories if needed
	if err != nil {
		fmt.Printf("Failed to create directory: %v\n", err)
		return nil
	}
	// Extract the mod-tools.exe to the temp directory
	lolskin := &LolSkin{
		logger:      logger,
		modToolsExe: modToolsExe,
		csLolDLL:    csLolDLL,
		game:        leaguePath,
		tempDir:     tempDir,
	}

	err = lolskin.extractModTools()
	if err != nil {
		fmt.Printf("Failed to extract mod tools: %v\n", err)
		os.RemoveAll(tempDir)
		panic("error extracting mod tools")
	}

	// Create necessary directories
	os.MkdirAll(filepath.Join(tempDir, "installed"), 0755)
	os.MkdirAll(filepath.Join(tempDir, "profiles"), 0755)

	return lolskin
}

// Helper to extract the mod tools executable
func (c *LolSkin) extractModTools() error {
	exeData, err := c.modToolsExe.ReadFile(fmt.Sprintf("backend/assets/mod-tools/%s", ModToolsExe))
	if err != nil {
		return fmt.Errorf("failed to read embedded mod-tools.exe: %w", err)
	}

	exePath := filepath.Join(c.tempDir, ModToolsExe)
	err = os.WriteFile(exePath, exeData, 0755) // 0755 makes it executable
	if err != nil {

		return fmt.Errorf("failed to write mod-tools.exe to temp directory: %w", err)

	}

	csLolDLL, err := c.csLolDLL.ReadFile(fmt.Sprintf("backend/assets/mod-tools/%s", CsLolDLL))
	if err != nil {
		return fmt.Errorf("failed to read embedded mod-tools.exe: %w", err)
	}
	csLolPath := filepath.Join(c.tempDir, CsLolDLL)
	err = os.WriteFile(csLolPath, csLolDLL, 0755) // 0755 makes it executable
	if err != nil {
		return fmt.Errorf("failed to write cslol-dll.dll to temp directory: %w", err)
	}

	return nil
}

func (c *LolSkin) changeLeaguePath() {

	// Canonicalize the League path
	gameDir := filepath.Dir(c.game)
	if _, err := os.Stat(filepath.Join(gameDir, "League of Legends.exe")); err == nil {
		c.game = filepath.Join(gameDir, "League of Legends.exe")
	}
}

// StopRunningPatcher safely stops any running patcher process
func (c *LolSkin) StopRunningPatcher() {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	c.logger.Info("StopRunningPatcher called")

	if c.patcherProcess == nil {
		c.logger.Info("No patcher process running, nothing to stop")
		return
	}

	var pid int
	if c.patcherProcess.Process != nil {
		pid = c.patcherProcess.Process.Pid
	}
	c.logger.Info("Attempting to stop patcher process", zap.Int("pid", pid))

	// Try graceful termination first
	if c.patcherStdin != nil {
		c.logger.Info("Sending termination signal via stdin", zap.Int("pid", pid))
		if _, err := c.patcherStdin.Write([]byte("\n")); err != nil {
			c.logger.Warn("Failed to write to patcher stdin", zap.Error(err))
		}
	} else {
		c.logger.Info("No stdin pipe available for graceful termination")
	}

	// Wait for a moment to let the process terminate gracefully
	c.logger.Info("Waiting for graceful termination", zap.Duration("timeout", 500*time.Millisecond))
	time.Sleep(500 * time.Millisecond)

	// Force kill if still running
	if c.patcherProcess != nil && c.patcherProcess.Process != nil {
		c.logger.Info("Process still running, forcing termination", zap.Int("pid", pid))
		if err := c.patcherProcess.Process.Kill(); err != nil {
			c.logger.Error("Failed to kill patcher process", zap.Error(err), zap.Int("pid", pid))
		} else {
			c.logger.Info("Successfully killed patcher process", zap.Int("pid", pid))
		}

		c.patcherProcess = nil
		c.patcherStdin = nil
	}

	c.logger.Info("Patcher stopped, state set to idle")
}
func (c *LolSkin) InjectFantome(mods []string) error {

	// Change League Path
	c.changeLeaguePath()

	gameDir := filepath.Dir(c.game)
	profileName := "Default Profile" // Always use the same profile

	// Create log file
	logFile, _ := os.Create(filepath.Join(c.tempDir, "mod-tools-log.txt"))
	if logFile != nil {
		defer logFile.Close()
		fmt.Fprintf(logFile, "==== CSLOL TOOLS LOG ====\n")
		fmt.Fprintf(logFile, "Time: %s\n", time.Now().Format(time.RFC3339))
		fmt.Fprintf(logFile, "Game path: %s\n", gameDir)
		fmt.Fprintf(logFile, "Mods: %s\n", strings.Join(mods, ", "))
	}

	// Write default profile with selected mods
	c.writeCurrentProfile(profileName)

	profileFile, _ := os.Create(filepath.Join(c.tempDir, "profiles", profileName+".profile"))
	if profileFile != nil {
		for _, mod := range mods {
			profileFile.WriteString(mod + "\n")
		}
		profileFile.Close()
	}

	// Create overlay with all selected mods
	overlayArgs := []string{
		"mkoverlay",
		filepath.Join(c.tempDir, "installed"),
		filepath.Join(c.tempDir, "profiles", profileName),
		"--game:" + gameDir,
	}

	if len(mods) > 0 {
		overlayArgs = append(overlayArgs, "--mods:"+strings.Join(mods, "/"))
	}

	if err := c.executeCommand(ModToolsExe, overlayArgs, "OVERLAY", logFile); err != nil {

		return err
	}

	// Run the patcher
	patcherArgs := []string{
		"runoverlay",
		filepath.Join(c.tempDir, "profiles", profileName),
		filepath.Join(c.tempDir, "profiles", profileName+".config"),
		"--game:" + gameDir,
		"--opts:none",
	}

	c.runPatcher(patcherArgs)
	return nil
}

func (c *LolSkin) executeCommand(executable string, args []string, logPrefix string, logFile *os.File) error {
	execPath := filepath.Join(c.tempDir, executable)

	c.logger.Debug("Executing command", zap.String("executable", execPath), zap.Strings("args", args))

	if logFile != nil {
		fmt.Fprintf(logFile, "\n==== %s COMMAND ====\n", logPrefix)
		fmt.Fprintf(logFile, "Command: %s\n", execPath)
		fmt.Fprintf(logFile, "Arguments: %v\n", args)
	}
	commander := command.New()
	cmd := commander.Exec(execPath, args...)

	// Capture output
	var stdoutBuf, stderrBuf bytes.Buffer
	stdoutWriter := io.MultiWriter(&stdoutBuf, logFile)
	stderrWriter := io.MultiWriter(&stderrBuf, logFile)

	cmd.Stdout = stdoutWriter
	cmd.Stderr = stderrWriter

	if err := cmd.Run(); err != nil {
		errMsg := stderrBuf.String()
		c.logger.Error("Command execution failed",
			zap.String("executable", execPath),
			zap.Strings("args", args),
			zap.Error(err),
			zap.String("stderr", errMsg))
		return fmt.Errorf("command failed: %v - %s", err, errMsg)
	}

	// Log the output
	c.logger.Info("Command output", zap.String("stdout", stdoutBuf.String()))

	return nil
}

// RunPatcher starts the patcher process with the specified arguments
// RunPatcher starts the patcher process with the specified arguments
// Returns a channel that receives a signal when the injection is successful
func (c *LolSkin) runPatcher(args []string) {
	// Create a completion channel
	completed := make(chan struct{})

	// Create the command
	execPath := filepath.Join(c.tempDir, ModToolsExe)
	commander := command.New()
	c.patcherProcess = commander.Exec(execPath, args...)

	c.logger.Info("Starting patcher process", zap.String("executable", execPath), zap.Strings("args", args))

	// Set up pipes
	stdout, _ := c.patcherProcess.StdoutPipe()
	stderr, _ := c.patcherProcess.StderrPipe()
	stdin, _ := c.patcherProcess.StdinPipe()
	c.patcherStdin = stdin.(*os.File)

	// Monitor stdout
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			c.logger.Info("Patcher output", zap.String("message", line))

			// Check for successful completion message
			if strings.Contains(line, "Waiting for league match to start") {
				c.logger.Info("Successfully injected all skins")
				close(completed)
				return
			}
		}
	}()

	// Monitor stderr
	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := scanner.Text()
			c.logger.Error("Patcher error", zap.String("message", line))
		}
	}()

	// Start the process
	err := c.patcherProcess.Start()
	if err != nil {
		errorDetails := fmt.Sprintf("arguments:\n  %s\n", strings.Join(args, "\n  "))
		c.logger.Error("Failed to start patcher", zap.Error(err), zap.String("details", errorDetails))
		close(completed)
		return
	}

	// Wait for process completion
	go func() {
		processToWait := c.patcherProcess
		if processToWait == nil {
			return // Process was already cleaned up
		}

		err := processToWait.Wait()
		if err != nil {
			// Avoid logging "exec: not started" if the process was killed intentionally
			if exitErr, ok := err.(*exec.ExitError); !ok || !strings.Contains(exitErr.Error(), "killed") {
				c.logger.Error("Patcher process failed", zap.Error(err))
			}
		}
		c.logger.Info("Patcher process completed")

		c.mutex.Lock()
		// Only clear the main struct's fields if they still refer to the same process
		if c.patcherProcess == processToWait {
			c.patcherProcess = nil
			c.patcherStdin = nil
		}
		c.mutex.Unlock()
	}()
	// Wait for completion signal or timeout
	select {
	case <-completed:
		// Successful injection, we can return now
		return
	case <-time.After(30 * time.Second):
		// Timeout waiting for success message
		c.logger.Warn("Timeout waiting for successful injection")
		return
	}
}

// StopProfile terminates the injection process
func (c *LolSkin) StopProfile() {
	c.mutex.Lock()
	if c.patcherStdin != nil {
		c.patcherStdin.Write([]byte("\n"))
	}
	c.mutex.Unlock()
}

// Cleanup removes the temporary directory
func (c *LolSkin) Cleanup() {
	if c.tempDir != "" {
		os.RemoveAll(c.tempDir)
	}
}

// Helper methods

func (c *LolSkin) writeCurrentProfile(profile string) {
	file, err := os.Create(filepath.Join(c.tempDir, "current.profile"))
	if err != nil {
		return
	}
	defer file.Close()
	file.WriteString(profile + "\n")
}
func (c *LolSkin) loadCatalog(path string) (*Catalog, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open catalog file: %v", err)
	}
	defer file.Close()

	var catalog Catalog
	if err := json.NewDecoder(file).Decode(&catalog); err != nil {
		return nil, fmt.Errorf("failed to parse catalog: %v", err)
	}

	return &catalog, nil
}

func (c *LolSkin) DownloadSkins(championID int32, skinID int32) (string, error) {
	// Get champion and skin names from ID
	championData, skinName, err := c.resolveChampionAndSkinData(championID, skinID)
	if err != nil {
		return "", fmt.Errorf("failed to resolve names: %w", err)
	}

	// Define the direct path in the installed folder
	installedPath := filepath.Join(c.tempDir, "installed", skinName)

	// Check if the skin folder already exists in installed directory
	if _, err := os.Stat(installedPath); err == nil {
		c.logger.Info("Using already installed skin",
			zap.Int32("championId", championID),
			zap.Int32("skinId", skinID),
			zap.String("path", installedPath))
		return skinName, nil
	}

	// Create temp directory for download
	tempDownloadDir := filepath.Join(c.tempDir, "temp_downloads")
	if err := os.MkdirAll(tempDownloadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create temp download directory: %w", err)
	}

	zipFilePath := filepath.Join(tempDownloadDir, skinName+".zip")

	// Download the zip file
	downloadUrl := fmt.Sprintf("https://github.com/darkseal-org/lol-skins/raw/main/skins/%s/%s.zip",
		url.PathEscape(championData.Name), url.PathEscape(skinName))

	c.logger.Info("Downloading skin zip",
		zap.String("champion", championData.Name),
		zap.String("skin", skinName),
		zap.String("url", downloadUrl))

	// Create the download request
	resp, err := http.Get(downloadUrl)
	if err != nil {
		return "", fmt.Errorf("failed to download: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("bad status: %s", resp.Status)
	}

	// Create the zip file
	out, err := os.Create(zipFilePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer out.Close()

	// Write the file
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	// Extract directly to installed folder
	if err := c.extractZip(zipFilePath, installedPath); err != nil {
		return "", fmt.Errorf("failed to extract zip: %w", err)
	}

	// Clean up the temporary zip file
	os.Remove(zipFilePath)

	c.logger.Info("Successfully downloaded and extracted skin",
		zap.String("champion", championData.Name),
		zap.String("skin", skinName))

	// Return just the skin name instead of the full path
	return skinName, nil
}

// Helper function to extract a zip file
func (c *LolSkin) extractZip(zipPath, destPath string) error {
	// Open the zip file
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close()

	// Create the destination directory
	if err := os.MkdirAll(destPath, 0755); err != nil {
		return err
	}

	// Extract each file
	for _, file := range r.File {
		rc, err := file.Open()
		if err != nil {
			return err
		}
		defer rc.Close()

		path := filepath.Join(destPath, file.Name)

		if file.FileInfo().IsDir() {
			os.MkdirAll(path, 0755)
		} else {
			// Create the file
			os.MkdirAll(filepath.Dir(path), 0755)
			f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
			if err != nil {
				return err
			}
			defer f.Close()

			// Copy the file contents
			_, err = io.Copy(f, rc)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// Helper to resolve champion and skin names from DataDragon
type ChampionData struct {
	ID    string
	Name  string
	Skins []struct {
		ID   string
		Name string
		Num  int
	}
}

func (c *LolSkin) resolveChampionAndSkinData(championID int32, skinID int32) (*ChampionData, string, error) {
	// Create a cache if needed for DataDragon data
	cachePath := filepath.Join(c.tempDir, "dataDragon")
	os.MkdirAll(cachePath, 0755)

	// Check for cached data first
	cacheFile := filepath.Join(cachePath, "champion_data.json")
	var champions map[string]ChampionData

	// Try to load from cache
	data, err := os.ReadFile(cacheFile)
	if err == nil {
		if err := json.Unmarshal(data, &champions); err == nil {
			// Find champion by ID
			for _, champion := range champions {
				if champion.ID == fmt.Sprint(championID) {
					// Find skin by num
					skinNum := int(skinID) % 1000 // Remove champion base ID
					for _, skin := range champion.Skins {
						if skin.Num == skinNum {
							return &champion, skin.Name, nil
						}
					}
				}
			}
		}
	}

	// If cache doesn't exist or champion/skin not found, fetch from DataDragon API
	c.logger.Info("Fetching champion data from DataDragon API")

	// Get latest version first
	versionURL := "https://ddragon.leagueoflegends.com/api/versions.json"
	vResp, err := http.Get(versionURL)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get versions: %w", err)
	}
	defer vResp.Body.Close()

	var versions []string
	if err := json.NewDecoder(vResp.Body).Decode(&versions); err != nil {
		return nil, "", fmt.Errorf("failed to parse versions: %w", err)
	}

	if len(versions) == 0 {
		return nil, "", fmt.Errorf("no versions available")
	}

	latestVersion := versions[0]

	// Get all champions data
	championsURL := fmt.Sprintf("https://ddragon.leagueoflegends.com/cdn/%s/data/en_US/champion.json", latestVersion)
	cResp, err := http.Get(championsURL)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get champion list: %w", err)
	}
	defer cResp.Body.Close()

	var champListResp struct {
		Data map[string]struct {
			ID   string `json:"id"`
			Key  string `json:"key"` // This is the numeric ID as string
			Name string `json:"name"`
		} `json:"data"`
	}

	if err := json.NewDecoder(cResp.Body).Decode(&champListResp); err != nil {
		return nil, "", fmt.Errorf("failed to parse champion list: %w", err)
	}

	// Find the champion with matching ID
	var champKey string
	for _, champ := range champListResp.Data {
		if champ.Key == fmt.Sprint(championID) {
			champKey = champ.ID
			break
		}
	}

	if champKey == "" {
		return nil, "", fmt.Errorf("champion with ID %d not found", championID)
	}

	// Get detailed champion data including skins
	champDetailURL := fmt.Sprintf("https://ddragon.leagueoflegends.com/cdn/%s/data/en_US/champion/%s.json",
		latestVersion, champKey)
	dResp, err := http.Get(champDetailURL)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get champion details: %w", err)
	}
	defer dResp.Body.Close()

	var champDetailResp struct {
		Data map[string]struct {
			ID    string `json:"id"`
			Key   string `json:"key"`
			Name  string `json:"name"`
			Skins []struct {
				ID   string `json:"id"`
				Num  int    `json:"num"`
				Name string `json:"name"`
			} `json:"skins"`
		} `json:"data"`
	}

	if err := json.NewDecoder(dResp.Body).Decode(&champDetailResp); err != nil {
		return nil, "", fmt.Errorf("failed to parse champion details: %w", err)
	}

	// Extract the champion data
	var champData ChampionData
	for _, detail := range champDetailResp.Data {
		champData.ID = detail.Key
		champData.Name = detail.Name

		// Copy skins one by one
		champData.Skins = make([]struct {
			ID   string
			Name string
			Num  int
		}, len(detail.Skins))

		for i, skin := range detail.Skins {
			champData.Skins[i].ID = skin.ID
			champData.Skins[i].Name = skin.Name
			champData.Skins[i].Num = skin.Num
		}

		break // There should be only one champion in the response
	}
	// Find skin by num
	skinNum := int(skinID) % 1000
	var skinName string
	for _, skin := range champData.Skins {
		if skin.Num == skinNum {
			skinName = skin.Name
			break
		}
	}

	if skinName == "" {
		return nil, "", fmt.Errorf("skin with num %d not found for champion %s", skinNum, champData.Name)
	}

	// Cache the data for future use
	if champions == nil {
		champions = make(map[string]ChampionData)
	}
	champions[champData.ID] = champData

	cacheData, err := json.Marshal(champions)
	if err == nil {
		os.WriteFile(cacheFile, cacheData, 0644)
	}

	return &champData, skinName, nil
}
