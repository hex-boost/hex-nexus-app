package manager

import (
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/mitchellh/go-ps"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"sync"
)

// Manager handles process-related operations including force closing
// and monitoring of other application processes
type Manager struct {
	app            *application.App
	forceCloseFlag bool
	mutex          sync.Mutex
	cmd            *command.Command
}

// New creates a new process Manager instance
func New() *Manager {
	return &Manager{
		cmd: command.New(),
		app: application.Get(),
	}
}

// SetForceClose sets the flag indicating if the application should be forcefully closed
func (m *Manager) SetForceClose(force bool) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.forceCloseFlag = force
}

// ShouldForceClose returns the current state of the force close flag
func (m *Manager) ShouldForceClose() bool {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	return m.forceCloseFlag
}

// ForceCloseAndQuit sets the force close flag to true and quits the application
func (m *Manager) ForceCloseAndQuit() {
	m.SetForceClose(true)
	m.app.Quit()
}

// ForceCloseAllClients attempts to force-close all Riot/League client processes
func (m *Manager) ForceCloseAllClients() error {
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
				err := m.cmd.Run("taskkill", "/F", "/PID", fmt.Sprintf("%d", process.Pid()))
				if err != nil {
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
