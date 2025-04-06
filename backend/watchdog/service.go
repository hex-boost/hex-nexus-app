package watchdog

import (
	"os"
	"path/filepath"
	"runtime"
)

func RegisterWatchdogAsService() error {
	execPath, _ := os.Executable()
	mainPID := os.Getpid()

	switch runtime.GOOS {
	case "windows":
		// Create a batch file in startup folder
		startupFolder := filepath.Join(os.Getenv("APPDATA"), "Microsoft", "Windows", "Start Menu", "Programs", "Startup")
		batchPath := filepath.Join(startupFolder, "nexus_watchdog.bat")

		batchContent := []byte("@echo off\r\n" +
			"tasklist /FI \"PID eq " + filepath.Base(execPath) + "\" 2>NUL | find /I /N \"" + filepath.Base(execPath) + "\">NUL\r\n" +
			"if \"%ERRORLEVEL%\"==\"1\" start \"\" \"" + execPath + "\" --watchdog " + string(mainPID) + "\r\n")

		return os.WriteFile(batchPath, batchContent, 0644)
	}
	return nil
}
