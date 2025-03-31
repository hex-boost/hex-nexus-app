package wails

import (
	"embed"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/discord"
	"github.com/hex-boost/hex-nexus-app/backend/league"
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/updater"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/events"

	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v3/pkg/application"
	"log"
	"time"
)

func Init() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Error loading .env file:", err)
	}
}

type Weekday string

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
	Init()
	var mainWindow *application.WebviewWindow
	utilsBind := utils.NewUtils()
	lcuConn := league.NewLCUConnection(app.App().Log().League())
	leagueRepo := repository.NewLeagueRepository(app.App().Log().Repo())
	leagueService := league.NewSummonerService(league.NewSummonerClient(lcuConn, app.App().Log().League()), leagueRepo, app.App().Log().League())
	discordService := discord.New(app.App().Log().Discord())
	clientMonitor := league.NewClientMonitor(lcuConn)
	app := application.New(application.Options{
		Name:        "Nexus",
		Description: "Nexus - Account Renting App",
		Icon:        icon,
		Windows: application.WindowsOptions{
			DisableQuitOnLastWindowClosed: true,
		},
		SingleInstance: &application.SingleInstanceOptions{
			UniqueID: "com.hexboost.nexus.app", // Use um ID mais específico baseado no nome do seu app

			OnSecondInstanceLaunch: func(data application.SecondInstanceData) {
				log.Printf("Segunda instância detectada com args: %v", data.Args)
				if mainWindow != nil {
					mainWindow.Show()
					mainWindow.Focus()
				}
			},

			AdditionalData: map[string]string{
				"appVersion": updater.Version,
				"launchTime": time.Now().Format(time.RFC3339),
			},
		},
		Services: []application.Service{
			application.NewService(app.App()),
			application.NewService(riot.NewRiotClient(app.App().Log().Riot())),
			application.NewService(discordService),
			application.NewService(leagueService),
			application.NewService(clientMonitor),
			application.NewService(lcuConn),
			application.NewService(utilsBind),

			application.NewService(updater.NewUpdater()),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
	})
	mainWindow = app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{

			Name:  "Main",
			Title: "Nexus",

			Width:         1600,
			Height:        900,
			AlwaysOnTop:   false,
			URL:           "",
			DisableResize: false,

			Frameless: true,
			MinWidth:  1280,
			MinHeight: 720,
			MaxWidth:  1600,
			MaxHeight: 900,
			Windows: application.WindowsWindow{

				BackdropType: 0,
				DisableIcon:  false,
				Theme:        1,
				CustomTheme:  nil,

				ResizeDebounceMS:        0,
				WindowDidMoveDebounceMS: 0,

				GeneralAutofillEnabled:  true,
				PasswordAutosaveEnabled: true,
			},

			BackgroundType:  2,
			InitialPosition: 0,
			BackgroundColour: application.RGBA{
				Red:   0,
				Green: 0,
				Blue:  0,
				Alpha: 80,
			},
			OpenInspectorOnStartup:     false,
			DefaultContextMenuDisabled: true,
		},
	)
	mainWindow.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		// Hide the window
		mainWindow.Hide()
		// Cancel the event so it doesn't get destroyed
		e.Cancel()
	})
	mainWindow.RegisterHook(events.Common.WindowRuntimeReady, func(e *application.WindowEvent) {
		fmt.Println("Runtime ready")

	})

	app.EmitEvent("app:main:window:ready", nil)
	//systray.AttachWindow(mainWindow).WindowOffset(5)
	mainWindow.SetMaxSize(1600, 900)
	mainWindow.SetMinSize(1280, 720)
	mainWindow.RegisterHook(events.Common.WindowRuntimeReady, func(e *application.WindowEvent) {
		fmt.Println("Runtime ready")

		mainWindow.ExecJS("console.log('executed')")

	})

	SetupSystemTray(app, mainWindow, icon)
	clientMonitor.SetWindow(mainWindow)
	err := app.Run()
	if err != nil {
		log.Fatal(err)
		return
	}
}
