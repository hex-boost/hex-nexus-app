package wails

import (
	"embed"

	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/discord"
	"github.com/hex-boost/hex-nexus-app/backend/league"
	"github.com/hex-boost/hex-nexus-app/backend/protocol"
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/updater"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"go.uber.org/zap"
	"log"
)

func Init(protocol *protocol.Protocol) error {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Error loading .env file:", err)
	}
	if err := protocol.Register(); err != nil {
		log.Println("Warning: Failed to register custom protocol:", err)
		return err
	}
	return nil

}

func SetupSystemTray(app *application.App, window *application.WebviewWindow, icon []byte) *application.SystemTray {
	systray := app.NewSystemTray()
	menu := application.NewMenu()
	menu.Add("Nexus").SetBitmap(icon).SetEnabled(false)
	menu.AddSeparator()
	sairItem := menu.Add("Exit Nexus")
	sairItem.OnClick(func(ctx *application.Context) {
		app.Quit()
	})
	systray.SetLabel("Nexus")
	systray.SetIcon(icon)
	systray.OnClick(func() {
		if !window.IsVisible() {
			window.Show()
			window.Focus()
		}
	})
	systray.SetDarkModeIcon(icon)
	systray.SetMenu(menu)
	return systray
}

func Run(assets embed.FS, icon []byte) {
	mainLogger := app.App().Log().Wails()
	mainUpdater := updater.NewUpdater()
	var mainWindow *application.WebviewWindow
	appProtocol := protocol.New(app.App().Log().Protocol())
	err := Init(appProtocol)
	if err != nil {
		panic(err)
	}
	utilsBind := utils.NewUtils()
	lcuConn := league.NewLCUConnection(app.App().Log().League())
	leagueService := league.NewLeagueService(app.App().Log().League())
	leagueRepo := repository.NewLeagueRepository(app.App().Log().Repo())
	summonerService := league.NewSummonerService(league.NewSummonerClient(lcuConn, app.App().Log().League()), leagueRepo, app.App().Log().League())
	riotClient := riot.NewRiotClient(app.App().Log().Riot())
	discordService := discord.New(app.App().Log().Discord())
	clientMonitor := league.NewClientMonitor(leagueService, riotClient, app.App().Log().League())
	app := application.New(application.Options{
		Name:        "Nexus",
		Description: "Nexus",
		Icon:        icon,
		Windows: application.WindowsOptions{
			DisableQuitOnLastWindowClosed: true,
		},

		SingleInstance: &application.SingleInstanceOptions{
			UniqueID: "com.hexboost.nexus.app",
			OnSecondInstanceLaunch: func(data application.SecondInstanceData) {
				mainLogger.Info("Second instance detected ", zap.Any("args", data.Args))
				for _, arg := range data.Args {
					if len(arg) > 8 && arg[:8] == "nexus://" {
						mainLogger.Info("Protocol open detected")
						err := appProtocol.Handle(arg)
						if err != nil {
							mainLogger.Error("Error handling protocol URL:", zap.Error(err))
							break
						}
						break
					}
				}
				if mainWindow != nil {
					mainWindow.Restore()
					mainWindow.Focus()
				}

			},
		},
		Services: []application.Service{
			application.NewService(app.App()),
			application.NewService(riotClient),
			application.NewService(discordService),
			application.NewService(summonerService),
			application.NewService(clientMonitor),
			application.NewService(lcuConn),
			application.NewService(utilsBind),
			application.NewService(mainUpdater),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
	})
	mainWindow = app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{
			Name:                       "Main",
			DefaultContextMenuDisabled: false,

			Title:         "Nexus",
			Width:         1440,
			Height:        900,
			AlwaysOnTop:   false,
			URL:           "",
			DisableResize: true,
			Frameless:     true,
			MinWidth:      1280,
			MinHeight:     720,
			MaxWidth:      1600,
			MaxHeight:     900,
			Windows: application.WindowsWindow{
				Theme:                   1,
				CustomTheme:             nil,
				GeneralAutofillEnabled:  false,
				PasswordAutosaveEnabled: false,
			},
			BackgroundType:  2,
			InitialPosition: 0,
			BackgroundColour: application.RGBA{
				Red:   0,
				Green: 0,
				Blue:  0,
				Alpha: 80,
			},
			DevToolsEnabled:        true,
			OpenInspectorOnStartup: true,
		},
	)
	SetupSystemTray(app, mainWindow, icon)
	clientMonitor.SetWindow(mainWindow)
	appProtocol.SetWindow(mainWindow)
	mainWindow.RegisterHook(events.Common.WindowRuntimeReady, func(ctx *application.WindowEvent) {

		clientMonitor.Start()

	})
	mainWindow.RegisterHook(events.Common.WindowClosing, func(ctx *application.WindowEvent) {
		clientMonitor.Stop()

	})

	err = app.Run()
	if err != nil {
		log.Fatal(err)
		return
	}
}
