package protocol

import (
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"golang.org/x/sys/windows"
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
func IsRunningAsAdmin() (bool, error) {
	var sid *windows.SID
	err := windows.AllocateAndInitializeSid(
		&windows.SECURITY_NT_AUTHORITY,
		2,
		windows.SECURITY_BUILTIN_DOMAIN_RID,
		windows.DOMAIN_ALIAS_RID_ADMINS,
		0, 0, 0, 0, 0, 0,
		&sid)
	if err != nil {
		return false, err
	}
	defer windows.FreeSid(sid)

	token := windows.Token(0)
	member, err := token.IsMember(sid)
	if err != nil {
		return false, err
	}

	return member, nil
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

func (p *Protocol) Register() error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	// Register the protocol handler
	k, _, err := registry.CreateKey(registry.CURRENT_USER, `Software\Classes\nexus`, registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer k.Close()

	if err := k.SetStringValue("", "URL:Nexus Protocol"); err != nil {
		return err
	}
	if err := k.SetStringValue("URL Protocol", ""); err != nil {
		return err
	}

	// Add additional security keys for browsers
	// Create a DefaultIcon entry
	iconKey, _, err := registry.CreateKey(k, "DefaultIcon", registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer iconKey.Close()
	if err := iconKey.SetStringValue("", fmt.Sprintf("%s,1", exePath)); err != nil {
		return err
	}

	// Create the command to execute
	shellKey, _, err := registry.CreateKey(k, "shell", registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer shellKey.Close()

	openKey, _, err := registry.CreateKey(shellKey, "open", registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer openKey.Close()

	cmdKey, _, err := registry.CreateKey(openKey, "command", registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer cmdKey.Close()

	// Use a more explicit command format for browsers
	return cmdKey.SetStringValue("", fmt.Sprintf("\"%s\" \"%%1\"", exePath))
}
