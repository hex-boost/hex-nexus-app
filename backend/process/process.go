package process

import (
	"strings"
	"sync"
	"time"
	"unsafe"

	"github.com/shirou/gopsutil/v3/process"
	"golang.org/x/sys/windows"
)

// ProcessInfo represents information about a process
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
func MonitorProcesses(leagueOnly bool, interval time.Duration) (<-chan ProcessInfo, func()) {
	processChan := make(chan ProcessInfo, 100) // Buffered channel to reduce blocking
	done := make(chan struct{})

	knownProcesses := make(map[uint32]bool)

	go func() {
		defer close(processChan)

		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				// Create single snapshot per tick
				snapshot, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
				if err != nil {
					continue
				}

				var pe32 windows.ProcessEntry32
				pe32.Size = uint32(unsafe.Sizeof(pe32))

				// Get all new processes in this batch
				var newProcesses []windows.ProcessEntry32
				if err := windows.Process32First(snapshot, &pe32); err == nil {
					for {
						if _, exists := knownProcesses[pe32.ProcessID]; !exists {
							newProcesses = append(newProcesses, pe32)
							knownProcesses[pe32.ProcessID] = true
						}

						if err := windows.Process32Next(snapshot, &pe32); err != nil {
							break
						}
					}
				}
				windows.CloseHandle(snapshot)

				// Process new processes outside the snapshot loop
				for _, proc := range newProcesses {
					name := windows.UTF16ToString(proc.ExeFile[:])
					nameLower := strings.ToLower(name)

					// Quick check if it's a League process
					isLeagueClient := isLeagueProcess(nameLower)

					if !leagueOnly || isLeagueClient {
						// Only get command line for processes we care about
						var cmdLine string
						if isLeagueClient {
							cmdLine = getProcessCommandLine(proc.ProcessID)
						}

						select {
						case processChan <- ProcessInfo{
							PID:            proc.ProcessID,
							Name:           name,
							CommandLine:    cmdLine,
							IsLeagueClient: isLeagueClient,
						}:
						case <-done:
							return
						}
					}
				}
			}
		}
	}()

	stopFunc := func() {
		close(done)
	}

	return processChan, stopFunc
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

// Run processChan, stop := process.MonitorProcesses(false, 500*time.Millisecond)
// defer stop()
//
// fmt.Println("Monitoring for new processes. Press Ctrl+C to exit.")
//
// // Read from channel until program is terminated
// for process := range processChan {
// fmt.Printf("New process: %s (PID: %d)\n", process.Name, process.PID)
// if process.CommandLine != "" {
// fmt.Printf("  Command Line: %s\n", process.CommandLine)
// }
// if process.IsLeagueClient {
// fmt.Println("  League of Legends client detected!")
// }
// }
// StartWatchdog spawns a watchdog process that will monitor the main application
// and perform cleanup if the main application crashes
// Add this to your wails.go package-level variables
