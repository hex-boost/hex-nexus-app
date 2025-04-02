package wails

import (
	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/updater"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
)

func startup(mainApp *application.App) {
	log := utils.NewFileLogger("updater")
	updaterService := updater.NewUpdater()
	if updaterService.CurrentVersion == "development" {
		log.Info("Running in development mode, skipping update check")
		return
	}
	log.Info("Checking for updates. Current version: " + updaterService.CurrentVersion)
	response, err := updaterService.CheckForUpdates()
	if err != nil {
		log.Errorf("Error checking for updates: %v", err)
		app.App().Log().Wails().Infoln(err)
		return
	}
	if response != nil {
		log.Infof("Server response: update needed=%v, available version=%s",
			response.NeedsUpdate, response.Version)
		if response.NeedsUpdate {
			log.Info("Starting update process to version " + response.Version)
			err := updaterService.Update()
			if err != nil {
				log.Errorf("Update failed: %v", err)
				return
			}
			log.Info("Update completed successfully. Restarting application.")
			mainApp.Quit()
		} else {
			log.Info("The application is up to date.")
		}
	} else {
		log.Warn("Empty response from update server")
	}
}
