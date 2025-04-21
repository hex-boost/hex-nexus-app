package manager

import (
	"embed"
	"fmt"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:dist
var assets embed.FS

type UpdaterWindow struct {
	window *application.WebviewWindow
	app    *application.App
}

func NewUpdaterWindow(assets embed.FS, updateManager *UpdateManager) *UpdaterWindow {
	app := application.New(application.Options{
		Name: "NexusUpdater",

		Services:    []application.Service{application.NewService(updateManager)},
		Description: "Nexus Update Manager",
		Assets: application.AssetOptions{
			Handler: application.BundledAssetFileServer(assets),
		},
	})

	window := app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{
			Title:                      "Nexus Updater",
			DefaultContextMenuDisabled: true,
			Width:                      1024,
			Height:                     768,
			AlwaysOnTop:                false,
			Hidden:                     false,
			DisableResize:              true,
			Frameless:                  true,
		},
	)

	return &UpdaterWindow{
		window: window,
		app:    app,
	}
}

func (u *UpdaterWindow) Show() {
	err := u.app.Run()
	if err != nil {
		fmt.Printf("Error starting updater window: %v\n", err)
		return
	}
}
