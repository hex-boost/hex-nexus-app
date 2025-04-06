package wails

import (
	"embed"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/discord"
	"github.com/hex-boost/hex-nexus-app/backend/league"
	"github.com/hex-boost/hex-nexus-app/backend/protocol"
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/updater"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/hex-boost/hex-nexus-app/backend/watchdog"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"go.uber.org/zap"
	"log"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"
)

func SetupSystemTray(app *application.App, window *application.WebviewWindow, icon []byte, monitor *league.AccountMonitor, utils *utils.Utils) *application.SystemTray {
	systray := app.NewSystemTray()
	menu := application.NewMenu()
	menu.Add("Nexus").SetBitmap(icon).SetEnabled(false)
	menu.AddSeparator()
	sairItem := menu.Add("Exit Nexus")
	sairItem.OnClick(func(ctx *application.Context) {
		if monitor.IsNexusAccount() {
			window.Show()
			window.Focus()
			window.EmitEvent("nexus:confirm-close")
		} else {
			utils.SetForceClose(true)
			app.Quit()
		}

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
// StartWatchdog spawns a watchdog process that will monitor the main application
// and perform cleanup if the main application crashes
// Add this to your wails.go package-level variables

func StartWatchdog() error {
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}

	_, err = watchdog.LaunchStealthyWatchdog(execPath, os.Getpid())
	if err != nil {
		return fmt.Errorf("failed to start watchdog: %w", err)
	}

	return nil
}
func Run(assets embed.FS, icon16 []byte, icon256 []byte) {

	utilsBind := utils.NewUtils()
	if len(os.Args) >= 3 && os.Args[1] == "--watchdog" {
		mainPID, err := strconv.Atoi(os.Args[2])
		if err != nil {
			log.Fatalf("Invalid PID: %v", err)
		}

		watchdog := watchdog.NewWatchdog(mainPID, os.Args[0])

		// Add cleanup functions
		watchdog.AddCleanupFunction(func() {
			// Load state to check if account was active
			state, err := watchdog.LoadState()
			if err == nil && state.AccountActive {
				err := utilsBind.ForceCloseAllClients()
				if err != nil {
					fmt.Println(fmt.Errorf("error closing clients: %v", err))
					return
				}
				log.Println("Performing emergency league client logout for Nexus account")
			}
		})

		// Start watchdog
		if err := watchdog.Start(); err != nil {
			log.Fatalf("Failed to start watchdog: %v", err)
		}

		// Instead of select{}, use a WaitGroup
		var wg sync.WaitGroup
		wg.Add(1)

		// Add signal handling for graceful shutdown
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT)

		go func() {
			defer wg.Done()
			select {
			case <-sigChan:
				log.Println("Watchdog received termination signal")
				watchdog.Stop() // Gracefully stop the watchdog
			}
		}()

		// Also set up a monitor for our own PID to detect forceful termination
		go func() {
			ticker := time.NewTicker(5 * time.Second)
			defer ticker.Stop()

			for {
				<-ticker.C
				if !watchdog.IsRunning() {
					log.Println("Main process exited, watchdog shutting down")
					os.Exit(0)
				}
			}
		}()

		wg.Wait()
		return
	}
	// Normal application startup
	err := StartWatchdog()
	if err != nil {
		panic(fmt.Sprintf("error starting watchdog %v", err))
		return
	} // Start the watchdog process
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
			application.NewService(accountMonitor),
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
	mainWindow.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		app.Logger.Info("Window closing event triggered")

		// Check if force close is enabled
		if !utilsBind.ShouldForceClose() && accountMonitor.IsNexusAccount() {
			e.Cancel()
			mainWindow.EmitEvent("nexus:confirm-close")
			return
		}

		app.Logger.Info("Forced close requested, shutting down")
		accountMonitor.Stop()
		clientMonitor.Stop()
	})
	utilsBind.SetApp(app)
	SetupSystemTray(app, mainWindow, icon16, accountMonitor, utilsBind)
	clientMonitor.SetWindow(mainWindow)
	appProtocol.SetWindow(mainWindow)
	captcha.SetWindow(captchaWindow)
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
