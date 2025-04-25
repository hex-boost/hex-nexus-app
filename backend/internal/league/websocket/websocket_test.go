package websocket

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account/events"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/event"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/wailsapp/wails/v3/pkg/application"
	"sync"
	"testing"
	"time"
)

// MockWebSocketConnection mocks the WebSocketConnection interface
type MockWebSocketConnection struct {
	mock.Mock
}

func (m *MockWebSocketConnection) ReadMessage() (messageType int, p []byte, err error) {
	args := m.Called()
	return args.Int(0), args.Get(1).([]byte), args.Error(2)
}

func (m *MockWebSocketConnection) WriteMessage(messageType int, data []byte) error {
	args := m.Called(messageType, data)
	return args.Error(0)
}

func (m *MockWebSocketConnection) WriteJSON(v interface{}) error {
	args := m.Called(v)
	return args.Error(0)
}

func (m *MockWebSocketConnection) WriteControl(messageType int, data []byte, deadline time.Time) error {
	args := m.Called(messageType, data, deadline)
	return args.Error(0)
}

func (m *MockWebSocketConnection) Close() error {
	args := m.Called()
	return args.Error(0)
}

// MockApp is a mock implementation of the Wails application
type MockApp struct {
	mock.Mock
}

func (m *MockApp) EmitEvent(name string, data ...any) {
	m.Called(name, data)
}

func (m *MockApp) OnEvent(name string, callback func(event *application.CustomEvent)) func() {
	args := m.Called(name, callback)
	return args.Get(0).(func())
}

// MockAccountsRepository implements the AccountsRepository interface
type MockAccountsRepository struct {
	mock.Mock
}

func (m *MockAccountsRepository) Save(summoner types.PartialSummonerRented) (*types.SummonerResponse, error) {
	args := m.Called(summoner)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*types.SummonerResponse), args.Error(1)
}

// MockHandler is a mock implementation of the HandlerInterface
type MockHandler struct {
	mock.Mock
}

func (m *MockHandler) WalletEvent(event LCUWebSocketEvent) {
	m.Called(event)
}

// MockLeagueService is a mock implementation of league.Service
type MockLeagueService struct {
	mock.Mock
}

func (m *MockLeagueService) IsRunning() bool {
	args := m.Called()
	return args.Bool(0)
}

type MockLCUConnection struct {
	mock.Mock
}

func (m *MockLCUConnection) GetLeagueCredentials() (string, string, string, error) {
	args := m.Called()
	return args.String(0), args.String(1), args.String(2), args.Error(3)
}

type MockRouter struct {
	mock.Mock
}

func (m *MockRouter) RegisterHandler(path string, handler func(LCUWebSocketEvent)) {
	m.Called(path, handler)
}

func (m *MockRouter) DeleteHandler(path string) {
	m.Called(path)
}

func (m *MockRouter) Dispatch(event LCUWebSocketEvent) {
	m.Called(event)
}

type MockManager struct {
	mock.Mock
}

func (m *MockManager) NewEventHandler(path string, handler func(LCUWebSocketEvent)) EventHandler {
	args := m.Called(path, handler)
	return args.Get(0).(EventHandler)
}

type MockAccountMonitor struct {
	mock.Mock
}

func (m *MockAccountMonitor) GetLoggedInUsername() string {
	args := m.Called()
	return args.String(0)
}

type MockEventHandler struct {
	Path    string
	Handler func(LCUWebSocketEvent)
}

func (m *MockEventHandler) GetPath() string {
	return m.Path
}

func (m *MockEventHandler) Handle(event LCUWebSocketEvent) {
	m.Handler(event)
}

// Make sure MockRouter implements RouterInterface
func TestCreateNewService(t *testing.T) {
	mockLogger := &logger.Logger{}
	mockAccountMonitor := new(MockAccountMonitor)
	mockLeagueService := new(MockLeagueService)
	mockLCUConnection := new(MockLCUConnection)
	mockAccountState := &account.State{}
	mockAccountRepo := new(MockAccountsRepository)
	mockRouter := new(MockRouter)
	mockHandler := new(MockHandler)
	mockManager := new(MockManager)

	service := NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountState,
		mockAccountRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)
	assert.NotNil(t, service)
	assert.Equal(t, mockLogger, service.logger)
	assert.Equal(t, mockAccountMonitor, service.accountMonitor)
	assert.Equal(t, mockLeagueService, service.leagueService)
	assert.Equal(t, mockAccountState, service.accountState)
	assert.Equal(t, mockAccountRepo, service.accountClient)
	assert.Equal(t, mockRouter, service.router)
	assert.Equal(t, mockHandler, service.handler)
	assert.Equal(t, mockManager, service.manager)
}

