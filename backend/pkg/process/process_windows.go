//go:build windows
// +build windows

package process

import (
	"strings"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	modKernel32 = windows.NewLazySystemDLL("kernel32.dll")
	modUser32   = windows.NewLazySystemDLL("user32.dll")

	procCreateToolhelp32Snapshot = modKernel32.NewProc("CreateToolhelp32Snapshot")
	procProcess32FirstW          = modKernel32.NewProc("Process32FirstW")
	procProcess32NextW           = modKernel32.NewProc("Process32NextW")
	procCloseHandle              = modKernel32.NewProc("CloseHandle")

	procEnumWindows              = modUser32.NewProc("EnumWindows")
	procGetWindowThreadProcessId = modUser32.NewProc("GetWindowThreadProcessId")
	procIsWindowVisible          = modUser32.NewProc("IsWindowVisible")
	// Optional: GetWindowText if needed for debugging/logging
	// procGetWindowTextW = modUser32.NewProc("GetWindowTextW")
	// procGetWindowTextLengthW = modUser32.NewProc("GetWindowTextLengthW")
)

// Constants needed for process snapshot
const (
	TH32CS_SNAPPROCESS = 0x00000002
)

type PROCESSENTRY32 struct {
	DwSize              uint32
	CntUsage            uint32
	Th32ProcessID       uint32
	Th32DefaultHeapID   uintptr
	Th32ModuleID        uint32
	CntThreads          uint32
	Th32ParentProcessID uint32
	PcPriClassBase      int32
	DwFlags             uint32
	SzExeFile           [windows.MAX_PATH]uint16 // Use windows.MAX_PATH
}

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
