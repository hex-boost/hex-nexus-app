package websocket_test

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	gorillaWs "github.com/gorilla/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/mocks"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/wailsapp/wails/v3/pkg/application"

	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account/events"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/event"
	"github.com/hex-boost/hex-nexus-app/backend/types"
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

type MockEventHandler struct {
	Path    string
	Handler func(socketEvent websocket.LCUWebSocketEvent)
}

func (m *MockEventHandler) GetPath() string {
	return m.Path
}

func (m *MockEventHandler) Handle(event websocket.LCUWebSocketEvent) {
	m.Handler(event)
}

func TestServiceStartStopBehavior(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockApp := new(MockApp)
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	// Create service using the proper constructor
	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// Test starting when not running
	service.Start(mockApp)
	assert.True(t, service.IsRunning())

	// Test starting when already running
	service.Start(mockApp)
	assert.True(t, service.IsRunning())

	// Test stopping when running
	service.Stop()
	assert.False(t, service.IsRunning())

	// Test stopping when already stopped
	service.Stop()
	assert.False(t, service.IsRunning())
}

func TestServiceSubscribeUnsubscribe(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// Test subscribe without active connection
	err := service.Subscribe("test-path")
	assert.NoError(t, err)

	// Test unsubscribe
	mockRouter.EXPECT().DeleteHandler("test-path").Return()
	err = service.Unsubscribe("test-path")
	assert.NoError(t, err)
	mockRouter.AssertExpectations(t)
}

func TestHandleWebSocketEvent(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

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

	mockRouter.EXPECT().Dispatch(mock.MatchedBy(func(event websocket.LCUWebSocketEvent) bool {
		return event.URI == "test-uri" && event.EventType == 1
	})).Return()

	// Use the exported method to handle the event
	service.HandleWebsocketEvent(eventMessage)
	mockRouter.AssertExpectations(t)
}

func TestHandleInvalidWebSocketEvent(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// Too short message
	shortMessage, _ := json.Marshal([]interface{}{8, "topic"})
	service.HandleWebsocketEvent(shortMessage)

	// Wrong event code
	wrongCodeMessage, _ := json.Marshal([]interface{}{7, "topic", map[string]interface{}{}})
	service.HandleWebsocketEvent(wrongCodeMessage)

	// No dispatches should occur
	mockRouter.AssertExpectations(t)
}

func TestRefreshAccountState(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{})
	mockApp := new(MockApp)
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	username := "testUser"
	summonerState := types.PartialSummonerRented{}
	summonerResponse := &types.SummonerResponse{Username: username}

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	mockAccountMonitor.EXPECT().GetLoggedInUsername().Return(username)
	mockAccountsRepo.EXPECT().Save(mock.MatchedBy(func(s types.PartialSummonerRented) bool {
		return s.Username == username
	})).Return(summonerResponse, nil)

	// Fix: Use mock.Anything for the variadic parameters
	mockApp.On("EmitEvent", events.AccountStateChanged, []interface{}{summonerResponse}).Return()

	service.RefreshAccountState(summonerState)
}

func TestRefreshAccountStateWithEmptyUsername(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	mockAccountMonitor.EXPECT().GetLoggedInUsername().Return("")

	service.RefreshAccountState(types.PartialSummonerRented{})

	mockAccountMonitor.AssertExpectations(t)
}

func TestSubscribeToLeagueEvents(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{})
	mockApp := new(MockApp)
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// Fix: Return a dummy function for OnEvent calls
	dummyCleanupFunc := func() {}
	mockApp.On("OnEvent", event.LeagueWebsocketStart, mock.AnythingOfType("func(*application.CustomEvent)")).Return(dummyCleanupFunc)
	mockApp.On("OnEvent", event.LeagueWebsocketStop, mock.AnythingOfType("func(*application.CustomEvent)")).Return(dummyCleanupFunc)
	service.SetApp(mockApp)

	service.SubscribeToLeagueEvents()

	mockApp.AssertExpectations(t)
}

func TestIsConnected(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// Should return false when no connection is established
	assert.False(t, service.IsConnected())
}

