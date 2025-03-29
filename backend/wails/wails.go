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
	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"log"
)

//var icon []byte

func Init() {
	// Load .env file
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
	// Create application with options
	opts := &options.App{
		Title:              fmt.Sprintf("Nexus %s", updater.Version),
		Width:              1280,
		Height:             720,
		DisableResize:      true,
		Fullscreen:         false,
		Frameless:          false,
		StartHidden:        false,
		Debug:              options.Debug{},
		HideWindowOnClose:  false,
		BackgroundColour:   &options.RGBA{R: 255, G: 255, B: 255, A: 255},
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
			riot.NewRiotClient(app.App().Log().Riot()),
			lcuConn,
			leagueService,
			discordService,
			utilsBind,
			updater.NewUpdater(), // Add the updater

		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
			WindowClassName:      "Nexus",
			WebviewUserDataPath:  "",
			ZoomFactor:           1.0,
		},
	}
	err := wails.Run(opts)
	if err != nil {
		panic(err)
	}
}
