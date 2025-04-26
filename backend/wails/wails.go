package wails

import (
	"embed"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/client"
	updaterUtils "github.com/hex-boost/hex-nexus-app/backend/cmd/updater/utils"
	"github.com/hex-boost/hex-nexus-app/backend/discord"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/lcu"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/manager"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/summoner"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/handler"
	"github.com/hex-boost/hex-nexus-app/backend/internal/systemtray"
	"github.com/hex-boost/hex-nexus-app/backend/internal/updater"
	gameOverlay "github.com/hex-boost/hex-nexus-app/backend/overlay"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/hwid"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/process"
	"github.com/hex-boost/hex-nexus-app/backend/protocol"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/riot/captcha"
	"github.com/hex-boost/hex-nexus-app/backend/stripe"
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
	leagueManager := manager.New()

	if len(os.Args) >= 3 && os.Args[1] == "--watchdog" {
		mainPID, err := strconv.Atoi(os.Args[2])
		if err != nil {
			log.Fatalf("Invalid PID: %v", err)
		}

		newWatchdog := watchdog.New(mainPID, os.Args[0])

		// Add cleanup functions
		newWatchdog.AddCleanupFunction(func() {
			// Load state to check if account was active
			state, err := newWatchdog.LoadState()
			if err == nil && state.AccountActive {
				err := leagueManager.ForceCloseAllClients()
				if err != nil {
					fmt.Println(fmt.Errorf("error closing clients: %v", err))
					return
				}
				log.Println("Performing emergency league client logout for Nexus account")
			}
		})

		// Start watchdog
		if err := newWatchdog.Start(); err != nil {
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
				newWatchdog.Stop() // Gracefully stop the watchdog
			}
		}()

		// Also set up a monitor for our own PID to detect forceful termination
		go func() {
			ticker := time.NewTicker(5 * time.Second)
			defer ticker.Stop()

			for {
				<-ticker.C
				if !newWatchdog.IsRunning() {
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
	accountState := account.NewState()
	gameOverlayManager := gameOverlay.NewGameOverlayManager(appInstance.Log().League())
	stripeService := stripe.New(appInstance.Log().Stripe())
	cmd := command.New()
	procs := process.New(cmd)
	lcuConn := lcu.NewConnection(appInstance.Log().League(), procs)
	baseClient := client.NewBaseClient(appInstance.Log().Repo(), cfg)
	httpClient := client.NewHTTPClient(baseClient)
	accountClient := account.NewClient(appInstance.Log().Web(), httpClient)
	summonerClient := summoner.NewClient(appInstance.Log().League(), lcuConn)
	summonerService := summoner.NewService(appInstance.Log().League(), summonerClient)
	captchaService := captcha.New(appInstance.Log().Riot())
	leagueService := league.NewService(appInstance.Log().Riot(), accountClient, summonerService, lcuConn)
	riotService := riot.NewService(appInstance.Log().Riot(), captchaService)
	newUpdaterUtils := updaterUtils.New(appInstance.Log().Wails())
	updateManager := updater.NewUpdateManager(cfg, newUpdaterUtils, appInstance.Log().League())
	accountMonitor := account.NewMonitor(
		appInstance.Log().Riot(),
		leagueService,
		riotService,
		summonerClient,
		lcuConn,
		watchdogClient,
		accountClient,
		accountState,
	)
	discordService := discord.New(appInstance.Log().Discord(), cfg)
	debugMode := cfg.Debug
	clientMonitor := league.NewMonitor(appInstance.Log().League(), accountMonitor, leagueService, riotService, captchaService)
	mainApp := application.New(application.Options{
		Name:        "Nexus",
		Description: "Nexus",

		Icon: icon256,
		Windows: application.WindowsOptions{
			DisableQuitOnLastWindowClosed: true,
		},
		KeyBindings: map[string]func(window *application.WebviewWindow){
			"ctrl+shift+i": func(window *application.WebviewWindow) {
				if window != nil && debugMode {
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
			application.NewService(riotService, application.ServiceOptions{
				Name: "RiotService",
			}),
			application.NewService(discordService),
			application.NewService(hwid.New()),
			application.NewService(summonerService),
			application.NewService(leagueService),
			application.NewService(clientMonitor),
			application.NewService(lcuConn),
			application.NewService(baseClient),
			application.NewService(accountClient),
			application.NewService(accountMonitor),
			application.NewService(leagueManager),
			application.NewService(stripeService),
			application.NewService(gameOverlayManager),
			application.NewService(updateManager),
		},
		Assets: application.AssetOptions{
			Handler: application.BundledAssetFileServer(assets),
		},
	})

	captchaWindow := mainApp.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{
			Hidden:        true,
			URL:           "http://127.0.0.1:6969/index.html",
			Name:          "Captcha",
			DisableResize: true,
			Title:         "Nexus Captcha",
		},
	)
	mainWindow = mainApp.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{

			Name:                       "Main",
			DefaultContextMenuDisabled: true,

			Title:         "Nexus",
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

			DevToolsEnabled:        debugMode,
			OpenInspectorOnStartup: debugMode,
		},
	)

	websocketHandler := handler.New(appInstance.Log().League(), mainApp, accountState, accountClient)
	websocketRouter := websocket.NewRouter(appInstance.Log().League())
	websocketManager := websocket.NewManager()
	websocketService := websocket.NewService(appInstance.Log().League(), accountMonitor, leagueService, lcuConn, accountState, accountClient, websocketRouter, websocketHandler, websocketManager)
	overlayWindow := gameOverlay.CreateGameOverlay(mainApp)
	gameOverlayManager.SetWindow(overlayWindow)
	mainWindow.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		mainApp.Logger.Info("Window closing event triggered")

		// Check if force close is enabled
		if !leagueManager.ShouldForceClose() && accountMonitor.IsNexusAccount() {
			e.Cancel()
			mainWindow.EmitEvent("nexus:confirm-close")
			return
		}

		mainApp.Logger.Info("Forced close requested, shutting down")
		accountMonitor.Stop()
		clientMonitor.Stop()
		websocketService.Stop()
		gameOverlayManager.Stop() // Stop the overlay manager
		lockFilePath := filepath.Join(os.TempDir(), "Nexus.lock")
		err := os.Remove(lockFilePath)
		if err != nil {
			return
		}

	})

	systemTray := systemtray.New(mainWindow, icon16, accountMonitor, leagueManager)
	systemTray.Setup()
	appProtocol.SetWindow(mainWindow)
	captchaService.SetWindow(captchaWindow)
	mainWindow.RegisterHook(events.Common.WindowRuntimeReady, func(ctx *application.WindowEvent) {
		websocketService.Start(mainApp)

		websocketService.SubscribeToLeagueEvents()
		accountMonitor.Start(mainWindow)
		clientMonitor.Start(mainApp)
		gameOverlayManager.Start()

	})

	err = mainApp.Run()
	if err != nil {
		log.Fatal(err)
		return
	}
}
