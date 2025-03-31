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
func NewTooltipWindow(app *application.App) *application.WebviewWindow {
	tooltip := app.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Name:           "tooltip",
		Width:          300,
		Height:         150,
		Frameless:      true,
		AlwaysOnTop:    true,
		DisableResize:  true,
		BackgroundType: 2,
		BackgroundColour: application.RGBA{
			Red:   50,
			Green: 50,
			Blue:  50,
			Alpha: 230,
		},
		DefaultContextMenuDisabled: true,
		Windows: application.WindowsWindow{
			BackdropType:                      0,
			DisableIcon:                       false,
			Theme:                             0,
			CustomTheme:                       nil,
			DisableFramelessWindowDecorations: false,
			WindowMask:                        nil,
			WindowMaskDraggable:               false,
			ResizeDebounceMS:                  0,
			WindowDidMoveDebounceMS:           0,
			DisableMenu:                       false,
			EventMapping:                      nil,
			HiddenOnTaskbar:                   false,
			EnableSwipeGestures:               false,
			Menu:                              nil,
			OnEnterEffect:                     0,
			OnOverEffect:                      0,
			Permissions:                       nil,
			ExStyle:                           0,
			GeneralAutofillEnabled:            false,
			PasswordAutosaveEnabled:           false,
			EnabledFeatures:                   nil,
			DisabledFeatures:                  nil,
		},
	})

	// HTML base para o tooltip
	tooltipHTML := `
    <html>
        <head>
            <style>
                body {
                    font-family: system-ui, -apple-system, sans-serif;
                    margin: 0;
                    padding: 10px;
                    background-color: rgba(50, 50, 50, 0.95);
                    border-radius: 6px;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
                    color: #fff;
                    user-select: none;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 14px;
                }
            </style>
            <script>
                window.onload = function() {
                    document.body.addEventListener('mouseenter', function() {
                        window.runtime.EventsEmit('tooltip-mouseenter');
                    });
                    
                    document.body.addEventListener('mouseleave', function() {
                        window.runtime.EventsEmit('tooltip-mouseleave');
                    });
                }

                function setContent(content) {
                    document.body.innerHTML = content;
                }
            </script>
        </head>
        <body>
            Tooltip
        </body>
    </html>
    `
	tooltip.SetHtml(tooltipHTML)

	tw := &TooltipWindow{
		window: tooltip,
		app:    app,
	}

	// Registrar eventos
	app.On("tooltip-mouseenter", func(data ...interface{}) {
		tw.mouseInTooltip = true
		if tw.hideTimer != nil {
			tw.hideTimer.Stop()
		}
	})

	app.On("tooltip-mouseleave", func(data ...interface{}) {
		tw.mouseInTooltip = false
		tw.scheduleHide(200 * time.Millisecond)
	})

	return tw
}
func SetupSystemTray(app *application.App, window *application.WebviewWindow, icon []byte) *application.SystemTray {
	// Cria a instância do system tray
	systray := app.NewSystemTray()

	// Exemplo de criação de MenuItem com diferentes valores

	menu := application.NewMenu()
	titleItem := menu.Add("Nexus")
	titleItem.SetBitmap(icon) // To
	menu.AddSeparator()

	sairItem := menu.Add("Exit Nexus")
	sairItem.OnClick(func(ctx *application.Context) {
		app.Quit()
	})

	systray.SetLabel("Nexus")
	systray.SetIcon(icon)
	systray.OnMouseEnter(func() {
		fmt.Println("Mouse entered the system tray")
	})
	systray.OnClick(func() {
		if !window.IsVisible() {
			window.Show()
			window.Focus()
		}
	})
	systray.SetDarkModeIcon(icon)
	systray.SetMenu(menu)

	trayWindow := app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{

			Name:  "Main",
			Title: "Nexus",

			Width:         200,
			Height:        200,
			AlwaysOnTop:   true,
			DisableResize: true,

			Frameless: true,

			DefaultContextMenuDisabled: true,
		},
	)
	systray.AttachWindow(trayWindow).WindowOffset(80)

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
			DisableResize: false,

			Frameless: true,
			MinWidth:  1280,
			MinHeight: 720,
			MaxWidth:  1600,
			MaxHeight: 900,
			Windows: application.WindowsWindow{
				BackdropType:                      0,
				DisableIcon:                       false,
				Theme:                             1,
				CustomTheme:                       nil,
				DisableFramelessWindowDecorations: false,
				WindowMask:                        nil,
				WindowMaskDraggable:               false,
				ResizeDebounceMS:                  0,
				WindowDidMoveDebounceMS:           0,
				DisableMenu:                       false,
				EventMapping:                      nil,
				HiddenOnTaskbar:                   false,
				EnableSwipeGestures:               false,
				Menu:                              nil,
				OnEnterEffect:                     0,
				OnOverEffect:                      0,
				Permissions:                       nil,
				ExStyle:                           0,
				GeneralAutofillEnabled:            true,
				PasswordAutosaveEnabled:           false,
				EnabledFeatures:                   nil,
				DisabledFeatures:                  nil,
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
	mainWindow.RegisterHook(application.WindowMinimise, func(event *application.WindowEvent) {
		mainWindow.Minimise() // Isto força o comportamento padrão de minimizar
		event.Cancel()

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
