package manager

import (
	"embed"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type UpdaterWindow struct {
	window *application.WebviewWindow
	App    *application.App
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
			DevToolsEnabled:            true,

			OpenInspectorOnStartup: true,
			Height:                 768,
			AlwaysOnTop:            false,
			Hidden:                 false,
			DisableResize:          true,
			Frameless:              true,
		},
	)

	return &UpdaterWindow{
		window: window,
		App:    app,
	}
}
