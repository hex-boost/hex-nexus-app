package wails

import (
	"embed"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/discord"
	"github.com/hex-boost/hex-nexus-app/backend/league"
	gameOverlay "github.com/hex-boost/hex-nexus-app/backend/overlay"
	"github.com/hex-boost/hex-nexus-app/backend/protocol"
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/stripe"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/hex-boost/hex-nexus-app/backend/watchdog"
	"os/signal"
	"path/filepath"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"go.uber.org/zap"
	"log"
	"os"
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

func StartWatchdog() (*os.Process, error) {
	execPath, err := os.Executable()
	if err != nil {
		return nil, fmt.Errorf("failed to get executable path: %w", err)
	}

	watchdogProcess, err := watchdog.LaunchStealthyWatchdog(execPath, os.Getpid())
	if err != nil {
		return nil, fmt.Errorf("failed to start watchdog: %w", err)
	}

	return watchdogProcess, nil
}
func Run(assets embed.FS, icon16 []byte, icon256 []byte) {

	cfg, _ := config.LoadConfig()

	appInstance := app.App(cfg)

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
	_, err := StartWatchdog()
	if err != nil {
		panic(fmt.Sprintf("error starting watchdog %v", err))
		return
	}

	// Create a watchdog client for communication with the watchdog process
	watchdogClient := watchdog.NewWatchdogClient()

	//updater.NewUpdater(cfg, appInstance.Log().Wails()).Start()
	mainLogger := appInstance.Log().Wails()
	appProtocol := protocol.New(appInstance.Log().Protocol())
	if err := appProtocol.Register(); err != nil {
		mainLogger.Info("Warning: Failed to register custom protocol", zap.Error(err))
	}
	if isAdmin, _ := protocol.IsRunningAsAdmin(); isAdmin {
		mainLogger.Info("Running as admin")
	} else {
		mainLogger.Info("Not running as admin")
	}
	var mainWindow *application.WebviewWindow

	gameOverlayManager := gameOverlay.NewGameOverlayManager(appInstance.Log().League())
	stripeService := stripe.NewStripe(appInstance.Log().Stripe())
	lcuConn := league.NewLCUConnection(appInstance.Log().League())
	baseRepo := repository.NewBaseRepository(cfg, appInstance.Log().Repo())
	apiRepository := repository.NewAPIRepository(baseRepo)
	accountsRepository := repository.NewAccountsRepository(apiRepository)
	summonerClient := league.NewSummonerClient(lcuConn, appInstance.Log().League())
	summonerService := league.NewSummonerService(summonerClient, accountsRepository, appInstance.Log().League())
	captcha := riot.NewCaptcha(appInstance.Log().Riot())
	leagueService := league.NewLeagueService(appInstance.Log().Riot(), accountsRepository, summonerService, lcuConn)
	riotClient := riot.NewRiotClient(appInstance.Log().Riot(), captcha)
	accountMonitor := league.NewAccountMonitor(
		appInstance.Log().Riot(),
		leagueService,
		riotClient,
		accountsRepository,
		summonerClient,
		lcuConn,
		watchdogClient, // Use the watchdog client here instead of creating a full watchdog
	)
	websocketService := league.NewWebSocketService(appInstance.Log().League(), accountMonitor, leagueService)
	discordService := discord.New(cfg, appInstance.Log().Discord(), utilsBind)

	clientMonitor := league.NewClientMonitor(appInstance.Log().League(), accountMonitor, leagueService, riotClient, captcha)
	app := application.New(application.Options{
		Name:        "Nexus",
		Description: "Nexus",

		Icon: icon256,
		Windows: application.WindowsOptions{
			DisableQuitOnLastWindowClosed: true,
		},
		KeyBindings: map[string]func(window *application.WebviewWindow){
			"ctrl+shift+i": func(window *application.WebviewWindow) {
				if window != nil {
					window.OpenDevTools()
				}
			},

			"ctrl+r": func(window *application.WebviewWindow) {
				if window != nil {
					window.EmitEvent("page:reload")
				}
			},
		},

		SingleInstance: &application.SingleInstanceOptions{
			UniqueID: "com.hexboost.nexus.app",
			OnSecondInstanceLaunch: func(data application.SecondInstanceData) {
				mainLogger.Info("Second instance detected ", zap.Any("args", data.Args))

				if mainWindow != nil {
					mainWindow.Restore()
					mainWindow.Focus()
				}
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
			application.NewService(stripeService),
			application.NewService(gameOverlayManager),
		},
		Assets: application.AssetOptions{
			Handler: application.BundledAssetFileServer(assets),
		},
	})

	captchaWindow := app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{
			Hidden:        true,
			URL:           "http://127.0.0.1:6969/index.html",
			Name:          "Captcha",
			DisableResize: true,
			Title:         "Nexus Captcha",
		},
	)
	mainWindow = app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{

			Name:                       "Main",
			DefaultContextMenuDisabled: true,

			Title:  "Nexus",
			Width:  1920,
			Height: 1080,

			AlwaysOnTop:   false,
			URL:           "",
			DisableResize: true,
			Frameless:     true,
			//MinWidth:      1280,
			//MinHeight:     720,
			//MaxWidth:      1600,
			//MaxHeight:     900,
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

			//DevToolsEnabled:        true,
			//OpenInspectorOnStartup: true,
		},
	)

	overlayWindow := gameOverlay.CreateGameOverlay(app)
	gameOverlayManager.SetWindow(overlayWindow)
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
		websocketService.Stop()
		gameOverlayManager.Stop() // Stop the overlay manager
		lockFilePath := filepath.Join(os.TempDir(), "Nexus.lock")
		os.Remove(lockFilePath)

	})
	utilsBind.SetApp(app)
	SetupSystemTray(app, mainWindow, icon16, accountMonitor, utilsBind)
	accountMonitor.SetWindow(mainWindow)
	clientMonitor.SetWindow(app)
	appProtocol.SetWindow(mainWindow)
	captcha.SetWindow(captchaWindow)
	websocketService.SetWindow(app)
	mainWindow.RegisterHook(events.Common.WindowRuntimeReady, func(ctx *application.WindowEvent) {
		websocketService.Start()

		websocketService.SubscribeToLeagueEvents()
		accountMonitor.Start()
		clientMonitor.Start()
		gameOverlayManager.Start()

	})

	err = app.Run()
	if err != nil {
		log.Fatal(err)
		return
	}
}
