package manager

import (
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"sync"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/mitchellh/go-ps"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
)

// Manager handles process-related operations including force closing
// and monitoring of other application processes
type Manager struct {
	app            *application.App
	forceCloseFlag bool
	mutex          sync.Mutex
	cmd            *command.Command
	logger         *logger.Logger
}

// New creates a new process Manager instance
func New(logger *logger.Logger) *Manager {
	return &Manager{
		cmd:    command.New(),
		app:    application.Get(),
		logger: logger,
	}
}

// SetForceClose sets the flag indicating if the application should be forcefully closed
func (m *Manager) SetForceClose(force bool) {
	m.logger.Info("SetForceClose called",
		zap.Bool("newValue", force),
		zap.Bool("previousValue", m.forceCloseFlag))
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.forceCloseFlag = force
	m.logger.Info("ForceClose flag updated", zap.Bool("value", m.forceCloseFlag))
}

// ShouldForceClose returns the current state of the force close flag
func (m *Manager) ShouldForceClose() bool {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.logger.Info("ShouldForceClose check", zap.Bool("forceCloseFlag", m.forceCloseFlag))
	return m.forceCloseFlag
}

// ForceCloseAndQuit sets the force close flag to true and quits the application
func (m *Manager) ForceCloseAndQuit() {
	m.logger.Info("ForceCloseAndQuit called, setting force flag to true and quitting application")
	m.SetForceClose(true)
	m.logger.Info("ForceCloseAndQuit: Force flag set, calling app.Quit()")
	m.app.Quit()
}

// ForceCloseAllClients attempts to force-close all Riot/League client processes
func (m *Manager) ForceCloseAllClients() error {
	m.logger.Info("ForceCloseAllClients: Starting to close all Riot/League client processes")
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

	m.logger.Debug("Looking for Riot/League processes to close", zap.Strings("targetProcesses", riotProcesses))

	processes, err := ps.Processes()
	if err != nil {
		m.logger.Error("Failed to list processes", zap.Error(err))
		return fmt.Errorf("failed to list processes: %w", err)
	}

	m.logger.Info("Retrieved system process list", zap.Int("totalProcessCount", len(processes)))

	riotProcessesFound := 0
	killedProcesses := 0
	failedKills := 0

	for _, process := range processes {
		processName := process.Executable()
		pid := process.Pid()

		for _, riotProcess := range riotProcesses {
			if processName == riotProcess {
				riotProcessesFound++
				m.logger.Info("Found target process to terminate",
					zap.String("process", processName),
					zap.Int("pid", pid))

				err := m.cmd.Run("taskkill", "/F", "/PID", fmt.Sprintf("%d", pid))
				if err != nil {
					failedKills++
				} else {
					killedProcesses++
					m.logger.Debug("Successfully killed process",
						zap.String("process", processName),
						zap.Int("pid", pid))
				}
				break
			}
		}
	}

	m.logger.Debug("ForceCloseAllClients completed",
		zap.Int("processesFound", riotProcessesFound),
		zap.Int("processesKilled", killedProcesses),
		zap.Int("failedKills", failedKills))

	return nil
}
