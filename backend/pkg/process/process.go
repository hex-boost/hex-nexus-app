package process

import (
	"fmt"
	"strings"
	"sync"

	"github.com/shirou/gopsutil/v3/process"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
)

type Process struct {
	command *command.Command
}

func New(command *command.Command) *Process {
	return &Process{
		command: command,
	}
}

func (p *Process) GetCommandLineByName(processName string) ([]byte, error) {
	return p.command.Execute("wmic", "process", "where", fmt.Sprintf("name='%s'", processName), "get", "commandline")
}

type ProcessInfo struct {
	PID            uint32
	Name           string
	CommandLine    string
	IsLeagueClient bool
}

// Cache for command lines to avoid repeated expensive lookups
type cmdLineCache struct {
	sync.RWMutex
	data map[uint32]string
}

var cmdCache = &cmdLineCache{
	data: make(map[uint32]string),
}

// League process identifiers for faster detection
var leagueProcessNames = []string{
	"leagueclient",
	"league of legends",
	"riotclientservices",
}

// MonitorProcesses monitors for processes and sends information through the returned channel

// Fast check if process is League-related using pre-defined list
func isLeagueProcess(name string) bool {
	for _, leagueProcess := range leagueProcessNames {
		if strings.Contains(name, leagueProcess) {
			return true
		}
	}
	return false
}

// getProcessCommandLine retrieves the command line arguments for a process
func getProcessCommandLine(pid uint32) string {
	// Check cache first
	cmdCache.RLock()
	if cmd, ok := cmdCache.data[pid]; ok {
		cmdCache.RUnlock()
		return cmd
	}
	cmdCache.RUnlock()

	// Not in cache, get command line
	p, err := process.NewProcess(int32(pid))
	if err != nil {
		return ""
	}

	cmdline, err := p.Cmdline()
	if err != nil {
		return ""
	}

	// Cache the result
	cmdCache.Lock()
	cmdCache.data[pid] = cmdline
	cmdCache.Unlock()

	return cmdline
}

// CleanupCache removes entries for processes that no longer exist
func CleanupCache() {
	cmdCache.Lock()
	defer cmdCache.Unlock()

	for pid := range cmdCache.data {
		if _, err := process.NewProcess(int32(pid)); err != nil {
			delete(cmdCache.data, pid)
		}
	}
}
