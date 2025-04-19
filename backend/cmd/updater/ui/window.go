package ui

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

func NewUpdaterWindow() *UpdaterWindow {
	app := application.New(application.Options{
		Name:        "NexusUpdater",
		Description: "Nexus Update Manager",
		Assets: application.AssetOptions{
			Handler: application.BundledAssetFileServer(assets),
		},
	})

	window := app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{
			Title:         "Nexus Updater",
			Width:         1280,
			Height:        1024,
			AlwaysOnTop:   false,
			Hidden:        false,
			DisableResize: true,
			Frameless:     true,
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

func (u *UpdaterWindow) SetStatus(status string) {
	u.window.ExecJS(fmt.Sprintf(`document.getElementById('status').innerText = '%s';`, status))
}

func (u *UpdaterWindow) SetProgress(percent int) {
	u.window.ExecJS(fmt.Sprintf(`document.getElementById('progress').style.width = '%d%%';`, percent))
}

func (u *UpdaterWindow) SetError(errorMsg string) {
	u.window.ExecJS(fmt.Sprintf(`
        document.getElementById('status').innerText = '%s';
        document.getElementById('status').style.color = 'red';
    `, errorMsg))
}