func TestServiceStartStopBehavior(t *testing.T) {
	// Create a proper logger instance
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})

	mockService := &Service{
		logger:    mockLogger,
		isRunning: false,
		stopChan:  make(chan struct{}),
	}

	// Test starting when not running
	mockService.Start()
	assert.True(t, mockService.isRunning)

	// Test starting when already running
	mockService.Start()
	assert.True(t, mockService.isRunning)

	// Test stopping when running
	mockService.Stop()
	assert.False(t, mockService.isRunning)

	// Test stopping when already stopped
	mockService.Stop()
	assert.False(t, mockService.isRunning)
}
func TestServiceSubscribeUnsubscribe(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{})
	mockRouter := new(MockRouter)

	service := &Service{
		logger:        mockLogger,
		router:        mockRouter,
		subscriptions: make(map[string]bool),
	}

	// Test subscribe without active connection
	err := service.Subscribe("test-path")
	assert.NoError(t, err)

	// Test unsubscribe
	mockRouter.On("DeleteHandler", "test-path").Return()
	err = service.Unsubscribe("test-path")
	assert.NoError(t, err)
	mockRouter.AssertExpectations(t)
}

func TestHandleWebSocketEvent(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{})
	mockRouter := new(MockRouter)

	service := &Service{
		logger: mockLogger,
		router: mockRouter,
	}

	// Valid event message
	validEventData := map[string]interface{}{
		"uri":       "test-uri",
		"eventType": "Update",
		"data":      map[string]interface{}{"key": "value"},
	}

	eventMessage, _ := json.Marshal([]interface{}{
		float64(8), // Event code
		"OnJsonApiEvent_test-path",
		validEventData,
	})

	mockRouter.On("Dispatch", mock.MatchedBy(func(event LCUWebSocketEvent) bool {
		return event.URI == "test-uri" && event.EventType == 1
	})).Return()

	service.handleWebSocketEvent(eventMessage)
	mockRouter.AssertExpectations(t)
}

func TestHandleInvalidWebSocketEvent(t *testing.T) {
	// Create a proper logger instance instead of an empty struct
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockRouter := new(MockRouter)

	service := &Service{
		logger: mockLogger,
		router: mockRouter,
	}

	// Too short message
	shortMessage, _ := json.Marshal([]interface{}{8, "topic"})
	service.handleWebSocketEvent(shortMessage)

	// Wrong event code
	wrongCodeMessage, _ := json.Marshal([]interface{}{7, "topic", map[string]interface{}{}})
	service.handleWebSocketEvent(wrongCodeMessage)

	// No dispatches should occur
	mockRouter.AssertNotCalled(t, "Dispatch", mock.Anything)
}
func TestRefreshAccountState(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{})
	mockApp := new(MockApp)
	mockMonitor := new(MockAccountMonitor)
	mockAccountRepo := new(MockAccountsRepository)

	username := "testUser"
	summonerState := types.PartialSummonerRented{}
	summonerResponse := &types.SummonerResponse{Username: username}

	service := &Service{
		logger:         mockLogger,
		app:            mockApp,
		accountMonitor: mockMonitor,
		accountClient:  mockAccountRepo,
	}

	mockMonitor.On("GetLoggedInUsername").Return(username)
	mockAccountRepo.On("Save", mock.MatchedBy(func(s types.PartialSummonerRented) bool {
		return s.Username == username
	})).Return(summonerResponse, nil)

	// Fix: Use mock.Anything for the variadic parameters
	mockApp.On("EmitEvent", events.AccountStateChanged, mock.Anything).Return()

	service.RefreshAccountState(summonerState)

	mockMonitor.AssertExpectations(t)
	mockAccountRepo.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}
func TestRefreshAccountStateWithEmptyUsername(t *testing.T) {
	mockLogger := &logger.Logger{}
	mockMonitor := new(MockAccountMonitor)
	mockAccountRepo := new(MockAccountsRepository)

	service := &Service{
		logger:         mockLogger,
		accountMonitor: mockMonitor,
		accountClient:  mockAccountRepo,
	}

	mockMonitor.On("GetLoggedInUsername").Return("")

	service.RefreshAccountState(types.PartialSummonerRented{})

	mockMonitor.AssertExpectations(t)
	mockAccountRepo.AssertNotCalled(t, "Save", mock.Anything)
}

