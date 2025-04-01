package wails

import (
	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/updater"
	"github.com/wailsapp/wails/v3/pkg/application"
)

func startup(mainApp *application.App) {
	updaterService := updater.NewUpdater()
	if updaterService.CurrentVersion == "development" {
		return
	}
	response, err := updaterService.CheckForUpdates()
	if err != nil {
		app.App().Log().Wails().Infoln(err)
		panic(err)
	}
	if response.NeedsUpdate {
		err := updaterService.Update()
		if err != nil {
			panic(err)
		}
		mainApp.Quit()
	}
}
