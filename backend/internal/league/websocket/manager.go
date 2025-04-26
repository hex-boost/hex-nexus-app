package websocket

// EventHandler defines a handler for LCU WebSocket events
type EventHandler interface {
	GetPath() string
	Handle(LCUWebSocketEvent)
}

// Manager struct for creating event handlers
type Manager struct{}

func NewManager() *Manager {
	return &Manager{}
}

// WebSocketEventHandler implements the EventHandler interface
type WebSocketEventHandler struct {
	path    string
	handler func(LCUWebSocketEvent)
}

// NewEventHandler creates a new event handler with path and handler function
func (m *Manager) NewEventHandler(path string, handler func(LCUWebSocketEvent)) EventHandler {
	return &WebSocketEventHandler{
		path:    path,
		handler: handler,
	}
}

// GetPath returns the path for this handler
func (h *WebSocketEventHandler) GetPath() string {
	return h.path
}

// Handle processes an event with this handler
func (h *WebSocketEventHandler) Handle(event LCUWebSocketEvent) {
	h.handler(event)
}
