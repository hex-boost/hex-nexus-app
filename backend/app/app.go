package app

import (
	"context"
	"github.com/hex-boost/hex-nexus-app/backend/config"
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
		// Handle nil config case - either return an error or use a default config
		panic("nil config provided to App()")
	}
	_app.once.Do(
		func() {
			_app.log = NewLogger(cfg)
			_app.ctx = context.Background()
			_app.oauthState = ""
			_app.config = cfg
			_app.stateMutex = sync.Mutex{}

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
