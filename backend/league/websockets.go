package league

import (
	"crypto/tls"
	"encoding/json"
	"github.com/gorilla/websocket"
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
const (
	Create = iota
	Update
	Delete
)

func (e EventType) String() string {
	switch e {
	case Create:
		return "Create"
	case Update:
		return "Update"
	case Delete:
		return "Delete"
	default:
		return "Unknown"
	}
}

// EventType represents possible event types
type EventType int

// LCUWebSocketEvent represents the structure of LCU WebSocket events
type LCUWebSocketEvent struct {
	Data      json.RawMessage `json:"data"`
	EventType EventType       `json:"eventType"`
	URI       string          `json:"uri"`
}

// WebSocketService handles the LCU websocket connection and events
type WebSocketService struct {
	app              *application.App
	conn             *websocket.Conn
	leagueService    *LeagueService
	accountMonitor   *AccountMonitor
	logger           *utils.Logger
	mutex            sync.Mutex
	isRunning        bool
	stopChan         chan struct{}
	reconnectBackoff time.Duration
	lastUsername     string
	subscriptions    map[string]bool
	eventHandlers    map[string][]func(LCUWebSocketEvent)
}

// NewWebSocketService creates a new WebSocket service
func NewWebSocketService(
	logger *utils.Logger,
	accountMonitor *AccountMonitor,
	leagueService *LeagueService,
) *WebSocketService {
	return &WebSocketService{
		logger:           logger,
		accountMonitor:   accountMonitor,
		leagueService:    leagueService,
		stopChan:         make(chan struct{}),
		reconnectBackoff: 2 * time.Second,
		subscriptions:    make(map[string]bool),
		eventHandlers:    make(map[string][]func(LCUWebSocketEvent)),
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

	err = ws.SubscribeToOnJsonApiEvent()
	if err != nil {
		ws.logger.Error("Failed to subscribe to OnJsonApiEvent", zap.Error(err))
		return err
	}
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
	message := []interface{}{5, eventPath}
	err := ws.conn.WriteJSON(message)
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

	// First subscribe to OnJsonApiEvent if we have specific paths registered
	if len(ws.subscriptions) > 0 {
		if err := ws.sendSubscription("OnJsonApiEvent"); err != nil {
			return err
		}
	}

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
	// First log the message size for debugging
	ws.logger.Info("Received WebSocket message",
		zap.Int("size", len(message)),
		zap.String("preview", string(message[:min(100, len(message))])))
	var event []json.RawMessage
	if err := json.Unmarshal(message, &event); err != nil {
		ws.logger.Error("Failed to parse WebSocket event array", zap.Error(err))
		return
	}

	// WAMP message should have at least 2 elements
	if len(event) < 2 {
		return
	}

	// Check event type (should be 8 for LCU events)
	var eventType int
	if err := json.Unmarshal(event[0], &eventType); err != nil {
		ws.logger.Error("Failed to parse event type", zap.Error(err))
		return
	}

	if eventType != 8 {
		return
	}

	// Check if this is a JSON API event
	var eventName string
	if err := json.Unmarshal(event[1], &eventName); err != nil {
		ws.logger.Error("Failed to parse event name", zap.Error(err))
		return
	}

	if eventName != "OnJsonApiEvent" || len(event) < 3 {
		return
	}

	// Parse the actual event data
	var lcuEvent LCUWebSocketEvent
	if err := json.Unmarshal(event[2], &lcuEvent); err != nil {
		ws.logger.Error("Failed to parse LCU event data", zap.Error(err))
		return
	}

	ws.logger.Debug("Received LCU event",
		zap.String("uri", lcuEvent.URI),
		zap.String("eventType", lcuEvent.EventType))

	// Process event with registered handlers
	ws.triggerEventHandlers(lcuEvent)
}

// triggerEventHandlers calls all registered handlers for an event
func (ws *WebSocketService) triggerEventHandlers(event LCUWebSocketEvent) {
	ws.mutex.Lock()
	defer ws.mutex.Unlock()

	// First check for exact URI match
	if handlers, ok := ws.eventHandlers[event.URI]; ok {
		for _, handler := range handlers {
			go handler(event)
		}
	}

	// Then check for pattern matches
	for path, handlers := range ws.eventHandlers {
		// Skip exact matches as they were handled above
		if path == event.URI {
			continue
		}

		// If path is a pattern that matches the URI, call handlers
		if pathMatches(path, event.URI) {
			for _, handler := range handlers {
				go handler(event)
			}
		}
	}

	// Handle specific events we care about in the default implementation
	if event.URI == "/lol-summoner/v1/current-summoner" {
		ws.handleSummonerChange(event)
	} else if strings.Contains(event.URI, "/lol-champions/v1/inventories/") &&
		strings.Contains(event.URI, "/champions-playable-count") {
		ws.handleChampionsUpdate(event)
	}
}

// pathMatches checks if a URI matches a pattern
// Examples:
// - "/path/*" matches "/path/something" but not "/other/path"
// - "/path/*/subpath" matches "/path/something/subpath"
func pathMatches(pattern, uri string) bool {
	// Convert pattern to regex style
	if !strings.Contains(pattern, "*") {
		return pattern == uri
	}

	patternParts := strings.Split(pattern, "/")
	uriParts := strings.Split(uri, "/")

	if len(patternParts) > len(uriParts) {
		return false
	}

	for i, part := range patternParts {
		if i >= len(uriParts) {
			return false
		}

		if part == "*" {
			continue // Wildcard matches anything
		}

		if part != uriParts[i] {
			return false
		}
	}

	// If pattern had fewer parts, it matches only if it's a prefix
	return len(patternParts) == len(uriParts) || strings.HasSuffix(pattern, "/*")
}

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
		// Update account data
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

	// Trigger account refresh to update champion data in our system
	ws.RefreshAccountState()
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

		ws.handleWebSocketEvent(message)
	}
}

