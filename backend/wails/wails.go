package wails

import (
	"embed"
	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/discord"
	"github.com/hex-boost/hex-nexus-app/backend/league"
	"github.com/hex-boost/hex-nexus-app/backend/protocol"
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/updater"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"go.uber.org/zap"
	"log"
)

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

// Run processChan, stop := process.MonitorProcesses(false, 500*time.Millisecond)
// defer stop()
//
// fmt.Println("Monitoring for new processes. Press Ctrl+C to exit.")
//
// // Read from channel until program is terminated
// for process := range processChan {
// fmt.Printf("New process: %s (PID: %d)\n", process.Name, process.PID)
// if process.CommandLine != "" {
// fmt.Printf("  Command Line: %s\n", process.CommandLine)
// }
// if process.IsLeagueClient {
// fmt.Println("  League of Legends client detected!")
// }
// }

func Run(assets embed.FS, icon16 []byte, icon256 []byte) {
	cfg, err := config.LoadConfig()

	appInstance := app.App(cfg)
	updater.NewUpdater(cfg, appInstance.Log().Wails()).Start()
	mainLogger := appInstance.Log().Wails()
	appProtocol := protocol.New(appInstance.Log().Protocol())
	if err := appProtocol.Register(); err != nil {
		mainLogger.Info("Warning: Failed to register custom protocol", zap.Error(err))
		panic(err)
	}
	var mainWindow *application.WebviewWindow
	utilsBind := utils.NewUtils()
	lcuConn := league.NewLCUConnection(appInstance.Log().League())
	leagueService := league.NewLeagueService()
	baseRepo := repository.NewBaseRepository(cfg, appInstance.Log().Repo())
	apiRepository := repository.NewAPIRepository(baseRepo)
	accountsRepository := repository.NewAccountsRepository(apiRepository)
	summonerClient := league.NewSummonerClient(lcuConn, appInstance.Log().League())
	summonerService := league.NewSummonerService(summonerClient, accountsRepository, appInstance.Log().League())
	captcha := riot.NewCaptcha(appInstance.Log().Riot())
	riotClient := riot.NewRiotClient(appInstance.Log().Riot(), captcha)
	accountMonitor := league.NewAccountMonitor(appInstance.Log().Riot(), leagueService, riotClient, accountsRepository, summonerClient, lcuConn)
	discordService := discord.New(appInstance.Log().Discord())
	clientMonitor := league.NewClientMonitor(leagueService, riotClient, appInstance.Log().League(), captcha)
	app := application.New(application.Options{
		Name:        "Nexus",
		Description: "Nexus",
		Icon:        icon256,
		ShouldQuit: func() bool {
			mainLogger.Info("Should quit called")
			//return shouldQuit(dialogWindow, mainLogger, accountMonitor, clientMonitor, riotClient)

			return false
		},
		Windows: application.WindowsOptions{
			DisableQuitOnLastWindowClosed: true,
		},
		// In the application.New options where you see "KeyBindings:"
		KeyBindings: map[string]func(window *application.WebviewWindow){
			"F12": func(window *application.WebviewWindow) {
				if window != nil {
					window.OpenDevTools()
				}
			},
			// Optional: Add Ctrl+Shift+I as an alternative
			"ctrl+shift+i": func(window *application.WebviewWindow) {
				if window != nil {
					window.OpenDevTools()
				}
			},
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
			application.NewService(riotClient),
			application.NewService(discordService),
			application.NewService(summonerService),
			application.NewService(leagueService),
			application.NewService(clientMonitor),
			application.NewService(lcuConn),
			application.NewService(baseRepo),
			application.NewService(utilsBind),
			application.NewService(accountsRepository),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
	})

	captchaWindow := app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{
			Hidden:        true,
			Name:          "Captcha",
			DisableResize: true,
			Title:         "Nexus Captcha",
		},
	)
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

	SetupSystemTray(app, mainWindow, icon16)
	clientMonitor.SetWindow(mainWindow)
	appProtocol.SetWindow(mainWindow)
	captcha.SetWindow(captchaWindow)
	mainWindow.RegisterHook(events.Common.WindowClosing, func(ctx *application.WindowEvent) {
		mainLogger.Info("Window closing")
		//if !shouldQuit(dialogWindow, mainLogger, accountMonitor, clientMonitor, riotClient) {
		//	ctx.Cancel()
		//
		//}
		return

	})
	mainWindow.RegisterHook(events.Common.WindowRuntimeReady, func(ctx *application.WindowEvent) {
		accountMonitor.Start()
		clientMonitor.Start()

	})

	err = app.Run()
	if err != nil {
		log.Fatal(err)
		return
	}
}
