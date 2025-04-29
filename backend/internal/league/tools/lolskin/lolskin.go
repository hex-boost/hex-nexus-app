package lolskin

import (
	"bufio"
	"bytes"
	"embed"
	"encoding/json"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"go.uber.org/zap"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type LolSkin struct {
	modToolsExe     embed.FS
	game            string
	state           CSLOLState
	mutex           sync.Mutex
	logger          *logger.Logger
	patcherProcess  *exec.Cmd
	patcherStdin    *os.File
	onStateChanged  func(CSLOLState)
	onStatusChanged func(string)
	parsedCatalog   *Catalog // Store the parsed catalog

	tempDir string // new field to store the temp directory
}

// CSLOLState represents the different states of the tool
type CSLOLState int

const (
	StateUnitialized CSLOLState = iota
	StateIdle
	StateBusy
	StateRunning
	StateStopping
	StateCriticalError
)

// Platform-specific constants
const ModToolsExe = "mod-tools.exe"

func New(logger *logger.Logger, leaguePath string, catalog, modToolsExe embed.FS) *LolSkin {
	// Create a temporary directory for our extracted files
	tempDir, err := os.MkdirTemp("", "lolskin")
	if err != nil {
		fmt.Printf("Failed to create temp directory: %v\n", err)
		return nil
	}

	// Extract the mod-tools.exe to the temp directory
	lolskin := &LolSkin{
		logger:      logger,
		modToolsExe: modToolsExe,
		game:        leaguePath,
		state:       StateIdle,
		tempDir:     tempDir,
	}

	// Parse the catalog during initialization
	catalogData, err := catalog.ReadFile("catalog.json")
	if err != nil {
		fmt.Printf("Failed to read catalog: %v\n", err)
		os.RemoveAll(tempDir)
		return nil
	}

	var parsedCatalog Catalog
	if err := json.Unmarshal(catalogData, &parsedCatalog); err != nil {
		fmt.Printf("Failed to parse catalog: %v\n", err)
		os.RemoveAll(tempDir)
		return nil
	}
	lolskin.parsedCatalog = &parsedCatalog

	err = lolskin.extractModTools()
	if err != nil {
		fmt.Printf("Failed to extract mod tools: %v\n", err)
		os.RemoveAll(tempDir)
		return nil
	}

	// Create necessary directories
	os.MkdirAll(filepath.Join(tempDir, "installed"), 0755)
	os.MkdirAll(filepath.Join(tempDir, "profiles"), 0755)

	return lolskin
}

// Helper to extract the mod tools executable
func (c *LolSkin) extractModTools() error {
	exeData, err := c.modToolsExe.ReadFile(ModToolsExe)
	if err != nil {
		return fmt.Errorf("failed to read embedded mod-tools.exe: %w", err)
	}

	exePath := filepath.Join(c.tempDir, ModToolsExe)
	err = os.WriteFile(exePath, exeData, 0755) // 0755 makes it executable
	if err != nil {
		return fmt.Errorf("failed to write mod-tools.exe to temp directory: %w", err)
	}

	return nil
}

func (c *LolSkin) changeLeaguePath() {
	c.setStatus("Change League Path")

	// Canonicalize the League path
	gameDir := filepath.Dir(c.game)
	if _, err := os.Stat(filepath.Join(gameDir, "League of Legends.exe")); err == nil {
		c.game = filepath.Join(gameDir, "League of Legends.exe")
	}
}

func (c *LolSkin) InjectFantome(fantomePath string) error {
	c.mutex.Lock()
	if c.state != StateIdle {
		c.mutex.Unlock()
		return fmt.Errorf("tool is busy")
	}
	c.setState(StateBusy)
	c.mutex.Unlock()

	// Change League Path (important step from working logs)
	c.changeLeaguePath()

	gameDir := filepath.Dir(c.game)
	modName := strings.TrimSuffix(filepath.Base(fantomePath), filepath.Ext(filepath.Base(fantomePath)))

	// Create log file
	logFile, _ := os.Create(filepath.Join(c.tempDir, "mod-tools-log.txt"))
	if logFile != nil {
		defer logFile.Close()
		fmt.Fprintf(logFile, "==== CSLOL TOOLS LOG ====\n")
		fmt.Fprintf(logFile, "Time: %s\n", time.Now().Format(time.RFC3339))
		fmt.Fprintf(logFile, "Game path: %s\n", gameDir)
		fmt.Fprintf(logFile, "Fantome path: %s\n", fantomePath)
	}

	// Step 1: Import mod
	c.setStatus("Installing Mod")
	importArgs := []string{
		"import",
		fantomePath,
		filepath.Join(c.tempDir, "installed", modName),
		"--game:" + gameDir,
	}

	if err := c.executeCommand(ModToolsExe, importArgs, "IMPORT", logFile); err != nil {
		c.setState(StateIdle)
		return err
	}

	// Save profile
	c.setStatus("Save profile")
	profileName := "Default Profile"
	c.writeCurrentProfile(profileName)

	// Write profile
	c.setStatus("Write profile")
	profileFile, _ := os.Create(filepath.Join(c.tempDir, "profiles", profileName+".profile"))
	if profileFile != nil {
		profileFile.WriteString(modName + "\n")
		profileFile.Close()
	}

	// Create overlay
	overlayArgs := []string{
		"mkoverlay",
		filepath.Join(c.tempDir, "installed"),
		filepath.Join(c.tempDir, "profiles", profileName),
		"--game:" + gameDir,
		"--mods:" + modName,
	}

	if err := c.executeCommand(ModToolsExe, overlayArgs, "OVERLAY", logFile); err != nil {
		c.setState(StateIdle)
		return err
	}

	// Step 3: Run the patcher
	c.setStatus("Starting patcher...")
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

// Helper method for executing commands with proper output capture
// Helper method for executing commands with proper output capture
func (c *LolSkin) executeCommand(executable string, args []string, logPrefix string, logFile *os.File) error {
	execPath := filepath.Join(c.tempDir, executable)

	c.logger.Debug("Executing command", zap.String("executable", execPath), zap.Strings("args", args))

	if logFile != nil {
		fmt.Fprintf(logFile, "\n==== %s COMMAND ====\n", logPrefix)
		fmt.Fprintf(logFile, "Command: %s\n", execPath)
		fmt.Fprintf(logFile, "Arguments: %v\n", args)
	}

	cmd := exec.Command(execPath, args...)

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
func (c *LolSkin) runPatcher(args []string) {
	// Create the command
	execPath := filepath.Join(c.tempDir, ModToolsExe)
	c.patcherProcess = exec.Command(execPath, args...)

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
			c.setStatus(line)
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
		c.setState(StateIdle)
		return
	}

	c.setState(StateRunning)

	// Wait for process completion
	go func() {
		err := c.patcherProcess.Wait()
		if err != nil {
			c.logger.Error("Patcher process failed", zap.Error(err))
		}
		c.logger.Info("Patcher process completed")
		c.setState(StateIdle)
		c.patcherProcess = nil
		c.patcherStdin = nil
	}()
}

// StopProfile terminates the injection process
func (c *LolSkin) StopProfile() {
	c.mutex.Lock()
	if c.state == StateRunning && c.patcherStdin != nil {
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
func (c *LolSkin) setState(state CSLOLState) {
	if c.state != state {
		c.state = state
		if c.onStateChanged != nil {
			c.onStateChanged(state)
		}
	}
}

func (c *LolSkin) setStatus(status string) {
	if c.onStatusChanged != nil {
		c.onStatusChanged(status)
	}
}

func (c *LolSkin) reportError(name, message, trace string) {
	fmt.Printf("Error while: %s\n%s\n%s\n", name, message, trace)
}

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

func (c *LolSkin) DownloadFantome(championId int32, skinId int32) (string, error) {
	// Use the pre-parsed catalog
	if c.parsedCatalog == nil {
		return "", fmt.Errorf("catalog not initialized")
	}

	// Find the champion and skin in the catalog
	var downloadUrl string
	for _, champion := range c.parsedCatalog.Catalog {
		if int32(champion.ChampionKey) == championId {
			// Find the skin
			for _, skin := range champion.Skins {
				if int32(skin.SkinId) == skinId {
					downloadUrl = skin.DownloadUrl
					break
				}
			}
			if downloadUrl != "" {
				break
			}
		}
	}

	if downloadUrl == "" {
		return "", fmt.Errorf("skin not found for champion ID %d, skin ID %d", championId, skinId)
	}

	// Get executable path for cache directory location
	exePath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("failed to get executable path: %w", err)
	}

	// Create cache directory if it doesn't exist
	cachePath := filepath.Join(filepath.Dir(exePath), "cache")
	if err := os.MkdirAll(cachePath, 0755); err != nil {
		return "", fmt.Errorf("failed to create cache directory: %w", err)
	}

	// Extract filename from URL
	filename := filepath.Base(downloadUrl)
	localPath := filepath.Join(cachePath, filename)

	// Check if file already exists in cache
	if _, err := os.Stat(localPath); err == nil {
		return localPath, nil // File already exists
	}

	// Download the file
	resp, err := http.Get(downloadUrl)
	if err != nil {
		return "", fmt.Errorf("failed to download: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("bad status: %s", resp.Status)
	}

	// Create the file
	out, err := os.Create(localPath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer out.Close()

	// Write the body to file
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return localPath, nil
}
