package process

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"github.com/shirou/gopsutil/v3/process"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/sysquery"
)

type Process struct {
	command  *command.Command
	sysquery *sysquery.SysQuery
}

func New(command *command.Command) *Process {
	return &Process{
		command:  command,
		sysquery: sysquery.New(),
	}
}

func (p *Process) GetCommandLineByName(processName string) (*sysquery.Win32_Process, error) {
	raw, pid, err := p.sysquery.GetProcessByName(processName)
	if err != nil {
		return nil, err
	}
	if len(raw) == 0 {
		return nil, fmt.Errorf("process %q not found", processName)
	}

	// Try array first
	var many []sysquery.Win32_Process
	if err := json.Unmarshal(raw, &many); err == nil && len(many) > 0 {
		return &many[0], nil
	}

	// Try single object
	var one sysquery.Win32_Process
	if err := json.Unmarshal(raw, &one); err == nil {
		return &one, nil
	}

	// Fallback: plain string (ExpandProperty gives just string, not JSON)
	cmdLine := strings.TrimSpace(string(raw))
	if cmdLine != "" {
		return &sysquery.Win32_Process{
			ProcessID:   pid, // unknown here
			CommandLine: &cmdLine,
		}, nil
	}

	return nil, fmt.Errorf("failed to parse process command line for %q (raw=%s)", processName, string(raw))
}

type ProcessInfo struct {
	PID            uint32
	Name           string
	CommandLine    string
	IsLeagueClient bool
	Path           string   // Added for additional information
	MemoryUsage    uint64   // Added for monitoring resources
	CPUUsage       float64  // Added for monitoring resources
	Arguments      []string // Parsed command line arguments
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

	// Not in cache, use sysquery to get command line
	sq := sysquery.New()
	cmdline, err := sq.GetProcessCommandLineByPID(pid)
	if err != nil {
		// Fall back to gopsutil if sysquery fails
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

	// Extract just the command line from the formatted output
	parts := strings.SplitN(cmdline, "=", 2)
	if len(parts) > 1 {
		cmdline = parts[1]
	}

	// Cache the result
	cmdCache.Lock()
	cmdCache.data[pid] = cmdline
	cmdCache.Unlock()

	return cmdline
}

func GetProcessDetails(pid uint32) (*ProcessInfo, error) {
	p, err := process.NewProcess(int32(pid))
	if err != nil {
		return nil, err
	}

	name, _ := p.Name()
	cmdline := getProcessCommandLine(pid)
	path, _ := p.Exe()
	memInfo, _ := p.MemoryInfo()
	cpuPercent, _ := p.CPUPercent()

	args := strings.Fields(cmdline)

	return &ProcessInfo{
		PID:            pid,
		Name:           name,
		CommandLine:    cmdline,
		IsLeagueClient: isLeagueProcess(strings.ToLower(name)),
		Path:           path,
		MemoryUsage:    memInfo.RSS,
		CPUUsage:       cpuPercent,
		Arguments:      args,
	}, nil
}
