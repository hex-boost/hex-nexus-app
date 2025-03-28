package app

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"os/exec"
	"sync"
)

var _app = &app{}

type app struct {
	once       sync.Once
	log        *log
	ctx        context.Context
	oauthState string
	stateMutex sync.Mutex
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

func (a *app) GetHWID() string {
	const xx = "cmd.exe"
	var stdout bytes.Buffer
	cmd := exec.Command(xx, "/c", "wmic csproduct get uuid")
	cmd.Stdout = &stdout
	cmd.Run()
	out := stdout.String()
	hasher := sha256.New()
	hasher.Write([]byte(out))
	hash := hex.EncodeToString(hasher.Sum(nil))
	return hash
}

func (a *app) Ctx() context.Context {
	return a.ctx
}

func (a *app) SetCtx(ctx context.Context) *app {
	a.ctx = ctx
	return a
}