func TestSubscribeToLeagueEvents(t *testing.T) {
	mockLogger := &logger.Logger{}
	mockApp := new(MockApp)
	mockHandler := new(MockHandler)
	mockManager := new(MockManager)
	mockRouter := new(MockRouter)

	service := &Service{
		logger:        mockLogger,
		app:           mockApp,
		handler:       mockHandler,
		manager:       mockManager,
		router:        mockRouter,
		subscriptions: make(map[string]bool),
	}

	// Fix: Return a dummy function for OnEvent calls
	dummyCleanupFunc := func() {}
	mockApp.On("OnEvent", event.LeagueWebsocketStart, mock.AnythingOfType("func(*application.CustomEvent)")).Return(dummyCleanupFunc)
	mockApp.On("OnEvent", event.LeagueWebsocketStop, mock.AnythingOfType("func(*application.CustomEvent)")).Return(dummyCleanupFunc)

	service.SubscribeToLeagueEvents()

	mockApp.AssertExpectations(t)
}
func TestIsConnected(t *testing.T) {
	mockLogger := &logger.Logger{}
	service := &Service{
		logger: mockLogger,
	}

	// Should be false when connection is nil
	assert.False(t, service.isConnected())
}

// Test isConnected with mock connection
func TestIsConnectedWithMock(t *testing.T) {
	mockLogger := &logger.Logger{}
	mockConn := new(MockWebSocketConnection)

	service := &Service{
		logger: mockLogger,
		conn:   mockConn,
	}

	// Test case 1: Connection working
	mockConn.On("WriteControl", websocket.PingMessage, []byte{}, mock.Anything).Return(nil).Once()
	assert.True(t, service.isConnected())

	// Test case 2: Connection failed
	mockConn.On("WriteControl", websocket.PingMessage, []byte{}, mock.Anything).Return(fmt.Errorf("connection closed")).Once()
	assert.False(t, service.isConnected())

	mockConn.AssertExpectations(t)
}

// Test connection cycle and reconnection mechanism
func TestWebSocketConnectionCycle(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockLeagueService := new(MockLeagueService)
	mockLCUConnection := new(MockLCUConnection)

	service := &Service{
		logger:        mockLogger,
		leagueService: mockLeagueService,
		lcuConnection: mockLCUConnection,
		stopChan:      make(chan struct{}),
		subscriptions: make(map[string]bool),
		mutex:         sync.Mutex{},
	}

	// Mock behavior for connection attempt
	port, token := "1234", "test-token"
	mockLeagueService.On("IsRunning").Return(true).Maybe()
	mockLCUConnection.On("GetLeagueCredentials").Return(port, token, "https", nil).Maybe()

	// Create a channel to signal when we should stop the service
	//stopSignal := make(chan struct{})

	// Start the service in a goroutine
	go func() {
		service.runWebSocketLoop()
	}()

	// Let the service run for a short time
	time.Sleep(100 * time.Millisecond)

	// Signal to stop and actually stop the service
	close(service.stopChan)

	// Wait for goroutine to complete
	time.Sleep(100 * time.Millisecond)
}

// Test error handling during connection
func TestConnectionErrorHandling(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockLeagueService := new(MockLeagueService)
	mockLCUConnection := new(MockLCUConnection)

	service := &Service{
		logger:        mockLogger,
		leagueService: mockLeagueService,
		lcuConnection: mockLCUConnection,
		stopChan:      make(chan struct{}),
		subscriptions: make(map[string]bool),
		mutex:         sync.Mutex{},
	}

	// Mock behavior for failed connection attempt
	mockLeagueService.On("IsRunning").Return(true)
	mockLCUConnection.On("GetLeagueCredentials").Return("", "", "", fmt.Errorf("connection error"))

	// Test connection error path
	err := service.connectToLCUWebSocket()

	assert.Error(t, err)
	mockLCUConnection.AssertExpectations(t)
}

