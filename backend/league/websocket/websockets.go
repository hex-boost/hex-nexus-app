package websocket

import (
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/league"
	"github.com/hex-boost/hex-nexus-app/backend/league/account"
	"github.com/hex-boost/hex-nexus-app/backend/league/account/events"
	websocketEvent "github.com/hex-boost/hex-nexus-app/backend/league/websocket/event"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"net/http"
	"net/url"
	"sync"
	"time"
)

type HandlerInterface interface {
	WalletEvent(event LCUWebSocketEvent)
}

// Define events
const JsonApiPrefix = "OnJsonApiEvent_"

type LCUWebSocketEvent struct {
	Data       json.RawMessage `json:"data"`
	EventType  int             `json:"eventType"` // Valor numérico do LCU
	URI        string          `json:"uri"`
	EventTopic string          `json:"eventTopic"` // Armazena o valor do tópico (OnJsonApiEvent_*)
}

// EventType represents possible event types
type EventType int

type Service struct {
	app                *application.App
	accountsRepository *account.Client
	conn               *websocket.Conn
	leagueService      *league.Service
	accountMonitor     *account.Monitor
	logger             *logger.Logger
	mutex              sync.Mutex
	isRunning          bool
	stopChan           chan struct{}
	accountState       *account.State
	subscriptions      map[string]bool
	router             *Router
	manager            *Manager

	handler HandlerInterface
}

// NewWebSocketService creates a new WebSocket service
func NewService(
	logger *logger.Logger,
	accountMonitor *account.Monitor,
	leagueService *league.Service,
	accountState *account.State,
	accountsRepository *account.Client,
	router *Router,
	handler HandlerInterface,
	manager *Manager,

) *Service {
	return &Service{
		accountsRepository: accountsRepository,
		logger:             logger,
		accountMonitor:     accountMonitor,
		manager:            manager,
		leagueService:      leagueService,
		accountState:       accountState,
		stopChan:           make(chan struct{}),
		router:             router,
		handler:            handler,
		subscriptions:      make(map[string]bool),
	}
}

// SetWindow associates the WebSocket service with a Wails window
func (ws *Service) SetWindow(app *application.App) {
	ws.app = app
}

// Start begins the WebSocket service
func (ws *Service) Start() {
	ws.mutex.Lock()
	if ws.isRunning {
		ws.mutex.Unlock()
		return
	}
	ws.isRunning = true
	ws.mutex.Unlock()

	ws.logger.Info("Starting WebSocket service")
	go ws.runWebSocketLoop()
}

// Stop terminates the WebSocket service
func (ws *Service) Stop() {
	ws.mutex.Lock()
	defer ws.mutex.Unlock()

	if !ws.isRunning {
		return
	}

	ws.logger.Info("Stopping WebSocket service")
	close(ws.stopChan)
	if ws.conn != nil {
		ws.conn.Close()
	}
	ws.isRunning = false
}

// connectToLCUWebSocket establishes a WebSocket connection to the LCU
func (ws *Service) connectToLCUWebSocket() error {
	// Get LCU credentials
	defer func() {
		if r := recover(); r != nil {

		}
	}()
	port, token, _, err := ws.leagueService.LCUconnection.GetLeagueCredentials()
	if err != nil {
		return err
	}

	// Create WebSocket URL
	u := url.URL{
		Scheme: "wss",
		Host:   "127.0.0.1:" + port,
	}

	dialer := websocket.DefaultDialer
	dialer.TLSClientConfig = &tls.Config{
		InsecureSkipVerify: true, // This is equivalent to NODE_TLS_REJECT_UNAUTHORIZED=0
	}
	headers := http.Header{}

	authHeader := base64.StdEncoding.EncodeToString([]byte("riot:" + token))
	headers.Add("Authorization", authHeader)

	// Connect to WebSocket
	ws.logger.Info("Connecting to LCU WebSocket", zap.String("url", u.String()))
	conn, _, err := (*dialer).Dial(u.String(), headers)
	if err != nil {
		return err
	}

	ws.conn = conn
	ws.logger.Info("Connected to LCU WebSocket")

	return ws.resubscribeToEvents()
}

