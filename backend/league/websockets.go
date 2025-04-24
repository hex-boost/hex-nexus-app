package league

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

// Define events
const (
	EventAccountStateChanged     = "account:state:changed"
	LeagueWebsocketStartHandlers = "league:websocket:start"
	LeagueWebsocketStopHandlers  = "league:websocket:stop"
)
const JsonApiPrefix = "OnJsonApiEvent_"
const (
	Create = iota
	Update
	Delete
)

type LCUWebSocketEvent struct {
	Data       json.RawMessage `json:"data"`
	EventType  int             `json:"eventType"` // Valor numérico do LCU
	URI        string          `json:"uri"`
	EventTopic string          `json:"eventTopic"` // Armazena o valor do tópico (OnJsonApiEvent_*)
}

// EventType represents possible event types
type EventType int

// LCUWebSocketEvent represents the structure of LCU WebSocket events

// WebSocketService handles the LCU websocket connection and events
type WebSocketService struct {
	app                *application.App
	accountsRepository *repository.AccountsRepository
	conn               *websocket.Conn
	leagueService      *LeagueService
	accountMonitor     *AccountMonitor
	logger             *utils.Logger
	mutex              sync.Mutex
	isRunning          bool
	stopChan           chan struct{}
	accountState       *AccountState
	reconnectBackoff   time.Duration
	lastUsername       string
	subscriptions      map[string]bool
	eventHandlers      map[string][]func(LCUWebSocketEvent)
}

// NewWebSocketService creates a new WebSocket service
func NewWebSocketService(
	logger *utils.Logger,
	accountMonitor *AccountMonitor,
	leagueService *LeagueService,
	accountState *AccountState,
	accountsRepository *repository.AccountsRepository,
) *WebSocketService {
	return &WebSocketService{
		accountsRepository: accountsRepository,
		logger:             logger,
		accountMonitor:     accountMonitor,
		leagueService:      leagueService,
		accountState:       accountState,
		stopChan:           make(chan struct{}),
		reconnectBackoff:   2 * time.Second,
		subscriptions:      make(map[string]bool),
		eventHandlers:      make(map[string][]func(LCUWebSocketEvent)),
	}
}

// SetWindow associates the WebSocket service with a Wails window
func (ws *WebSocketService) SetWindow(app *application.App) {
	ws.app = app
}

