package wails

import (
	"context"
	"github.com/hex-boost/hex-nexus-app/backend/app"
)

func startup(ctx context.Context) {
	app.App().SetCtx(ctx).Log().Wails().Infoln("WAILS START UP")
}

func domReady(ctx context.Context) {
	app.App().SetCtx(ctx).Log().Wails().Infoln("WAILS DOM READY")
}

func beforeClose(ctx context.Context) (prevent bool) {
	app.App().SetCtx(ctx).Log().Wails().Infoln("WAILS BEFORE CLOSE")
	return false
}

func shutdown(ctx context.Context) {
	app.App().SetCtx(ctx).Log().Wails().Infoln("WAILS SHUTDOWN")
}

func suspend() {
	app.App().Log().Wails().Infoln("WAILS SUSPEND")
}

func resume() {
	app.App().Log().Wails().Infoln("WAILS RESUME")
}
