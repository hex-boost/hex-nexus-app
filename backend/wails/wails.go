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
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"log"
)

//var icon []byte

func Init() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Error loading .env file:", err)
	}
}
func createTrayMenu() *menu.Menu {
	appMenu := menu.NewMenu()

	// Adiciona opção para abrir o aplicativo
	appMenu.Append(&menu.MenuItem{
		Label: "Abrir Nexus",
		Type:  menu.TextType,
		Click: func(data *menu.CallbackData) {
			// Código para restaurar a janela principal
			// wails.WindowShow() ou similar
		},
	})

	// Seção de status (semelhante ao Discord)
	//appMenu.AddSeparator()
	//appMenu.Append(menu.Item{
	//	Label:    "Status: Online",
	//	Type:     menu.TextType,
	//	Disabled: true,
	//})
	//
	//// Opções de controle
	//appMenu.AddSeparator()
	//appMenu.Append(menu.Item{
	//	Label: "Verificar atualizações",
	//	Type:  menu.TextType,
	//	Click: func(data *menu.CallbackData) {
	//		// Código para verificar atualizações
	//	},
	//})
	//
	//appMenu.Append(menu.Item{
	//	Label: "Configurações",
	//	Type:  menu.TextType,
	//	Click: func(data *menu.CallbackData) {
	//		// Código para abrir configurações
	//	},
	//})
	//
	//// Opção para sair
	//appMenu.AddSeparator()
	//appMenu.Append(menu.Item{
	//	Label: "Sair",
	//	Type:  menu.TextType,
	//	Click: func(data *menu.CallbackData) {
	//		// Código para fechar o aplicativo
	//		runtime.EventsEmit(nil, "quit")
	//	},
	//})

	return appMenu
}

func onTrayIconClicked() {
	// Alternar visibilidade da janela quando clicar no ícone da bandeja
	// Similar ao comportamento do Discord/Spotify
}
func Run(assets embed.FS) {
	Init()
	utilsBind := utils.NewUtils()
	lcuConn := league.NewLCUConnection(app.App().Log().League())
	leagueRepo := repository.NewLeagueRepository(app.App().Log().Repo())
	leagueService := league.NewService(league.NewSummonerClient(lcuConn, app.App().Log().League()), leagueRepo, app.App().Log().League())
	discordService := discord.New(app.App().Log().Discord())

	opts := &options.App{

		Title:     fmt.Sprintf("Nexus %s", updater.Version),
		MinHeight: 720,
		MinWidth:  1280,
		Width:     1600,
		Height:    900,
		Menu:      createTrayMenu(),
		MaxHeight: 900,

		MaxWidth:           1600,
		BackgroundColour:   &options.RGBA{R: 0, G: 0, B: 0, A: 80}, // A: 0 para transparência total
		Fullscreen:         false,
		Frameless:          true,
		Debug:              options.Debug{},
		LogLevel:           logger.DEBUG,
		LogLevelProduction: logger.DEBUG,
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
			updater.NewUpdater(),
		},
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			DisableWindowIcon:    true,
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
