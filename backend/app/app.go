package app

import (
	"context"
	"sync"
)

var _app = &app{}

type app struct {
	once       sync.Once
	log        *log // loggers for whole application
	ctx        context.Context
	oauthState string
	stateMutex sync.Mutex //
}

func App() *app {
	_app.once.Do(
		func() {
			_app.log = NewLogger()
			_app.ctx = context.Background()
			_app.oauthState = ""
			_app.stateMutex = sync.Mutex{}

		})
	return _app
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