// Start begins the WebSocket service
func (ws *WebSocketService) Start() {
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
func (ws *WebSocketService) Stop() {
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
func (ws *WebSocketService) connectToLCUWebSocket() error {
	// Get LCU credentials
	defer func() {
		if r := recover(); r != nil {

		}
	}()
	port, _, _, err := ws.leagueService.LCUconnection.getLeagueCredentials()
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

	headers.Add("Authorization", ws.leagueService.LCUconnection.client.Header.Get("Authorization"))

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
func (ws *WebSocketService) Subscribe(eventPath string, handler func(LCUWebSocketEvent)) error {
	ws.mutex.Lock()
	defer ws.mutex.Unlock()

	// Add to subscriptions map
	ws.subscriptions[eventPath] = true

	// Register handler
	if handler != nil {
		ws.eventHandlers[eventPath] = append(ws.eventHandlers[eventPath], handler)
	}

	// If already connected, send subscription
	if ws.conn != nil && ws.isConnected() {
		return ws.sendSubscription(eventPath)
	}

	return nil
}

// Unsubscribe removes subscription to a specific event path
func (ws *WebSocketService) Unsubscribe(eventPath string) error {
	ws.mutex.Lock()
	defer ws.mutex.Unlock()

	// Remove from subscriptions
	delete(ws.subscriptions, eventPath)

	// Remove handlers
	delete(ws.eventHandlers, eventPath)

	// If connected, send unsubscription
	if ws.conn != nil && ws.isConnected() {
		return ws.sendUnsubscription(eventPath)
	}

	return nil
}

// sendSubscription sends a subscription message to LCU websocket
func (ws *WebSocketService) sendSubscription(eventPath string) error {
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
func (ws *WebSocketService) sendUnsubscription(eventPath string) error {
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
func (ws *WebSocketService) resubscribeToEvents() error {
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
func (ws *WebSocketService) handleWebSocketEvent(message []byte) {
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

	go ws.handleLCUEvent(lcuEvent)
}

// triggerEventHandlers calls all registered handlers for an event

// handleSummonerChange processes summoner change events
func (ws *WebSocketService) handleSummonerChange(event LCUWebSocketEvent) {
	// Extract summoner data
	var summonerData map[string]interface{}
	if err := json.Unmarshal(event.Data, &summonerData); err != nil {
		ws.logger.Error("Failed to parse summoner data", zap.Error(err))
		return
	}

	username, ok := summonerData["displayName"].(string)
	if !ok || username == "" {
		return
	}

	// Skip if username is same as last processed
	if username == ws.lastUsername {
		return
	}

	ws.lastUsername = username
	ws.logger.Info("Detected account change", zap.String("username", username))

	// Ensure LCU connection is ready before updating
	if ws.leagueService.IsLCUConnectionReady() {
		err := ws.leagueService.UpdateFromLCU(username)
		if err != nil {
			ws.logger.Error("Failed to update account from LCU", zap.Error(err))
			return
		}

		// Emit event to frontend
		if ws.app != nil {
			ws.app.EmitEvent(EventAccountStateChanged, map[string]string{
				"username": username,
				"status":   "updated",
			})
		}

		ws.logger.Info("Account data updated successfully",
			zap.String("username", username))
	}
}

// handleChampionsUpdate processes champion inventory updates
func (ws *WebSocketService) handleChampionsUpdate(event LCUWebSocketEvent) {
	var champData map[string]interface{}
	if err := json.Unmarshal(event.Data, &champData); err != nil {
		ws.logger.Error("Failed to parse champion data", zap.Error(err))
		return
	}

	ws.logger.Info("Champions data updated",
		zap.Any("owned", champData["championsOwned"]),
		zap.Any("freeToPlay", champData["championsFreeToPlay"]))

	ws.RefreshAccountState(types.PartialSummonerRented{})
}

// runWebSocketLoop manages the WebSocket connection and events
func (ws *WebSocketService) runWebSocketLoop() {
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
func (ws *WebSocketService) isConnected() bool {
	if ws.conn == nil {
		return false
	}

	// Send a ping to check connection
	err := ws.conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(time.Second))
	return err == nil
}

// readMessages handles incoming WebSocket messages
func (ws *WebSocketService) readMessages() {
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

func (ws *WebSocketService) RefreshAccountState(summonerState types.PartialSummonerRented) {
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
		ws.app.EmitEvent(EventAccountStateChanged, summonerResponse)
	}
}

func (ws *WebSocketService) SubscribeToLeagueEvents() {
	ws.app.OnEvent(LeagueWebsocketStartHandlers, func(event *application.CustomEvent) {
		ws.logger.Debug("Starting WebSocket service handlers")
		if event.Cancelled {
			ws.logger.Info("WebSocket service already started")
			return
		}

		ws.mutex.Lock()
		ws.eventHandlers = make(map[string][]func(LCUWebSocketEvent))
		ws.mutex.Unlock()
		paths := []string{
			"lol-inventory_v1_wallet",
		}

		for _, path := range paths {
			err := ws.Subscribe(path, ws.handleLCUEvent)
			if err != nil {
				ws.logger.Error("Failed to subscribe to endpoint", zap.String("path", path), zap.Error(err))
			} else {
				ws.logger.Info("Successfully subscribed to endpoint", zap.String("path", path))
			}
		}
	})

	ws.app.OnEvent(LeagueWebsocketStopHandlers, func(event *application.CustomEvent) {
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

// handleLCUEvent is a generic handler for LCU events
func (ws *WebSocketService) handleLCUEvent(event LCUWebSocketEvent) {
	// Log all events at debug level
	ws.logger.Info("Received LCU event",
		zap.String("uri", event.URI),
		zap.Int("eventType", event.EventType))

	// Process specific event types based on URI path
	if strings.Contains(event.URI, "/lol-inventory/v1/wallet/lol_blue_essence") {
		ws.handleWalletEvent(event)
	} else if strings.Contains(event.URI, "/lol-champions/v1/inventories") {
		ws.handleChampionsUpdate(event)
	} else if event.URI == "/lol-summoner/v1/current-summoner" {
		ws.handleSummonerChange(event)
	} else if event.URI == "/lol-champ-select/v1/session" {
		ws.handleChampSelectSession(event)
	} else if event.URI == "/lol-gameflow/v1/gameflow-phase" {
		ws.handleGameflowPhase(event)
	}

	if ws.app != nil {
		ws.app.EmitEvent("lcu:event:"+strings.Replace(event.URI, "/", ":", -1), map[string]interface{}{
			"uri":       event.URI,
			"eventType": event.EventType,
			"data":      event.Data,
		})
	}
}

// handleWalletEvent handles wallet-related events (RP, Blue Essence, etc.)
func (ws *WebSocketService) handleWalletEvent(event LCUWebSocketEvent) {
	ws.logger.Info("Received wallet event", zap.String("uri", event.URI))

	var walletData types.Wallet
	if err := json.Unmarshal(event.Data, &walletData); err != nil {
		ws.logger.Error("Failed to parse wallet data", zap.Error(err))
		return
	}

	// Log wallet information
	ws.logger.Info("Wallet update", zap.Any("data", walletData))

	// Extract blue essence value
	blueEssence := walletData.LolBlueEssence
	currentAccount := ws.accountState.GetCurrentAccount()
	if currentAccount == nil {
		return
	}

	needsUpdate := true
	if currentAccount.Currencies != nil &&
		currentAccount.Currencies.LolBlueEssence != nil &&
		*currentAccount.Currencies.LolBlueEssence == blueEssence {
		needsUpdate = false
	}

	if needsUpdate {
		ws.accountState.UpdateWalletData(blueEssence)

		summonerRented := types.PartialSummonerRented{
			Currencies: &types.CurrenciesPointer{LolBlueEssence: &blueEssence},
		}
		ws.RefreshAccountState(summonerRented)
	} else {
		ws.logger.Debug("Blue essence unchanged, skipping refresh",
			zap.Int("value", blueEssence))
	}
}

// handleChampSelectSession handles champion select events
func (ws *WebSocketService) handleChampSelectSession(event LCUWebSocketEvent) {
	ws.logger.Debug("Received champ select session event")

	// Process champ select session data if needed
	// This could include tracking champion picks, bans, etc.
}

// handleGameflowPhase handles game flow phase changes
func (ws *WebSocketService) handleGameflowPhase(event LCUWebSocketEvent) {
	var phase string
	if err := json.Unmarshal(event.Data, &phase); err != nil {
		ws.logger.Error("Failed to parse gameflow phase", zap.Error(err))
		return
	}

	ws.logger.Info("Game flow phase changed", zap.String("phase", phase))
}
