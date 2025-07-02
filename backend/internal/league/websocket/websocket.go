package websocket

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"

	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account/events"
	websocketEvent "github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/event"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
)

// WebSocketConnection defines the interface for websocket connections
type WebSocketConnection interface {
	ReadMessage() (messageType int, p []byte, err error)
	WriteMessage(messageType int, data []byte) error
	WriteJSON(v interface{}) error
	WriteControl(messageType int, data []byte, deadline time.Time) error
	Close() error
}

// LeagueService interface
type LeagueService interface {
	IsRunning() bool
}

// LCUConnection defines the contract for the league client connection
type LCUConnection interface {
	IsClientInitialized() bool
	GetClient() (*resty.Client, error)
	GetLeagueCredentials() (string, string, string, error)
}

// AccountMonitor defines the contract for account monitoring
type AccountMonitor interface {
	GetLoggedInUsername(lastUsername string) string
}

// AccountsRepository defines the contract for account data operations
type AccountsRepository interface {
	Save(summoner types.PartialSummonerRented) (*types.SummonerResponse, error)
}

// AppInterface defines the contract for application interactions
type App interface {
	EmitEvent(name string, data ...any)
	OnEvent(name string, callback func(event *application.CustomEvent)) func()
}
type Handler interface {
	Wallet(event LCUWebSocketEvent)
	ChampionPurchase(event LCUWebSocketEvent)
	GameflowPhase(event LCUWebSocketEvent)
	ChampionPicked(event LCUWebSocketEvent)
	Restriction(event LCUWebSocketEvent)
	ReemitEvent(event LCUWebSocketEvent)
}

// RouterInterface defines the contract for the event router
type RouterService interface {
	RegisterHandler(path string, handler func(LCUWebSocketEvent))
	DeleteHandler(path string)
	Dispatch(event LCUWebSocketEvent)
}

// ManagerInterface defines the contract for the event handler manager
type ManagerService interface {
	NewEventHandler(path string, handler func(LCUWebSocketEvent)) EventHandler
}

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
	app            App
	accountClient  AccountsRepository
	conn           WebSocketConnection
	leagueService  LeagueService
	lcuConnection  LCUConnection
	accountMonitor AccountMonitor
	logger         *logger.Logger
	mutex          sync.Mutex
	isRunning      bool
	isSubscribed   bool
	stopChan       chan struct{}
	subscriptions  map[string]bool
	router         RouterService
	manager        ManagerService
	handler        Handler

	// Function fields for easier testing
	sendSubscriptionFunc   func(eventPath string) error
	sendUnsubscriptionFunc func(eventPath string) error
}

func NewService(
	logger *logger.Logger,
	accountMonitor AccountMonitor,
	leagueService LeagueService,
	lcuConnection LCUConnection,
	accountClient AccountsRepository,
	router RouterService,
	handler Handler,
	manager ManagerService,
) *Service {
	service := &Service{
		accountClient:  accountClient,
		logger:         logger,
		accountMonitor: accountMonitor,
		manager:        manager,
		leagueService:  leagueService,
		lcuConnection:  lcuConnection,
		stopChan:       make(chan struct{}),
		router:         router,
		handler:        handler,
		subscriptions:  make(map[string]bool),
	}

	// Initialize function fields with their implementations
	service.sendSubscriptionFunc = service.sendSubscriptionImpl
	service.sendUnsubscriptionFunc = service.sendUnsubscriptionImpl

	return service
}
func (s *Service) OnShutdown(ctx context.Context, options application.ServiceOptions) error {
	s.Stop()
	return nil
}

// Start begins the WebSocket service
func (s *Service) Start(app App) {
	s.app = app

	s.mutex.Lock()
	if s.isRunning {
		s.mutex.Unlock()
		return
	}
	s.isRunning = true
	s.mutex.Unlock()

	s.logger.Info("Starting WebSocket service")
	go s.runWebSocketLoop()
}

// Stop terminates the WebSocket service
func (s *Service) Stop() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if !s.isRunning {
		return
	}

	s.logger.Info("Stopping WebSocket service")
	close(s.stopChan)
	if s.conn != nil {
		s.conn.Close()
	}
	s.isRunning = false
}

// connectToLCUWebSocket establishes a WebSocket connection to the LCU
func (s *Service) connectToLCUWebSocket() error {
	// Get LCU credentials
	defer func() {
		if r := recover(); r != nil {
		}
	}()
	if !s.lcuConnection.IsClientInitialized() {
		_, err := s.lcuConnection.GetClient()
		if err != nil {
			return err
		}
	}

	// Create WebSocket URL

	dialer := websocket.DefaultDialer
	dialer.TLSClientConfig = &tls.Config{
		InsecureSkipVerify: true, // This is equivalent to NODE_TLS_REJECT_UNAUTHORIZED=0
	}
	headers := http.Header{}
	port, token, _, err := s.lcuConnection.GetLeagueCredentials()
	authHeader := base64.StdEncoding.EncodeToString([]byte("riot:" + token))
	headers.Add("Authorization", fmt.Sprintf("Basic %s", authHeader))

	u := url.URL{
		Scheme: "wss",

		Host: "127.0.0.1:" + port,
	}
	// Connect to WebSocket
	conn, _, err := dialer.Dial(u.String(), headers)
	if err != nil {
		return err
	}

	s.conn = conn
	s.logger.Info("Connected to LCU WebSocket")

	return s.resubscribeToEvents()
}

