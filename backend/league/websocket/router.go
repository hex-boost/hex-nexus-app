package websocket

import (
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"go.uber.org/zap"
	"strings"
)

// Router manages event routing based on URI patterns
type Router struct {
	routes map[string]func(LCUWebSocketEvent)
	logger *logger.Logger
}

// NewRouter creates a new router instance
func NewRouter(logger *logger.Logger) *Router {
	return &Router{
		routes: make(map[string]func(LCUWebSocketEvent)),
		logger: logger,
	}
}

// RegisterHandler adds a handler for a specific URI pattern
func (r *Router) RegisterHandler(pattern string, handler func(LCUWebSocketEvent)) {
	r.routes[pattern] = handler
}

// DeleteHandler removes a handler for a specific URI pattern
func (r *Router) DeleteHandler(pattern string) {
	delete(r.routes, pattern)
}

// Dispatch sends an event to the appropriate handler
func (r *Router) Dispatch(event LCUWebSocketEvent) {
	for pattern, handler := range r.routes {
		if strings.Contains(event.URI, pattern) {
			r.logger.Debug("Dispatching event", zap.String("uri", event.URI), zap.String("pattern", pattern))
			handler(event)
		}
	}
}
