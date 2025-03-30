package wails

import (
	"embed"
	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/discord"
	"github.com/hex-boost/hex-nexus-app/backend/league"
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/updater"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"log"
)

func Init() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Error loading .env file:", err)
	}
}

func Run(assets embed.FS) {
	Init()

	utilsBind := utils.NewUtils()
	lcuConn := league.NewLCUConnection(app.App().Log().League())
	leagueRepo := repository.NewLeagueRepository(app.App().Log().Repo())
	leagueService := league.NewService(league.NewSummonerClient(lcuConn, app.App().Log().League()), leagueRepo, app.App().Log().League())
	discordService := discord.New(app.App().Log().Discord())
	// Cria nova aplicação
	app := application.New(application.Options{
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
		Windows: application.WindowsOptions{
			WndClass: "Nexus",
		},

		Linux: application.LinuxOptions{},
		Services: []application.Service{
			application.NewService(app.App()),
			application.NewService(riot.NewRiotClient(app.App().Log().Riot())),
			application.NewService(discordService),
			application.NewService(leagueService),
			application.NewService(lcuConn),
			application.NewService(utilsBind),

			application.NewService(updater.NewUpdater()),
		},

		BindAliases: nil,
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
	})

	// Cria a janela principal
	mainWindow := app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{
			Name:  "Main",
			Title: "Nexus",

			Width:         1600,
			Height:        900,
			AlwaysOnTop:   false,
			URL:           "",
			DisableResize: true,
			Frameless:     true,
			MinWidth:      1280,
			MinHeight:     720,
			MaxWidth:      1600,
			MaxHeight:     900,

			BackgroundType: 2,
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
	mainWindow.OnWindowEvent(events.Common.WindowDidResize, func(e *application.WindowEvent) {
		x, y := mainWindow.Position()
		mainWindow.SetMaxSize(1600, 900)
		mainWindow.SetMinSize(1280, 720)

		// Restaura a posição da janela após ajustar o tamanho
		mainWindow.SetPosition(x, y)
	})
	mainWindow.SetMaxSize(1600, 900)
	mainWindow.SetMinSize(1280, 720)
	err := app.Run()
	if err != nil {
		log.Fatal(err)
		return
	}
}