// Subscribe subscribes to a specific LCU event path
// Update the Subscribe method to properly track subscriptions
func (s *Service) Subscribe(eventPath string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Always record the subscription intent
	s.subscriptions[eventPath] = true

	if s.isConnectedUnsafe() {
		return s.sendSubscriptionFunc(eventPath)
	}

	// Don't report immediate success if we haven't actually subscribed yet
	s.logger.Debug(fmt.Sprintf("Queued subscription for when connection is established eventpath: %s", eventPath))
	return nil
}

// Unsubscribe removes subscription to a specific event path
func (s *Service) Unsubscribe(eventPath string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Remove from subscriptions
	delete(s.subscriptions, eventPath)

	s.router.DeleteHandler(eventPath)

	if s.conn != nil && s.isConnected() {
		return s.sendUnsubscriptionFunc(eventPath)
	}

	return nil
}

// sendSubscriptionImpl implements sending a subscription message to LCU websocket
func (s *Service) sendSubscriptionImpl(eventPath string) error {
	// Format according to WAMP 1.0 protocol (opcode 5 for subscribe)
	subscribeMsg := []byte(fmt.Sprintf(`[5, "%s"]`, eventPath))

	err := s.conn.WriteMessage(websocket.TextMessage, subscribeMsg)
	if err != nil {
		s.logger.Error("Failed to subscribe to event", zap.String("event", eventPath), zap.Error(err))
		return err
	}

	s.logger.Debug("Subscribed to event", zap.String("event", eventPath))
	return nil
}

// sendUnsubscriptionImpl implements sending an unsubscription message
func (s *Service) sendUnsubscriptionImpl(eventPath string) error {
	// Format according to WAMP 1.0 protocol (opcode 6 for unsubscribe)
	message := []interface{}{6, eventPath}
	err := s.conn.WriteJSON(message)
	if err != nil {
		s.logger.Error("Failed to unsubscribe from event", zap.String("event", eventPath), zap.Error(err))
		return err
	}

	s.logger.Info("Unsubscribed from event", zap.String("event", eventPath))
	return nil
}

// resubscribeToEvents resubscribes to all registered events after reconnection
func (s *Service) resubscribeToEvents() error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Then subscribe to each specific path
	for eventPath := range s.subscriptions {
		if err := s.sendSubscriptionFunc(eventPath); err != nil {
			return err
		}
	}

	return nil
}

// handleWebSocketEvent processes incoming WebSocket events
func (s *Service) handleWebSocketEvent(message []byte) {
	// Parse da mensagem WebSocket
	var event []interface{}
	if err := json.Unmarshal(message, &event); err != nil {
		s.logger.Error("Falha ao analisar mensagem WebSocket", zap.Error(err))
		return
	}

	// Verifica se tem formato válido (pelo menos 3 elementos)
	if len(event) < 3 {
		s.logger.Debug("Formato de mensagem WebSocket inválido", zap.String("mensagem", string(message)))
		return
	}

	// Verifica se é um evento (código 8)
	eventCode, ok := event[0].(float64)
	if !ok || eventCode != 8 {
		return
	}

	eventData, ok := event[2].(map[string]interface{})
	if !ok {
		s.logger.Error("Formato de dados do evento inválido")
		return
	}

	// Log informativo do evento
	if eventType, typeOk := eventData["eventType"].(string); typeOk {
		if uri, uriOk := eventData["uri"].(string); uriOk {
			s.logger.Info(fmt.Sprintf("%s %s", eventType, uri))
		}
	}
	eventTopic, ok := event[1].(string)
	if !ok {
		s.logger.Error("Formato de tópico do evento inválido")
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
			lcuEvent.Data = dataBytes
		}
	}

	s.router.Dispatch(lcuEvent)
}

// runWebSocketLoop manages the WebSocket connection and events
func (s *Service) runWebSocketLoop() {
	reconnectTicker := time.NewTicker(5 * time.Second)
	defer reconnectTicker.Stop()

	for {
		select {
		case <-s.stopChan:
			s.logger.Info("WebSocket loop terminated")
			return

		case <-reconnectTicker.C:
			s.mutex.Lock()
			isConnected := s.conn != nil && s.isConnectedUnsafe()
			s.mutex.Unlock()

			if !s.leagueService.IsRunning() || isConnected {
				continue
			}

			if err := s.connectToLCUWebSocket(); err != nil {
				s.logger.Debug("Failed to connect to LCU WebSocket", zap.Error(err))
				continue
			}

			go s.readMessages()
		}
	}
}
func (s *Service) isConnectedUnsafe() bool {
	if s.conn == nil {
		return false
	}

	err := s.conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(time.Second))
	return err == nil
}

