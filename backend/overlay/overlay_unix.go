//go:build !windows
// +build !windows

package overlay

import (
	"github.com/wailsapp/wails/v3/pkg/application"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
)

// Overlay is a stub implementation for non-Windows platforms
type Overlay struct {
	overlay *application.WebviewWindow
	logger  *logger.Logger
}

// CreateGameOverlay creates a stub overlay window
func CreateGameOverlay(app *application.App) *application.WebviewWindow {
	return nil
}

// NewGameOverlayManager returns a stub overlay manager
func NewGameOverlayManager(logger *logger.Logger) *Overlay {
	return &Overlay{
		overlay: nil,
		logger:  logger,
	}
}

// SetWindow assigns the window reference (stub)
func (m *Overlay) SetWindow(window *application.WebviewWindow) {
	m.overlay = window
}

// Start begins overlay tracking (stub)
func (m *Overlay) Start() {}

// Stop stops overlay tracking (stub)
func (m *Overlay) Stop() {}

// Hide hides the overlay (stub)
func (m *Overlay) Hide() {}

// Additional stub methods to match the Windows interface
func (m *Overlay) savePosition(x, y int) error {
	return nil
}

func (m *Overlay) loadPosition() {}