// Test resubscribe behavior
func TestResubscribeToEvents(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})

	// Create a mock websocket connection
	mockConn := &websocket.Conn{}

	service := &Service{
		logger: mockLogger,
		conn:   mockConn,
		subscriptions: map[string]bool{
			"test-path-1": true,
			"test-path-2": true,
		},
		mutex: sync.Mutex{},
	}

	// Use a custom WebSocket implementation to capture sent messages
	sentMessages := []string{}

	// Store original function
	originalSendSubscription := service.sendSubscriptionFunc

	// Replace with test implementation
	service.sendSubscriptionFunc = func(eventPath string) error {
		sentMessages = append(sentMessages, eventPath)
		return nil
	}

	// Call resubscribe
	err := service.resubscribeToEvents()

	// Restore original function
	service.sendSubscriptionFunc = originalSendSubscription

	assert.NoError(t, err)
	assert.Equal(t, 2, len(sentMessages))
	assert.Contains(t, sentMessages, "test-path-1")
	assert.Contains(t, sentMessages, "test-path-2")
}

// Test event parsing and routing with various message formats
func TestHandleWebSocketEventFormats(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockRouter := new(MockRouter)

	service := &Service{
		logger: mockLogger,
		router: mockRouter,
	}

	// Test case 1: Valid message with Create event type
	validEventData := map[string]interface{}{
		"uri":       "test-uri",
		"eventType": "Create",
		"data":      map[string]interface{}{"key": "value"},
	}

	createEventMessage, _ := json.Marshal([]interface{}{
		float64(8), // Event code
		"OnJsonApiEvent_test-path",
		validEventData,
	})

	// Expect a dispatch with EventType = 0 (Create)
	mockRouter.On("Dispatch", mock.MatchedBy(func(event LCUWebSocketEvent) bool {
		return event.URI == "test-uri" && event.EventType == 0
	})).Return().Once()

	service.handleWebSocketEvent(createEventMessage)

	// Test case 2: Valid message with Delete event type
	deleteEventData := map[string]interface{}{
		"uri":       "test-uri",
		"eventType": "Delete",
		"data":      map[string]interface{}{"key": "value"},
	}

	deleteEventMessage, _ := json.Marshal([]interface{}{
		float64(8), // Event code
		"OnJsonApiEvent_test-path",
		deleteEventData,
	})

	// Expect a dispatch with EventType = 2 (Delete)
	mockRouter.On("Dispatch", mock.MatchedBy(func(event LCUWebSocketEvent) bool {
		return event.URI == "test-uri" && event.EventType == 2
	})).Return().Once()

	service.handleWebSocketEvent(deleteEventMessage)

	// Test case 3: Message with unknown event type
	unknownEventData := map[string]interface{}{
		"uri":       "test-uri",
		"eventType": "Unknown",
		"data":      map[string]interface{}{"key": "value"},
	}

	unknownEventMessage, _ := json.Marshal([]interface{}{
		float64(8), // Event code
		"OnJsonApiEvent_test-path",
		unknownEventData,
	})

	// Expect a dispatch with EventType = -1 (unknown)
	mockRouter.On("Dispatch", mock.MatchedBy(func(event LCUWebSocketEvent) bool {
		return event.URI == "test-uri" && event.EventType == -1
	})).Return().Once()

	service.handleWebSocketEvent(unknownEventMessage)

	mockRouter.AssertExpectations(t)
}

// Test event handler registration and routing
func TestEventHandlerRegistration(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockApp := new(MockApp)
	mockRouter := new(MockRouter)
	mockManager := new(MockManager)
	mockHandler := new(MockHandler)

	service := &Service{
		logger:        mockLogger,
		app:           mockApp,
		router:        mockRouter,
		manager:       mockManager,
		handler:       mockHandler,
		subscriptions: make(map[string]bool),
	}

	// Create a mock event handler
	testPath := "test-handler-path"
	mockEventHandler := &MockEventHandler{
		Path: testPath,
		Handler: func(event LCUWebSocketEvent) {
			// Handler logic
		},
	}

	// Setup expectations
	mockManager.On("NewEventHandler", "lol-inventory_v1_wallet", mock.AnythingOfType("func(websocket.LCUWebSocketEvent)")).
		Return(mockEventHandler)

	mockRouter.On("RegisterHandler", testPath, mock.AnythingOfType("func(websocket.LCUWebSocketEvent)")).Return()

	// Setup expectations for both event registrations
	mockApp.On("OnEvent", event.LeagueWebsocketStart, mock.AnythingOfType("func(*application.CustomEvent)")).
		Return(func() {})
	mockApp.On("OnEvent", event.LeagueWebsocketStop, mock.AnythingOfType("func(*application.CustomEvent)")).
		Return(func() {})

	// Subscribe to league events
	service.SubscribeToLeagueEvents()

	// Now manually trigger the start event callback
	for _, call := range mockApp.Calls {
		if call.Method == "OnEvent" && call.Arguments[0] == event.LeagueWebsocketStart {
			callback := call.Arguments[1].(func(*application.CustomEvent))
			callback(&application.CustomEvent{})
			break
		}
	}

	mockManager.AssertExpectations(t)
	mockRouter.AssertExpectations(t)
}

