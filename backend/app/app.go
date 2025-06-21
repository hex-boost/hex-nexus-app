package app

import (
	"context"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"runtime"
	"sync"

	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
)

var _app = &app{}

type app struct {
	once       sync.Once
	log        *log
	ctx        context.Context
	oauthState string
	stateMutex sync.Mutex
	config     *config.Config
}

func App(cfg *config.Config, logger *logger.Logger) *app {
	if cfg == nil {
		panic("nil config provided to App()")
	}

	logger.Info("Config exists")
	_app.once.Do(
		func() {
			logger.Info("Starting NewLogger initialization...")
			_app.log = NewLogger(cfg)
			logger.Info("Logger initialized successfully")

			_app.ctx = context.Background()
			_app.oauthState = ""
			_app.config = cfg
			_app.stateMutex = sync.Mutex{}
			logger.Info("App initialization completed")
		})
	return _app
}

func (a *app) OnStartup(ctx context.Context, options application.ServiceOptions) error {
	a.log.Wails().Info("Application started",
		zap.String("version", "1.0.0"),
		zap.String("os", runtime.GOOS),
		zap.String("arch", runtime.GOARCH),
		zap.Int("cpu_cores", runtime.NumCPU()),
		zap.String("go_version", runtime.Version()),
	)
	return nil
}
func (a *app) Config() *config.Config {
	return a.config
}

func (a *app) Log() *log {
	return a.log
}

func (a *app) Ctx() context.Context {
	return a.ctx
}

func (a *app) SetCtx(ctx context.Context) *app {
	a.ctx = ctx
	return a
}
