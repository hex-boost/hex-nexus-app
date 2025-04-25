package app

import (
	"context"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"sync"
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

func App(cfg *config.Config) *app {
	if cfg == nil {
		panic("nil config provided to App()")
	}

	fmt.Println("Config exists")
	_app.once.Do(
		func() {
			fmt.Println("Starting NewLogger initialization...")
			_app.log = NewLogger(cfg)
			fmt.Println("Logger initialized successfully")

			_app.ctx = context.Background()
			_app.oauthState = ""
			_app.config = cfg
			_app.stateMutex = sync.Mutex{}
			fmt.Println("App initialization completed")
		})
	return _app
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
