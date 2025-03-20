package wails

import (
	"embed"
	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//var icon []byte

func Run(assets embed.FS) {

	// Create application with options
	opts := &options.App{
		Title:         "hex-nexus-app",
		Width:         1280,
		Height:        720,
		DisableResize: true,
		Fullscreen:    false,
		Frameless:     false,
		StartHidden:   false,
		Debug: options.Debug{
			OpenInspectorOnStartup: true,
		},
		HideWindowOnClose:  false,
		BackgroundColour:   &options.RGBA{R: 255, G: 255, B: 255, A: 255},
		Menu:               nil,
		LogLevel:           logger.INFO,
		LogLevelProduction: logger.ERROR,
		OnStartup:          startup,
		OnDomReady:         domReady,
		OnBeforeClose:      beforeClose,
		OnShutdown:         shutdown,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},

		WindowStartState: options.Normal,
		Bind: []interface{}{
			app.App(),
			riot.NewRiotClient(utils.NewConsoleLogger("Riot")),
		},
		// Windows platform specific options
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
			// DisableFramelessWindowDecorations: false,
			WebviewUserDataPath: "",
			ZoomFactor:          1.0,
		},
		// Mac platform specific options
		Mac: &mac.Options{
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,
				HideTitle:                  false,
				HideTitleBar:               false,
				FullSizeContent:            false,
				UseToolbar:                 false,
				HideToolbarSeparator:       true,
			},
			Appearance:           mac.NSAppearanceNameDarkAqua,
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			About: &mac.AboutInfo{
				Title:   "hex-nexus-app",
				Message: "",
				//Icon:    icon,
			},
		},
	}
	err := wails.Run(opts)
	if err != nil {
		panic(err)
	}
}
