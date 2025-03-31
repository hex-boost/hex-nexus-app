package league

import (
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/wailsapp/wails/v3/pkg/application"
	"time"
)

const (
	// Eventos
	EventLeagueClientClosed     = "league:client:closed"
	EventLeagueClientOpen       = "league:client:open"
	EventLeagueClientLoggedIn   = "league:client:loggedin"
	EventLeagueClientLoginReady = "league:client:loginready"
)

type ClientMonitor struct {
	app           *application.WebviewWindow
	lcuConn       *LCUConnection
	riotClient    *riot.RiotClient
	isRunning     bool
	pollingTicker *time.Ticker
	previousState string
}

func NewClientMonitor(lcuConn *LCUConnection, riotClient *riot.RiotClient) *ClientMonitor {
	return &ClientMonitor{
		app:           nil,
		lcuConn:       lcuConn,
		riotClient:    riotClient,
		isRunning:     false,
		previousState: "",
	}
}
func (m *ClientMonitor) SetWindow(window *application.WebviewWindow) {
	m.app = window
}
func (m *ClientMonitor) Start() {
	if m.isRunning {
		return
	}

	m.isRunning = true
	m.pollingTicker = time.NewTicker(100 * time.Millisecond)

	go func() {
		for {
			select {
			case <-m.pollingTicker.C:
				m.checkClientState()
			}
		}
	}()
}

func (m *ClientMonitor) Stop() {
	if !m.isRunning {
		return
	}

	m.pollingTicker.Stop()
	m.isRunning = false
}

func (m *ClientMonitor) checkClientState() {
	isRunning := m.riotClient.IsRunning()

	// Verifica se o cliente está logado (se estiver em execução)
	isLoggedIn := false
	isLoginReady := false

	if isRunning {
		isLoggedIn = m.lcuConn.IsInventoryReady()
		isLoginReady = m.riotClient.IsAuthenticationReady()
	}

	// Determina o estado atual
	var currentState string

	if !isRunning {
		currentState = EventLeagueClientClosed
	} else if isLoggedIn {
		currentState = EventLeagueClientLoggedIn
	} else if isLoginReady {
		currentState = EventLeagueClientLoginReady
	} else {
		currentState = EventLeagueClientOpen
	}

	if currentState != m.previousState {
		m.app.EmitEvent(currentState)
		m.previousState = currentState
	}
}

func (m *ClientMonitor) IsCurrentAccountRented() bool {
	return true
	//return m.lcuConn.IsLoggedIn() && m.lcuConn.GetCurrentAccount().IsRented
}