// Subscribe subscribes to a specific LCU event path
func (ws *Service) Subscribe(eventPath string) error {
	ws.mutex.Lock()
	defer ws.mutex.Unlock()

	if ws.conn != nil && ws.isConnected() {
		return ws.sendSubscription(eventPath)
	}

	return nil
}

// Unsubscribe removes subscription to a specific event path
func (ws *Service) Unsubscribe(eventPath string) error {
	ws.mutex.Lock()
	defer ws.mutex.Unlock()

	// Remove from subscriptions
	delete(ws.subscriptions, eventPath)

	ws.router.DeleteHandler(eventPath)

	if ws.conn != nil && ws.isConnected() {
		return ws.sendUnsubscription(eventPath)
	}

	return nil
}

// sendSubscription sends a subscription message to LCU websocket
func (ws *Service) sendSubscription(eventPath string) error {
	// Format according to WAMP 1.0 protocol (opcode 5 for subscribe)
	subscribeMsg := []byte(fmt.Sprintf(`[5, "%s%s"]`, JsonApiPrefix, eventPath))

	err := ws.conn.WriteMessage(websocket.TextMessage, subscribeMsg)
	if err != nil {
		ws.logger.Error("Failed to subscribe to event", zap.String("event", eventPath), zap.Error(err))
		return err
	}

	ws.logger.Info("Subscribed to event", zap.String("event", eventPath))
	return nil
}

// sendUnsubscription sends an unsubscription message
func (ws *Service) sendUnsubscription(eventPath string) error {
	// Format according to WAMP 1.0 protocol (opcode 6 for unsubscribe)
	message := []interface{}{6, eventPath}
	err := ws.conn.WriteJSON(message)
	if err != nil {
		ws.logger.Error("Failed to unsubscribe from event", zap.String("event", eventPath), zap.Error(err))
		return err
	}

	ws.logger.Info("Unsubscribed from event", zap.String("event", eventPath))
	return nil
}

// resubscribeToEvents resubscribes to all registered events after reconnection
func (ws *Service) resubscribeToEvents() error {
	ws.mutex.Lock()
	defer ws.mutex.Unlock()

	// Then subscribe to each specific path
	for eventPath := range ws.subscriptions {
		if err := ws.sendSubscription(eventPath); err != nil {
			return err
		}
	}

	return nil
}

// handleWebSocketEvent processes incoming WebSocket events
func (ws *Service) handleWebSocketEvent(message []byte) {
	// Parse da mensagem WebSocket
	var event []interface{}
	if err := json.Unmarshal(message, &event); err != nil {
		ws.logger.Error("Falha ao analisar mensagem WebSocket", zap.Error(err))
		return
	}

	// Verifica se tem formato válido (pelo menos 3 elementos)
	if len(event) < 3 {
		ws.logger.Debug("Formato de mensagem WebSocket inválido", zap.String("mensagem", string(message)))
		return
	}

	// Verifica se é um evento (código 8)
	eventCode, ok := event[0].(float64)
	if !ok || eventCode != 8 {
		return
	}

	eventData, ok := event[2].(map[string]interface{})
	if !ok {
		ws.logger.Error("Formato de dados do evento inválido")
		return
	}

	// Log informativo do evento
	if eventType, typeOk := eventData["eventType"].(string); typeOk {
		if uri, uriOk := eventData["uri"].(string); uriOk {
			ws.logger.Info(fmt.Sprintf("%s %s", eventType, uri))
		}
	}
	eventTopic, ok := event[1].(string)
	if !ok {
		ws.logger.Error("Formato de tópico do evento inválido")
		return
	}

	// Mapeia tipo de evento para inteiro
	eventTypeInt := 1 // Padrão é Update
	if et, ok := eventData["eventType"].(string); ok {
		switch et {
		case "Create":
			eventTypeInt = 0
		case "Update":
			eventTypeInt = 1
		case "Delete":
			eventTypeInt = 2
		default:
			eventTypeInt = -1
		}
	}

	// Prepara o evento LCU
	uri, _ := eventData["uri"].(string)
	lcuEvent := LCUWebSocketEvent{
		URI:        uri,
		EventType:  eventTypeInt,
		EventTopic: eventTopic,
	}

	// Converte campo data para json.RawMessage
	if dataObj, ok := eventData["data"]; ok {
		if dataBytes, err := json.Marshal(dataObj); err == nil {
			lcuEvent.Data = json.RawMessage(dataBytes)
		}
	}

	ws.router.Dispatch(lcuEvent)
}

