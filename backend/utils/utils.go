package utils

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"github.com/mitchellh/go-ps"
	"github.com/pkg/browser"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
)

type Utils struct {
	app *application.App
}

func NewUtils() *Utils {
	return &Utils{}
}

func (u *Utils) GetHWID() string {
	const xx = "cmd.exe"
	var stdout bytes.Buffer
	cmd := exec.Command(xx, "/c", "wmic csproduct get uuid")
	cmd = u.HideConsoleWindow(cmd)
	cmd.Stdout = &stdout
	cmd.Run()
	out := stdout.String()
	hasher := sha256.New()
	hasher.Write([]byte(out))
	hash := hex.EncodeToString(hasher.Sum(nil))
	return hash
}

func (u *Utils) OpenBrowser(url string) error {
	return browser.OpenURL(url)
}

var forceCloseFlag = false
var forceCloseMutex sync.Mutex

func (u *Utils) SetForceClose(force bool) {
	forceCloseMutex.Lock()
	defer forceCloseMutex.Unlock()
	forceCloseFlag = force
}

func (u *Utils) ShouldForceClose() bool {
	forceCloseMutex.Lock()
	defer forceCloseMutex.Unlock()
	return forceCloseFlag
}
func (u *Utils) SetApp(app *application.App) {
	u.app = app
}
func (u *Utils) ForceCloseAndQuit() {
	u.SetForceClose(true)
	u.app.Quit()
}
func (u *Utils) ForceCloseAllClients() error {

	riotProcesses := []string{
		"RiotClientCrashHandler.exe",
		"RiotClientServices.exe",
		"RiotClientUx.exe",
		"RiotClientUxRender.exe",
		"Riot Client.exe",
		"LeagueClientUx.exe",
		"League of Legends.exe",
		"LeagueCrashHandler.exe",
		"LeagueCrashHandler64.exe",
		"LeagueClient.exe",
		"LeagueClientUx.exe",
		"LeagueClientUxRender.exe",
	}

	processes, err := ps.Processes()
	if err != nil {
		fmt.Println("Failed to list processes", zap.Error(err))
		return fmt.Errorf("failed to list processes: %w", err)
	}

	for _, process := range processes {
		processName := process.Executable()
		for _, riotProcess := range riotProcesses {
			if processName == riotProcess {
				cmd := exec.Command("taskkill", "/F", "/PID", fmt.Sprintf("%d", process.Pid()))
				cmd = u.HideConsoleWindow(cmd)
				if err := cmd.Run(); err != nil {
					fmt.Println(fmt.Sprintf("Failed to kill process %v %v %v",
						zap.String("process", processName),
						zap.Int("pid", process.Pid()),
						zap.Error(err)))
				} else {
					fmt.Println("Successfully killed process",
						zap.String("process", processName),
						zap.Int("pid", process.Pid()))
				}
				break
			}
		}
	}
	return nil
}
func (u *Utils) SetClipboard(text string) {
	u.app.Clipboard().SetText(text)
}

func (u *Utils) StartUpdate() error {
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}

	// Ensure we have the absolute path
	execPath, err = filepath.Abs(execPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute executable path: %w", err)
	}

	parentPath := filepath.Dir(execPath)
	// Instead of calculating grandparent path, use a hardcoded relative path or check both locations
	updatePath := filepath.Join(filepath.Dir(parentPath), "updater.exe")

	// Check if updater exists at calculated path
	if _, err := os.Stat(updatePath); os.IsNotExist(err) {
		// Try alternate location - same directory as the app
		alternativePath := filepath.Join(filepath.Dir(parentPath), "updater.exe")
		if _, err := os.Stat(alternativePath); err == nil {
			updatePath = alternativePath
		} else {
			return fmt.Errorf("updater.exe not found at either %s or %s", updatePath, alternativePath)
		}
	}

	// Rest of your code remains the same
	cmd := exec.Command(updatePath, execPath)
	cmd.Dir = parentPath
	cmd = u.HideConsoleWindow(cmd)

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start update process: %w", err)
	}

	lockFilePath := filepath.Join(os.TempDir(), "Nexus.lock")
	os.Remove(lockFilePath)

	os.Exit(0)
	return nil
}