// isConnected checks if the WebSocket connection is still valid
func (s *Service) isConnected() bool {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.isConnectedUnsafe()
}
func (s *Service) readMessages() {
	s.mutex.Lock()
	if s.conn == nil {
		s.mutex.Unlock()
		return
	}
	currentConn := s.conn
	s.mutex.Unlock()

	s.logger.Info("Started reading WebSocket messages")

	for {
		_, message, err := currentConn.ReadMessage()
		if err != nil {
			s.logger.Debug("WebSocket read error", zap.Error(err))

			s.mutex.Lock()
			if s.conn == currentConn {
				currentConn.Close()
				s.conn = nil
			}
			s.mutex.Unlock()
			return
		}

		if len(message) < 1 {
			continue
		}

		s.handleWebSocketEvent(message)
	}
}

func (s *Service) RefreshAccountState(summonerState types.PartialSummonerRented) {
	username := s.accountMonitor.GetLoggedInUsername(summonerState.Username)
	if username == "" {
		return
	}
	summonerState.Username = username

	s.logger.Info("Manually refreshing account state", zap.String("username", username))
	summonerResponse, err := s.accountClient.Save(summonerState)
	if err != nil {
		s.logger.Error("Failed to manually update account from LCU", zap.Error(err))
		return
	}

	// Emit event to frontend
	if s.app != nil {
		s.app.EmitEvent(events.AccountStateChanged, summonerResponse)
	}
}
func (s *Service) GetHandlers() []EventHandler {
	return []EventHandler{
		s.manager.NewEventHandler("OnJsonApiEvent_lol-inventory_v1_wallet", s.handler.Wallet),
		s.manager.NewEventHandler("OnJsonApiEvent_lol-gameflow_v1_gameflow-phase", s.handler.GameflowPhase),
		s.manager.NewEventHandler("OnJsonApiEvent_lol-inventory_v2_inventory", s.handler.ChampionPurchase),
		s.manager.NewEventHandler("OnJsonApiEvent_lol-champ-select_v1_grid-champions", s.handler.ChampionPicked),
		s.manager.NewEventHandler("OnJsonApiEvent_lol-champ-select_v1_skin-selector-info", s.handler.ReemitEvent),
		s.manager.NewEventHandler("OnJsonApiEvent_lol-leaver-buster_v1_ranked-restriction", s.handler.Restriction),
		s.manager.NewEventHandler("OnJsonApiEvent_lol-lobby-team-builder_champ-select_v1", s.handler.ReemitEvent),
		s.manager.NewEventHandler("OnJsonApiEvent_lol-summoner_v1_current-summoner", s.handler.ReemitEvent),
		s.manager.NewEventHandler("OnJsonApiEvent_lol-gameflow_v1_session", s.handler.ReemitEvent),
	}
}
func (s *Service) SubscribeToLeagueEvents() {
	s.app.OnEvent(websocketEvent.LeagueWebsocketStart, func(event *application.CustomEvent) {

		if s.isSubscribed {
			return
		}
		s.isSubscribed = true
		s.logger.Debug("Starting WebSocket service handlers")
		if event.Cancelled {
			s.logger.Info("WebSocket service already started")
			return
		}

		// Define handlers with their paths
		handlers := s.GetHandlers()
		// Register each handler
		for _, handler := range handlers {
			path := handler.GetPath()
			s.router.RegisterHandler(path, handler.Handle)
			err := s.Subscribe(path)
			if err != nil {
				s.logger.Error("Failed to subscribe to endpoint", zap.String("path", path), zap.Error(err))
			}
			s.logger.Info("Successfully subscribed to endpoint", zap.String("path", path))

		}
	})

	s.app.OnEvent(websocketEvent.LeagueWebsocketStop, func(event *application.CustomEvent) {
		if event.Cancelled {
			s.logger.Info("WebSocket service already stopped")
			return
		}
		s.isSubscribed = false

		// Unsubscribe from all subscriptions
		s.mutex.Lock()
		paths := make([]string, 0, len(s.subscriptions))
		for path := range s.subscriptions {
			paths = append(paths, path)
		}
		s.mutex.Unlock()

		for _, path := range paths {
			err := s.Unsubscribe(path)
			if err != nil {
				s.logger.Error("Failed to unsubscribe from endpoint", zap.String("path", path), zap.Error(err))
			} else {
				s.logger.Info("Successfully unsubscribed from endpoint", zap.String("path", path))
			}
		}
	})
}