func (ws *WebSocketService) RefreshAccountState() {
	username := ws.accountMonitor.GetLoggedInUsername()
	if username == "" || !ws.leagueService.IsLCUConnectionReady() {
		return
	}

	ws.logger.Info("Manually refreshing account state", zap.String("username", username))
	err := ws.leagueService.UpdateFromLCU(username)
	if err != nil {
		ws.logger.Error("Failed to manually update account from LCU", zap.Error(err))
		return
	}

	// Emit event to frontend
	if ws.app != nil {
		ws.app.EmitEvent(EventAccountStateChanged)
	}
}
func (ws *WebSocketService) HandleOnJsonApiEvent(event LCUWebSocketEvent) {
	ws.logger.Info("Received OnJsonApiEvent", zap.String("uri", event.URI), zap.Any("data", event.Data))

	// Call the registered handlers for this event
}

// SubscribeToOnJsonApiEvent subscribes to all JSON API events
func (ws *WebSocketService) SubscribeToOnJsonApiEvent() error {
	return ws.Subscribe("OnJsonApiEvent", ws.HandleOnJsonApiEvent)
}

// SubscribeToPath subscribes to a specific LCU endpoint path
func (ws *WebSocketService) SubscribeToPath(path string, handler func(LCUWebSocketEvent)) error {
	// Make sure we're subscribed to the main event first
	if err := ws.SubscribeToOnJsonApiEvent(); err != nil {
		return err
	}

	// Then subscribe to the specific path
	return ws.Subscribe(path, handler)
}
func (ws *WebSocketService) handleLolBlueEssence(event LCUWebSocketEvent) {
	ws.logger.Info("Received LOL Blue Essence event", zap.String("uri", event.URI), zap.Any("data", event.Data))
	return

}
func (ws *WebSocketService) SubscribeToLeagueEvents() {
	ws.app.OnEvent(LeagueWebsocketStartHandlers, func(event *application.CustomEvent) {
		if event.Cancelled {
			ws.logger.Info("WebSocket service already started")
			return
		}
		err := ws.SubscribeToPath("/lol-inventory/v1/wallet/lol_blue_essence", ws.handleLolBlueEssence)
		if err != nil {
			ws.logger.Error("Failed to subscribe to LOL Blue Essence", zap.Error(err))
			return
		}

	})
	ws.app.OnEvent(LeagueWebsocketStopHandlers, func(event *application.CustomEvent) {
		if event.Cancelled {
			ws.logger.Info("WebSocket service already stopped")
			return
		}

	})
}
