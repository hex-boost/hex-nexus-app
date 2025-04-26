package protocol

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
)

const (
	StrapiSubscriptionSuccess = "stripe:subscription:success"
)

type Protocol struct {
	window *application.WebviewWindow
	logger *logger.Logger
}

// Modify New function to accept window param
func New(logger *logger.Logger) *Protocol {
	return &Protocol{
		window: nil,
		logger: logger,
	}
}

func (p *Protocol) SetWindow(window *application.WebviewWindow) {
	p.window = window
}

// Call this method after registration
func (p *Protocol) Handle(urlStr string) error {
	if len(urlStr) <= 8 || !strings.HasPrefix(urlStr, "nexus://") {
		p.logger.Error("invalid protocol URL", zap.String("urlString", urlStr))
		return fmt.Errorf("invalid protocol URL")
	}

	// Parse the URL
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return fmt.Errorf("failed to parse URL: %w", err)
	}

	// Extract path (action) and query params
	path := strings.TrimPrefix(parsedURL.Path, "/")
	queryParams := parsedURL.Query()

	// Create a map of parameters to send to frontend
	params := map[string]interface{}{
		"action": path,
		"params": map[string]string{},
	}

	// Add all query parameters to the params map
	for key, values := range queryParams {
		if len(values) > 0 {
			params["params"].(map[string]string)[key] = values[0]
		}
	}

	// Emit event to frontend if window is available
	if p.window != nil {
		p.window.EmitEvent(StrapiSubscriptionSuccess, params)
		p.logger.Debug("Emitting event", zap.String("action", path), zap.Any("params", params))
		return nil
	}

	return fmt.Errorf("window not available to emit event")
}
