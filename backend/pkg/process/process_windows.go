//go:build windows
// +build windows

package process

import (
	"strings"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
)

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

// Move all Windows-specific code here, including:
// - MonitorProcesses with windows.CreateToolhelp32Snapshot
// - Functions using windows package
// - Any other Windows-specific functionality
