package protocol

import (
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"golang.org/x/sys/windows/registry"
	"net/url"
	"os"
	"strings"
)

const (
	StrapiSubscriptionSuccess = "stripe:subscription:success"
)

type Protocol struct {
	window *application.WebviewWindow
	logger *utils.Logger
}

// Modify New function to accept window param
func New(logger *utils.Logger) *Protocol {
	return &Protocol{
		window: nil,
		logger: logger,
	}
}
func (p *Protocol) SetWindow(window *application.WebviewWindow) {
	p.window = window
}

func (p *Protocol) Handle(urlStr string) error {
	if len(urlStr) <= 8 || !strings.HasPrefix(urlStr, "nexus://") {
		return fmt.Errorf("invalid protocol URL: %s", urlStr)
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

func (p *Protocol) Register() error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}
	k, _, err := registry.CreateKey(registry.CURRENT_USER, `Software\Classes\nexus`, registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer func(k registry.Key) {
		err := k.Close()
		if err != nil {
			return
		}
	}(k)

	// Set protocol description and mark as URL protocol
	if err := k.SetStringValue("", "URL:Nexus Protocol"); err != nil {
		return err
	}
	if err := k.SetStringValue("URL Protocol", ""); err != nil {
		return err
	}

	// Create icon reference
	iconKey, _, err := registry.CreateKey(k, "DefaultIcon", registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer func(iconKey registry.Key) {
		err := iconKey.Close()
		if err != nil {
			return
		}
	}(iconKey)
	err = iconKey.SetStringValue("", exePath+",1")
	if err != nil {
		return err
	}

	// Set command to execute when protocol is triggered
	cmdKey, _, err := registry.CreateKey(k, `shell\open\command`, registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer func(cmdKey registry.Key) {
		err := cmdKey.Close()
		if err != nil {
			return
		}
	}(cmdKey)

	// Launch your app with the URL as parameter
	return cmdKey.SetStringValue("", fmt.Sprintf("\"%s\" \"%%1\"", exePath))
}
