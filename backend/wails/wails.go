package wails

import (
	"context"
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
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/hex-boost/hex-nexus-app/backend/internal/league/summoner"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/tools/lolskin"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/handler"
	"github.com/hex-boost/hex-nexus-app/backend/internal/systemtray"
	"github.com/hex-boost/hex-nexus-app/backend/internal/telemetry"
	"github.com/hex-boost/hex-nexus-app/backend/internal/updater"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/hwid"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/metrics"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/observability"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/process"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/tracing"
	"github.com/hex-boost/hex-nexus-app/backend/protocol"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/riot/captcha"
	"github.com/hex-boost/hex-nexus-app/backend/stripe"
	"github.com/hex-boost/hex-nexus-app/backend/watchdog"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"go.uber.org/zap"
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

func RunWithRetry(assets, csLolDLL, modToolsExe, catalog embed.FS, icon16 []byte, icon256 []byte, maxRetries int) {
	retryCount := 0

	for retryCount <= maxRetries {
		func() {
			defer func() {
				cfg, err := config.LoadConfig()
				if err != nil {
					log.Printf("Error loading config: %v\n", err)
					return
				}
				logger := logger.New("RunWithRetry", cfg)
				if r := recover(); r != nil {
					errorMsg := fmt.Sprint(r)

					if strings.Contains(errorMsg, "[WebView2 Error] The parameter is incorrect") {
						retryCount++
						if retryCount <= maxRetries {
							logger.Error(fmt.Sprintf("WebView2 initialization error detected. Retrying (%d/%d) after delay...\n",
								retryCount, maxRetries))
							time.Sleep(2 * time.Second) // Add a delay before retrying
						} else {
							logger.Error(fmt.Sprintf("Failed to start application after %d attempts. Giving up.\n", maxRetries))
							panic(fmt.Sprintf("Failed to start after %d retries: %v", maxRetries, errorMsg))
						}
					} else {
						logger.Fatal("panic recover:", zap.Error(err), zap.Error(fmt.Errorf("application panicked: %v", r)))
						panic(fmt.Sprintf("recover panic %v", r))
					}
				}
			}()

			// Call the original Run function
			Run(assets, csLolDLL, modToolsExe, catalog, icon16, icon256)

			// If Run completes without panic, break out of the retry loop
			retryCount = maxRetries + 1
		}()
	}
}
func Run(assets, csLolDLL, modToolsExe, catalog embed.FS, icon16 []byte, icon256 []byte) {
	cfg, _ := config.LoadConfig()
	logger.InitSession(cfg) // Initialize logger session context
	watchdogLog := logger.New("watchdog", cfg)
	mainLogger := logger.New("Startup", cfg)
	ctx, bgCancel := context.WithCancel(context.Background())
	defer bgCancel()

	var appMetrics telemetry.MetricsRecorder = metrics.NewOtelMetrics()

	tracer, err := tracing.NewTracer(context.Background(), cfg, mainLogger.Logger)
	if err != nil {
		mainLogger.Error("Failed to initialize tracer", zap.Error(err))
	}

	obsManager := observability.NewManager(cfg, mainLogger.Logger)
	err = obsManager.Start()
	if err != nil {
		mainLogger.Error("Failed to start observability manager", zap.Error(err))
	}

	// The concrete metrics implementation is passed here, but could be used via interface
	metrics.InitializeObservability(ctx, appMetrics, tracer, mainLogger.Logger, cfg)

	if cfg.Prometheus.Enabled {
		_, err := metrics.InitPrometheusExporter()
		if err != nil {
			mainLogger.Error("Failed to create Prometheus exporter", zap.Error(err))
		} else {
			http.Handle("/metrics", promhttp.Handler())
			go func() {
				mainLogger.Info("Starting metrics server on :2112")
				err := http.ListenAndServe(":2112", nil)
				if err != nil {
					mainLogger.Error("Metrics server error", zap.Error(err))
				}
			}()
		}
	}
	mainLogger.Info("Starting application initialization")
	mainLogger.Info("Initializing App instance")
	appInstance := app.App(cfg, logger.New("App", cfg))
	mainLogger := appInstance.Log().Wails()
	mainLogger.Info("Initializing LeagueManager")
	leagueManager := manager.New(logger.New("LeagueManager", cfg))
	if !cfg.Debug {
		if len(os.Args) >= 3 && os.Args[1] == "--watchdog" {
			mainPID, err := strconv.Atoi(os.Args[2])
			if err != nil {
				watchdogLog.Error(fmt.Sprintf("Invalid PID: %v", err))
			}

			newWatchdog := watchdog.New(mainPID, os.Args[0])

			// Add cleanup functions
			newWatchdog.AddCleanupFunction(func() {
				// Load state to check if account was active
				state, err := newWatchdog.LoadState()
				if err == nil && state.AccountActive {
					err := leagueManager.ForceCloseAllClients()
					if err != nil {
						watchdogLog.Error(fmt.Sprintf("error closing clients: %v", err))
						return
					}
					watchdogLog.Info("Performing emergency league client logout for Nexus account")
				}
			})

			// Start watchdog
			if err := newWatchdog.Start(); err != nil {
				watchdogLog.Error(fmt.Sprintf("Failed to start watchdog: %v", err))
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
					watchdogLog.Info("Watchdog received termination signal")
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
	}

	// Create a watchdog client for communication with the watchdog process
	mainLogger.Info("Initializing WatchdogClient")
	watchdogClient := watchdog.NewWatchdogClient()

	mainLogger = appInstance.Log().Wails()
	mainLogger.Info("Initializing protocol handling")
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

	mainLogger.Info("Initializing stripeService")
	stripeService := stripe.New(appInstance.Log().Stripe())

	mainLogger.Info("Initializing command and process utilities")
	cmd := command.New()
	procs := process.New(cmd)

	mainLogger.Info("Initializing LCU connection")
	lcuConn := lcu.NewConnection(appInstance.Log().League(), procs)

	mainLogger.Info("Initializing clients")
	baseClient := client.NewBaseClient(appInstance.Log().Repo(), cfg)
	httpClient := client.NewHTTPClient(baseClient)
	accountClient := account.NewClient(appInstance.Log().Web(), cfg, httpClient)
	summonerClient := summoner.NewClient(appInstance.Log().League(), lcuConn)

	mainLogger.Info("Initializing summoner service")
	summonerService := summoner.NewService(appInstance.Log().League(), summonerClient)

	mainLogger.Info("Initializing captcha service")
	captchaService := captcha.New(appInstance.Log().Riot())

	mainLogger.Info("Initializing league service")
	leagueService := league.NewService(appInstance.Log().Riot(), accountClient, summonerService, lcuConn, accountState)

	mainLogger.Info("Initializing lolskin injector")
	lolskinInjector := lolskin.New(appInstance.Log().League(), leagueService.GetPath(), catalog, csLolDLL, modToolsExe)

	mainLogger.Info("Initializing riot service")
	riotService := riot.NewService(appInstance.Log().Riot(), captchaService, accountClient)

	mainLogger.Info("Initializing updater")
	newUpdaterUtils := updaterUtils.New(appInstance.Log().Wails())
	updateManager := updater.NewUpdateManager(cfg, newUpdaterUtils, appInstance.Log().League())

	mainLogger.Info("Initializing account monitor")
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

	mainLogger.Info("Initializing discord service")
	discordService := discord.New(appInstance.Log().Discord(), cfg)

	debugMode := cfg.Debug

	mainLogger.Info("Initializing client monitor")
	clientMonitor := league.NewMonitor(appInstance.Log().League(), accountMonitor, leagueService, riotService, captchaService, accountState, riotService, accountClient)

	mainLogger.Info("Initializing lolskin services")
	lolSkinState := lolskin.NewState()
	lolSkinService := lolskin.NewService(appInstance.Log().League(), accountState, accountClient, lolskinInjector, lolSkinState)

	mainLogger.Info("Initializing websocket services")
	websocketHandler := handler.New(appInstance.Log().League(), accountState, accountClient, summonerClient, lolSkinState, lolSkinService)
	websocketRouter := websocket.NewRouter(appInstance.Log().League())
	websocketManager := websocket.NewManager()
	websocketService := websocket.NewService(appInstance.Log().League(), accountMonitor, leagueService, lcuConn, accountClient, websocketRouter, websocketHandler, websocketManager)
	mainLogger.Info("Initializing logger service for frontend")
	frontendLogger := logger.New("frontend", cfg)
	logService := logger.NewLogService(frontendLogger)
	mainLogger.Info("Creating main application with services")

	mainApp := application.New(application.Options{
		Name:        "Nexus",
		Description: "Nexus",
		PanicHandler: func(err any) {
			appMetrics.IncrementAppPanics(ctx)
			mainLogger.Error("Application panic occurred", zap.Any("error", err))
			panic(fmt.Sprintf("Nexus panic: %v", err))
		},
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
			application.NewService(logService),
			application.NewService(accountMonitor),
			application.NewService(leagueManager),
			application.NewService(stripeService),
			//application.NewService(gameOverlayManager),
			application.NewService(updateManager),
			application.NewService(lolskinInjector),
			application.NewService(lolSkinState),
			application.NewService(websocketHandler),
			application.NewService(summonerClient),
			application.NewService(websocketService),
			application.NewService(lolSkinService),
		},
		Assets: application.AssetOptions{
			Handler: application.BundledAssetFileServer(assets),
		},
	})

	captchaWindow := mainApp.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{
			Hidden:        true,
			URL:           "http://127.0.0.1:6970/index.html",
			Name:          "Captcha",
			DisableResize: false,

			Width:  1024,
			Height: 768,
			Title:  "Nexus Captcha",
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

			DevToolsEnabled:        true,
			OpenInspectorOnStartup: debugMode,
		},
	)

	//overlayWindow := gameOverlay.CreateGameOverlay(mainApp)
	//gameOverlayManager.SetWindow(overlayWindow)
	mainWindow.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		mainApp.Logger.Info("Window closing event triggered")

		// Check if force close is enabled
		if !leagueManager.ShouldForceClose() && accountMonitor.IsNexusAccount() {
			e.Cancel()
			mainWindow.EmitEvent("nexus:confirm-close")
			return
		}
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if tracer != nil {
			_ = tracer.Shutdown(ctx)
		}
		if obsManager != nil {
			_ = obsManager.Stop()
		}
		mainApp.Logger.Info("Forced close requested, shutting down")
		clientMonitor.Stop()
		//gameOverlayManager.Stop() // Stop the overlay manager
		lockFilePath := filepath.Join(os.TempDir(), "Nexus.lock")
		err := os.Remove(lockFilePath)
		if err != nil {
			mainApp.Logger.Error("Failed to remove lock file", zap.Error(err))
		}
	})

	systemTray := systemtray.New(mainWindow, icon16, accountMonitor, leagueManager, logger.New("SystemTray", cfg))
	mainWindow.RegisterHook(events.Common.WindowRuntimeReady, func(ctx *application.WindowEvent) {
		go websocketHandler.ProcessEvents(context.Background())
		appProtocol.SetWindow(mainWindow)
		captchaService.SetWindow(captchaWindow)
		websocketHandler.SetApp(mainApp)
		websocketService.Start(mainApp)
		systemTray.Setup()
		websocketService.SubscribeToLeagueEvents()
		accountMonitor.Start(mainWindow)
		clientMonitor.Start(mainApp)
		//gameOverlayManager.Start()

	})

	err = mainApp.Run()
	if err != nil {
		log.Fatal(err)
		return
	}
}
