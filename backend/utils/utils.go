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
	"path"
	"sync"
	"syscall"
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
func (u *Utils) HideConsoleWindow(cmd *exec.Cmd) *exec.Cmd {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	cmd.SysProcAttr.CreationFlags = 0x08000000
	return cmd
}

func (u *Utils) StartUpdate() error {
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}

	parentPath := path.Dir(execPath)
	updatePath := path.Join(parentPath, "update.exe")

	// Check if update.exe exists
	if _, err := os.Stat(updatePath); err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("update.exe not found in %s", parentPath)
		}
		return fmt.Errorf("failed to check for update.exe: %w", err)
	}

	cmd := exec.Command(updatePath, execPath)
	cmd = u.HideConsoleWindow(cmd)
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start update process: %w", err)
	}

	os.Exit(0)
	return nil // This line is never reached due to os.Exit, but included for completeness
}