// Test the unsubscribe flow in the service
func TestUnsubscribeFlow(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockApp := new(MockApp)
	mockRouter := new(MockRouter)

	service := &Service{
		logger:        mockLogger,
		app:           mockApp,
		router:        mockRouter,
		subscriptions: map[string]bool{"test-path": true},
	}

	// Setup expectations for both event registrations
	mockApp.On("OnEvent", event.LeagueWebsocketStart, mock.AnythingOfType("func(*application.CustomEvent)")).
		Return(func() {})
	mockApp.On("OnEvent", event.LeagueWebsocketStop, mock.AnythingOfType("func(*application.CustomEvent)")).
		Return(func() {})

	mockRouter.On("DeleteHandler", "test-path").Return()

	// Subscribe to events to register the unsubscribe handler
	service.SubscribeToLeagueEvents()

	// Now manually trigger the stop event callback
	for _, call := range mockApp.Calls {
		if call.Method == "OnEvent" && call.Arguments[0] == event.LeagueWebsocketStop {
			callback := call.Arguments[1].(func(*application.CustomEvent))
			callback(&application.CustomEvent{})
			break
		}
	}

	mockRouter.AssertExpectations(t)
}

// Test subscriptionMessages with mock connection
func TestSubscriptionMessagesWithMock(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockConn := new(MockWebSocketConnection)

	service := &Service{
		logger: mockLogger,
		conn:   mockConn,
	}

	// Initialize the function fields
	service.sendSubscriptionFunc = service.sendSubscriptionImpl
	service.sendUnsubscriptionFunc = service.sendUnsubscriptionImpl

	// Test sendSubscription
	mockConn.On("WriteMessage", websocket.TextMessage, mock.MatchedBy(func(data []byte) bool {
		return string(data) == `[5, "OnJsonApiEvent_test-path"]`
	})).Return(nil).Once()

	err := service.sendSubscriptionFunc("test-path")
	assert.NoError(t, err)

	// Test sendUnsubscription - Fix by using exact value match instead of matcher
	mockConn.On("WriteJSON", []interface{}{6, "test-path"}).Return(nil).Once()

	err = service.sendUnsubscriptionFunc("test-path")
	assert.NoError(t, err)

	mockConn.AssertExpectations(t)
}

// Test readMessages with mock connection
func TestReadMessages(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockConn := new(MockWebSocketConnection)
	mockRouter := new(MockRouter)

	service := &Service{
		logger: mockLogger,
		conn:   mockConn,
		router: mockRouter,
	}

	// Setup the mock to return one message then an error
	validEventData := map[string]interface{}{
		"uri":       "test-uri",
		"eventType": "Update",
		"data":      map[string]interface{}{"key": "value"},
	}
	eventMessage, _ := json.Marshal([]interface{}{
		float64(8),
		"OnJsonApiEvent_test-path",
		validEventData,
	})

	mockConn.On("ReadMessage").Return(websocket.TextMessage, eventMessage, nil).Once()
	mockConn.On("ReadMessage").Return(0, []byte{}, fmt.Errorf("connection closed")).Once()
	mockConn.On("Close").Return(nil).Once()

	mockRouter.On("Dispatch", mock.MatchedBy(func(event LCUWebSocketEvent) bool {
		return event.URI == "test-uri" && event.EventType == 1
	})).Return().Once()

	// Call readMessages in a goroutine as it loops until connection error
	done := make(chan bool)
	go func() {
		service.readMessages()
		done <- true
	}()

	// Wait for readMessages to finish
	select {
	case <-done:
		// Success - function exited
	case <-time.After(time.Second):
		t.Fatal("readMessages did not exit in time")
	}

	mockConn.AssertExpectations(t)
	mockRouter.AssertExpectations(t)
}
