//go:build !windows
// +build !windows

package process

import (
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/process"
)

func MonitorProcesses(leagueOnly bool, interval time.Duration) (<-chan ProcessInfo, func()) {
	processChan := make(chan ProcessInfo, 100) // Buffered channel
	done := make(chan struct{})

	go func() {
		defer close(processChan)

		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				// Use gopsutil to list processes on Unix
				processes, err := process.Processes()
				if err != nil {
					continue
				}

				for _, p := range processes {
					pid := uint32(p.Pid)

					name, err := p.Name()
					if err != nil {
						continue
					}

					nameLower := strings.ToLower(name)
					isLeagueClient := isLeagueProcess(nameLower)

					if leagueOnly && !isLeagueClient {
						continue
					}

					var cmdLine string
					if isLeagueClient {
						cmdLine = getProcessCommandLine(pid)
					}

					select {
					case processChan <- ProcessInfo{
						PID:            pid,
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
	}()

	stopFunc := func() {
		close(done)
	}

	return processChan, stopFunc
}