func TestIsConnectedWithMock(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)
	mockConn := new(MockWebSocketConnection)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// We need to set the connection field for this test - use a helper method if available
	websocket.SetTestConnection(service, mockConn)

	// Test case 1: Connection working
	mockConn.On("WriteControl", gorillaWs.PingMessage, []byte{}, mock.Anything).Return(nil).Once()
	assert.True(t, service.IsConnected())

	// Test case 2: Connection failed
	mockConn.On("WriteControl", gorillaWs.PingMessage, []byte{}, mock.Anything).Return(fmt.Errorf("connection closed")).Once()
	assert.False(t, service.IsConnected())

	mockConn.AssertExpectations(t)
}

func TestWebSocketConnectionCycle(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// Mock behavior for connection attempt
	port, token := "1234", "test-token"
	mockLeagueService.EXPECT().IsRunning().Return(true).Maybe()
	mockLCUConnection.EXPECT().GetLeagueCredentials().Return(port, token, "https", nil).Maybe()

	// Start the service and run for a short time
	go func() {
		service.RunWebSocketLoop() // Assuming this is an exported method for testing
	}()

	// Let the service run for a short time
	time.Sleep(100 * time.Millisecond)

	// Signal to stop and actually stop the service
	service.Stop()

	// Wait for goroutine to complete
	time.Sleep(100 * time.Millisecond)
}

func TestConnectionErrorHandling(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// Mock behavior for failed connection attempt
	mockLCUConnection.EXPECT().IsClientInitialized().Return(false)
	mockLCUConnection.EXPECT().Initialize().Return(nil)
	mockLCUConnection.EXPECT().GetLeagueCredentials().Return("", "", "", fmt.Errorf("connection error"))

	// Test connection error path
	err := service.ConnectToLCUWebSocket()

	assert.Error(t, err)
	mockLCUConnection.AssertExpectations(t)
}

func TestResubscribeToEvents(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)
	mockConn := mocks.NewWebSocketConnection(t)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// We need to add subscriptions and set the connection for testing
	websocket.SetTestConnection(service, mockConn)
	websocket.AddTestSubscription(service, "test-path-1")
	websocket.AddTestSubscription(service, "test-path-2")

	// Set up expectations for the subscription messages
	mockConn.EXPECT().WriteMessage(gorillaWs.TextMessage, mock.MatchedBy(func(data []byte) bool {
		return string(data) == `[5, "OnJsonApiEvent_test-path-1"]` || string(data) == `[5, "OnJsonApiEvent_test-path-2"]`
	})).Return(nil).Times(2)

	// Call resubscribe
	err := service.ResubscribeToEvents() // Assuming this is an exported method for testing

	assert.NoError(t, err)
}

func TestHandleWebsocketEventFormats(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

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
	mockRouter.EXPECT().Dispatch(mock.MatchedBy(func(event websocket.LCUWebSocketEvent) bool {
		return event.URI == "test-uri" && event.EventType == 0
	})).Return().Once()

	service.HandleWebsocketEvent(createEventMessage)

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
	mockRouter.EXPECT().Dispatch(mock.MatchedBy(func(event websocket.LCUWebSocketEvent) bool {
		return event.URI == "test-uri" && event.EventType == 2
	})).Return().Once()

	service.HandleWebsocketEvent(deleteEventMessage)

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
	mockRouter.EXPECT().Dispatch(mock.MatchedBy(func(event websocket.LCUWebSocketEvent) bool {
		return event.URI == "test-uri" && event.EventType == -1
	})).Return().Once()

	service.HandleWebsocketEvent(unknownEventMessage)

	mockRouter.AssertExpectations(t)
}