// runWebSocketLoop manages the WebSocket connection and events
func (ws *Service) runWebSocketLoop() {
	reconnectTicker := time.NewTicker(5 * time.Second)
	defer reconnectTicker.Stop()

	for {
		select {
		case <-ws.stopChan:
			ws.logger.Info("WebSocket loop terminated")
			return

		case <-reconnectTicker.C:
			// If League client is not running or we already have a connection, continue
			if !ws.leagueService.IsRunning() || (ws.conn != nil && ws.isConnected()) {
				continue
			}

			// Try to connect or reconnect
			if err := ws.connectToLCUWebSocket(); err != nil {
				ws.logger.Debug("Failed to connect to LCU WebSocket", zap.Error(err))
				continue
			}

			// Start reading messages in a goroutine
			go ws.readMessages()
		}
	}
}

// isConnected checks if the WebSocket connection is still valid
func (ws *Service) isConnected() bool {
	if ws.conn == nil {
		return false
	}

	// Send a ping to check connection
	err := ws.conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(time.Second))
	return err == nil
}

// readMessages handles incoming WebSocket messages
func (ws *Service) readMessages() {
	if ws.conn == nil {
		return
	}

	ws.logger.Info("Started reading WebSocket messages")

	for {
		_, message, err := ws.conn.ReadMessage()
		if err != nil {
			ws.logger.Error("WebSocket read error", zap.Error(err))
			ws.conn.Close()
			ws.conn = nil
			return
		}
		if len(message) < 1 {
			ws.logger.Debug("Received empty WebSocket message")
			continue
		}
		// Log message type for debugging
		ws.handleWebSocketEvent(message)
	}
}

func (ws *Service) RefreshAccountState(summonerState types.PartialSummonerRented) {
	username := ws.accountMonitor.GetLoggedInUsername()
	if username == "" {
		return
	}
	summonerState.Username = username

	ws.logger.Info("Manually refreshing account state", zap.String("username", username))
	summonerResponse, err := ws.accountsRepository.Save(summonerState)
	if err != nil {
		ws.logger.Error("Failed to manually update account from LCU", zap.Error(err))
		return
	}

	// Emit event to frontend
	if ws.app != nil {
		ws.app.EmitEvent(events.AccountStateChanged, summonerResponse)
	}
}

func (ws *Service) SubscribeToLeagueEvents() {
	ws.app.OnEvent(websocketEvent.LeagueWebsocketStart, func(event *application.CustomEvent) {
		ws.logger.Debug("Starting WebSocket service handlers")
		if event.Cancelled {
			ws.logger.Info("WebSocket service already started")
			return
		}

		// Define handlers with their paths
		handlers := []Manager{
			NewEventHandler("lol-inventory_v1_wallet", ws.handler.WalletEvent),
			// Add more handlers here
		}

		// Register each handler
		for _, handler := range handlers {
			path := handler.GetPath()
			ws.router.RegisterHandler(path, handler.Handle)
			err := ws.Subscribe(path)
			if err != nil {
				ws.logger.Error("Failed to subscribe to endpoint", zap.String("path", path), zap.Error(err))
			} else {
				ws.logger.Info("Successfully subscribed to endpoint", zap.String("path", path))
			}
		}
	})

	ws.app.OnEvent(websocketEvent.LeagueWebsocketStop, func(event *application.CustomEvent) {
		if event.Cancelled {
			ws.logger.Info("WebSocket service already stopped")
			return
		}

		// Unsubscribe from all subscriptions
		ws.mutex.Lock()
		paths := make([]string, 0, len(ws.subscriptions))
		for path := range ws.subscriptions {
			paths = append(paths, path)
		}
		ws.mutex.Unlock()

		for _, path := range paths {
			err := ws.Unsubscribe(path)
			if err != nil {
				ws.logger.Error("Failed to unsubscribe from endpoint", zap.String("path", path), zap.Error(err))
			} else {
				ws.logger.Info("Successfully unsubscribed from endpoint", zap.String("path", path))
			}
		}
	})
}
