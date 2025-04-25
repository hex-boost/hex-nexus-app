package websockets

// EventHandlerInterface defines a handler for LCU WebSocket events
type EventHandlerInterface interface {
	GetPath() string
	Handle(LCUWebSocketEvent)
}

// Manager struct for creating event handlers
type Manager struct {
}

func NewManager() *Manager {
	return &Manager{}
}

// EventHandler implements the EventHandlerInterface
type EventHandler struct {
	path    string
	handler func(LCUWebSocketEvent)
}

// NewEventHandler creates a new event handler with path and handler function
func (m *Manager) NewEventHandler(path string, handler func(LCUWebSocketEvent)) EventHandlerInterface {
	return &EventHandler{
		path:    path,
		handler: handler,
	}
}

// GetPath returns the path for this handler
func (h *EventHandler) GetPath() string {
	return h.path
}

// Handle processes an event with this handler
func (h *EventHandler) Handle(event LCUWebSocketEvent) {
	h.handler(event)
}