func TestEventHandlerRegistration(t *testing.T) {
	// Setup minimal mocks needed for registration test
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockApp := new(MockApp)
	mockRouter := mocks.NewRouterService(t)
	mockManager := mocks.NewManagerService(t)

	// Other required dependencies
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)

	// Create service
	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// Create mock event handlers
	mockEventHandlers := []websocket.EventHandler{
		&MockEventHandler{
			Path:    "path1",
			Handler: func(event websocket.LCUWebSocketEvent) {},
		},
		&MockEventHandler{
			Path:    "path2",
			Handler: func(event websocket.LCUWebSocketEvent) {},
		},
	}

	// Setup manager to return our handlers, regardless of what path is requested
	// First call returns first handler, second call returns second handler
	mockManager.EXPECT().NewEventHandler(mock.Anything, mock.Anything).Return(mockEventHandlers[0]).Once()
	mockManager.EXPECT().NewEventHandler(mock.Anything, mock.Anything).Return(mockEventHandlers[1]).Once()

	// Setup router to expect registration for both handlers with their respective paths
	mockRouter.EXPECT().RegisterHandler("path1", mock.Anything).Return().Once()
	mockRouter.EXPECT().RegisterHandler("path2", mock.Anything).Return().Once()

	// Setup expectations for event registrations
	mockApp.On("OnEvent", event.LeagueWebsocketStart, mock.AnythingOfType("func(*application.CustomEvent)")).Return(func() {})
	mockApp.On("OnEvent", event.LeagueWebsocketStop, mock.AnythingOfType("func(*application.CustomEvent)")).Return(func() {})

	// Register event handlers
	service.SetApp(mockApp)
	service.SubscribeToLeagueEvents()

	// Trigger the WebSocket start event to execute the handler registration
	for _, call := range mockApp.Calls {
		if call.Method == "OnEvent" && call.Arguments[0] == event.LeagueWebsocketStart {
			callback := call.Arguments[1].(func(*application.CustomEvent))
			callback(&application.CustomEvent{})
			break
		}
	}

	// Verify expectations
	mockManager.AssertExpectations(t)
	mockRouter.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}
func TestUnsubscribeFlow(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockApp := new(MockApp)
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// Add a test subscription
	websocket.AddTestSubscription(service, "test-path")

	// Setup expectations for both event registrations
	mockApp.On("OnEvent", event.LeagueWebsocketStart, mock.AnythingOfType("func(*application.CustomEvent)")).
		Return(func() {})
	mockApp.On("OnEvent", event.LeagueWebsocketStop, mock.AnythingOfType("func(*application.CustomEvent)")).
		Return(func() {})

	mockRouter.EXPECT().DeleteHandler("test-path").Return()
	service.SetApp(mockApp)
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

func TestSubscriptionMessagesWithMock(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)
	mockConn := new(MockWebSocketConnection)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// Set the mock connection
	websocket.SetTestConnection(service, mockConn)

	// Test sendSubscription
	mockConn.On("WriteMessage", gorillaWs.TextMessage, mock.MatchedBy(func(data []byte) bool {
		return string(data) == `[5, "OnJsonApiEvent_test-path"]`
	})).Return(nil).Once()

	err := service.SendSubscription("test-path") // Assuming this is an exported method for testing
	assert.NoError(t, err)

	// Test sendUnsubscription - Fix by using exact value match instead of matcher
	mockConn.On("WriteJSON", []interface{}{6, "test-path"}).Return(nil).Once()

	err = service.SendUnsubscription("test-path") // Assuming this is an exported method for testing
	assert.NoError(t, err)

	mockConn.AssertExpectations(t)
}

func TestReadMessages(t *testing.T) {
	mockLogger := logger.New("test", &config.Config{LogLevel: "info"})
	mockRouter := mocks.NewRouterService(t)
	mockLCUConnection := mocks.NewLCUConnection(t)
	mockAccountMonitor := mocks.NewAccountMonitor(t)
	mockLeagueService := mocks.NewLeagueService(t)
	mockAccountsRepo := mocks.NewAccountsRepository(t)
	mockHandler := mocks.NewHandler(t)
	mockManager := mocks.NewManagerService(t)
	mockConn := new(MockWebSocketConnection)

	service := websocket.NewService(
		mockLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockLCUConnection,
		mockAccountsRepo,
		mockRouter,
		mockHandler,
		mockManager,
	)

	// Set the mock connection
	websocket.SetTestConnection(service, mockConn)

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

	mockConn.On("ReadMessage").Return(gorillaWs.TextMessage, eventMessage, nil).Once()
	mockConn.On("ReadMessage").Return(0, []byte{}, fmt.Errorf("connection closed")).Once()
	mockConn.On("Close").Return(nil).Once()

	mockRouter.EXPECT().Dispatch(mock.MatchedBy(func(event websocket.LCUWebSocketEvent) bool {
		return event.URI == "test-uri" && event.EventType == 1
	})).Return().Once()

	// Call readMessages in a goroutine as it loops until connection error
	done := make(chan bool)
	go func() {
		service.ReadMessages() // Assuming this is an exported method for testing
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
