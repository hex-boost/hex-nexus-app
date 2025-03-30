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
	"time"
)

func Init() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Error loading .env file:", err)
	}
}
func SetupSystemTray(app *application.App, window *application.WebviewWindow, icon []byte) *application.SystemTray {
	// Cria a instância do system tray
	systray := app.NewSystemTray()

	// Configura o menu
	menu := application.NewMenu()

	menu.AddRadio("Status", true)

	// Separador
	//menu.AddSeparator()

	// Ações principais
	//menu.AddText("Abrir Nexus", func(data *application.MenuItemEventData) {
	//	window.Show().Focus()
	//})

	// Separador
	//menu.AddSeparator()

	// Itens de configuração
	//menu.AddText("Configurações", func(data *application.MenuItemEventData) {
	//	window.Show().Focus()
	//	// Aqui poderia emitir um evento para navegar para configurações
	//	window.Emit("navegarPara", map[string]interface{}{"rota": "/configuracoes"})
	//})

	//menu.AddText("Verificar atualizações", func(data *application.MenuItemEventData) {
	//	// Lógica para verificar atualizações
	//	window.Emit("verificarAtualizacoes", nil)
	//})

	// Separador
	//menu.AddSeparator()
	//
	//// Sair
	//menu.AddText("Sair", func(data *application.MenuItemEventData) {
	//	app.Quit()
	//})

	// Configura propriedades do system tray
	systray.SetLabel("Nexus")
	systray.SetIcon(icon)
	systray.SetDarkModeIcon(icon)
	systray.SetMenu(menu)

	// Anexa a janela ao system tray com offset de 5px
	systray.AttachWindow(window).WindowOffset(5)

	return systray
}
func Run(assets embed.FS, icon []byte) {
	Init()
	var mainWindow *application.WebviewWindow
	utilsBind := utils.NewUtils()
	lcuConn := league.NewLCUConnection(app.App().Log().League())
	leagueRepo := repository.NewLeagueRepository(app.App().Log().Repo())
	leagueService := league.NewService(league.NewSummonerClient(lcuConn, app.App().Log().League()), leagueRepo, app.App().Log().League())
	discordService := discord.New(app.App().Log().Discord())
	app := application.New(application.Options{
		Name:        "Nexus",
		Description: "Nexus - Hex Nexus App",
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
		Icon: icon,
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
			application.NewService(lcuConn),
			application.NewService(utilsBind),

			application.NewService(updater.NewUpdater()),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
	})

	// Cria a janela principal
	mainWindow = app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{

			Name:  "Main",
			Title: "Nexus",

			Width:         1600,
			Height:        900,
			AlwaysOnTop:   false,
			URL:           "",
			DisableResize: true,

			Frameless: true,
			MinWidth:  1280,
			MinHeight: 720,
			MaxWidth:  1600,
			MaxHeight: 900,

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

	var (
		isMaximizing      bool
		lastKnownPosition struct{ x, y int }
	)

	mainWindow.OnWindowEvent(events.Common.WindowMaximise, func(e *application.WindowEvent) {
		x, y := mainWindow.Position()
		lastKnownPosition.x = x
		lastKnownPosition.y = y
		isMaximizing = true
	})

	mainWindow.OnWindowEvent(events.Common.WindowUnMaximise, func(e *application.WindowEvent) {
		x, y := mainWindow.Position()
		lastKnownPosition.x = x
		lastKnownPosition.y = y
		isMaximizing = true
	})

	//mainWindow.OnWindowEvent(events.Common.WindowMinimise, func(e *application.WindowEvent) {
	//	mainWindow.SetPosition(lastKnownPosition.x, lastKnownPosition.y)
	//	isMaximizing = false
	//})

	mainWindow.OnWindowEvent(events.Common.WindowDidResize, func(e *application.WindowEvent) {
		// Não interfira com a posição durante maximização/restauração
		if !isMaximizing {
			x, y := mainWindow.Position()
			mainWindow.SetMaxSize(1600, 900)
			mainWindow.SetMinSize(1280, 720)
			mainWindow.SetPosition(x, y)
		} else {
			// Apenas ajusta os limites de tamanho
			mainWindow.SetMaxSize(1600, 900)
			mainWindow.SetMinSize(1280, 720)
		}
	})
	mainWindow.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		// Hide the window
		mainWindow.Hide()
		// Cancel the event so it doesn't get destroyed
		e.Cancel()
	})
	//systray.AttachWindow(mainWindow).WindowOffset(5)
	mainWindow.SetMaxSize(1600, 900)
	mainWindow.SetMinSize(1280, 720)

	SetupSystemTray(app, mainWindow, icon)
	err := app.Run()
	if err != nil {
		log.Fatal(err)
		return
	}
}
