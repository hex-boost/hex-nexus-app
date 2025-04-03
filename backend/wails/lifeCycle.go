package wails

import (
	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/updater"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"go.uber.org/zap"
	"os"
	"path/filepath"
)

func Startup() {
	log := utils.NewLogger("updater")
	updaterService := updater.NewUpdater()
	if updaterService.CurrentVersion == "development" {
		log.Info("Running in development mode, skipping update check")
		return
	}
	log.Info("Checking for updates. Current version: " + updaterService.CurrentVersion)
	response, err := updaterService.CheckForUpdates()
	if err != nil {
		log.Error("Error checking for updates: %v", zap.Error(err))
		app.App().Log().Wails().Sugar().Infoln(err)
		return
	}
	if response != nil {
		log.Sugar().Infoln("Server response: update needed=%v, available version=%s",
			response.NeedsUpdate, response.Version)
		if response.NeedsUpdate {
			log.Info("Starting update process to version " + response.Version)
			err := updaterService.UpdateAndRestart()
			if err != nil {
				log.Error("Update failed: %v", zap.Error(err))
				return
			}
			log.Info("Update completed successfully. Restarting application.")
			os.Exit(0)
		} else {
			log.Info("The application is up to date.")
		}
	} else {
		log.Warn("Empty response from update server")
	}
	log.Info("Checking for .old files to clean up")
	execPath, err := os.Executable()
	if err != nil {
		log.Error("Failed to get executable path: %v", zap.Error(err))
		return
	}
	execDir := filepath.Dir(execPath)
	oldFiles, err := filepath.Glob(filepath.Join(execDir, "*.old"))
	if err != nil {
		log.Error("Failed to scan for .old files: %v", zap.Error(err))
		return
	}
	for _, oldFile := range oldFiles {
		log.Info("Removing old file", zap.Any("Old file", oldFile))
		if err := os.Remove(oldFile); err != nil {
			log.Sugar().Infoln("Failed to remove %s: %v", oldFile, err)
		}
	}
	if len(oldFiles) > 0 {
		log.Sugar().Infoln("Cleaned up %d .old files", len(oldFiles))
	} else {
		log.Info("No .old files found")
	}
}
