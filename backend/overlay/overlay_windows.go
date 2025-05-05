// --- START OF NEW FILE overlay_windows.h ---

//go:build windows

package overlay

import (
	"encoding/json"
	"fmt"
	hook "github.com/robotn/gohook"
	"math" // Import math package for Min/Max

	"os"

	"path/filepath"
	"strings"
	"sync"
	"time"
	"unsafe"

	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"golang.org/x/sys/windows"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/process"
)

type OverlayState int

const (
	StateHidden OverlayState = iota
	StateVisibleInteractive
)

// Constants for default positioning
const (
	defaultOffsetX = 20 // Pixels from the right edge
	defaultOffsetY = 20 // Pixels from the top edge
)

type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}
type Overlay struct {
	overlay       *application.WebviewWindow
	logger        *logger.Logger
	isGameRunning bool
	gameHwnd      windows.HWND
	mutex         sync.Mutex
	stopChan      chan struct{}
	// Position stores the last known *absolute* screen coordinates
	// Use pointers to distinguish between zero position and not loaded yet
	lastPosition *Position
	state        OverlayState

	configPath string
}

var (
	user32                  = windows.NewLazySystemDLL("user32.dll")
	procFindWindow          = user32.NewProc("FindWindowW")
	procGetWindowRect       = user32.NewProc("GetWindowRect")
	procIsWindowVisible     = user32.NewProc("IsWindowVisible")
	procGetForegroundWindow = user32.NewProc("GetForegroundWindow")
	procSetForegroundWindow = user32.NewProc("SetForegroundWindow")

	WS_EX_LAYERED    = 0x00080000 // Needed for transparency/effects
	WS_EX_TOPMOST    = 0x00000008 // Keep on top
	WS_EX_TOOLWINDOW = 0x00000080 // Prevent Alt+Tab
	WS_EX_NOACTIVATE = 0x08000000 // Prevent stealing focus
	// WS_EX_TRANSPARENT removed - overlay is interactive when visible
)

// --- Window Helper Functions (unchanged) ---

func (m *Overlay) hasGameFocus() bool {
	if m.gameHwnd == 0 {
		return false
	}
	foregroundHwnd, _, _ := procGetForegroundWindow.Call()
	return windows.HWND(foregroundHwnd) == m.gameHwnd
}

func FindWindow(className, windowName *uint16) windows.HWND {
	ret, _, _ := procFindWindow.Call(
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(windowName)),
	)
	return windows.HWND(ret)
}

func GetWindowRect(hwnd windows.HWND, rect *windows.Rect) error {
	ret, _, err := procGetWindowRect.Call(
		uintptr(hwnd),
		uintptr(unsafe.Pointer(rect)),
	)
	if ret == 0 {
		// Use GetLastError if needed, but often the error return is sufficient
		if err != nil { // ERROR_SUCCESS is not a real error
			return fmt.Errorf("GetWindowRect failed: %w", err)
		}
		// Sometimes ret is 0 but err is nil/ERROR_SUCCESS, check if hwnd is valid
		if !IsWindowVisible(hwnd) { // Or use IsWindow API
			return fmt.Errorf("GetWindowRect failed: window handle %v is invalid or not visible", hwnd)
		}
		// If ret is 0 but err is nil and window seems valid, it's ambiguous. Return a generic error.
		return fmt.Errorf("GetWindowRect failed with return code 0 but no specific error")
	}
	return nil
}

func IsWindowVisible(hwnd windows.HWND) bool {
	ret, _, _ := procIsWindowVisible.Call(uintptr(hwnd))
	return ret != 0
}

// --- Overlay Creation ---

func CreateGameOverlay(app *application.App) *application.WebviewWindow {
	overlay := app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{
			Name:                       "Overlay",
			Title:                      "Nexus Overlay",
			Width:                      260, // Keep original size or adjust as needed
			Height:                     296,
			DisableResize:              true,
			AlwaysOnTop:                true, // Use WS_EX_TOPMOST instead? Wails handles this mapping.
			BackgroundType:             application.BackgroundTypeTransparent,
			DefaultContextMenuDisabled: true,
			BackgroundColour: application.RGBA{
				Red: 0, Green: 0, Blue: 0, Alpha: 0, // Fully transparent background
			},
			Hidden:                 true, // Start hidden
			Frameless:              true,
			URL:                    "/?target=overlay", // Ensure your overlay frontend has a draggable region
			DevToolsEnabled:        true,
			OpenInspectorOnStartup: true,
			Windows: application.WindowsWindow{
				Theme:                             1, // Dark theme
				DisableFramelessWindowDecorations: true,
				BackdropType:                      application.Acrylic, // Or Mica, None etc.
				ExStyle:                           WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE,
				HiddenOnTaskbar:                   true,
			},
		},
	)
	return overlay
}

// --- Overlay Manager ---

func NewGameOverlayManager(logger *logger.Logger) *Overlay {
	configDir, err := os.UserConfigDir()
	if err != nil {
		logger.Warn("Failed to get user config dir, using current directory", zap.Error(err))
		configDir = "."
	}
	configPath := filepath.Join(configDir, "hex-nexus", "overlay-position.json")

	err = os.MkdirAll(filepath.Dir(configPath), 0o755)
	if err != nil {
		logger.Error("Failed to create config directory", zap.Error(err), zap.String("path", filepath.Dir(configPath)))
		// Continue execution, position saving/loading will just fail
	}

	manager := &Overlay{
		overlay:      nil, // Set later with SetWindow
		logger:       logger,
		stopChan:     make(chan struct{}),
		lastPosition: nil, // Initialize as nil, loadPosition will populate if file exists
		configPath:   configPath,
		state:        StateHidden, // Start hidden
	}

	manager.loadPosition() // Load saved position if exists
	return manager
}

func (m *Overlay) SetWindow(window *application.WebviewWindow) {
	m.overlay = window
	// Ensure initial state matches (hidden, non-interactive)
	if m.overlay != nil {
		m.overlay.Hide()
		m.overlay.SetIgnoreMouseEvents(true) // Should ignore mouse when hidden
	}
}
func (m *Overlay) Hide() {
	m.overlay.Hide()
	m.overlay.SetIgnoreMouseEvents(true) // Should ignore mouse when hidden
	m.state = StateHidden
}

// --- Position Persistence ---

func (m *Overlay) loadPosition() {
	data, err := os.ReadFile(m.configPath)
	if err != nil {
		if !os.IsNotExist(err) {
			m.logger.Error("Failed to read position config", zap.Error(err), zap.String("path", m.configPath))
		} else {
			m.logger.Info("No saved position found, will use default on first show.")
		}
		m.lastPosition = nil // Ensure it's nil if read fails or file doesn't exist
		return
	}

	var pos Position
	if err := json.Unmarshal(data, &pos); err != nil {
		m.logger.Error("Failed to parse saved position", zap.Error(err))
		m.lastPosition = nil
		return
	}

	m.lastPosition = &pos // Store the loaded position
	m.logger.Info("Loaded saved overlay position", zap.Int("x", pos.X), zap.Int("y", pos.Y))
}

// savePosition saves the *current* absolute screen coordinates of the overlay.
func (m *Overlay) savePosition() error {
	if m.overlay == nil || m.state != StateVisibleInteractive {
		// Don't save if overlay isn't set or isn't visible
		return nil
	}

	x, y := m.overlay.Position()
	pos := Position{
		X: x,
		Y: y,
	}

	// Update internal state immediately
	m.lastPosition = &pos

	data, err := json.Marshal(pos)
	if err != nil {
		m.logger.Error("Failed to marshal position", zap.Error(err))
		return fmt.Errorf("failed to marshal position: %w", err)
	}

	err = os.WriteFile(m.configPath, data, 0o644)
	if err != nil {
		m.logger.Error("Failed to write position config", zap.Error(err), zap.String("path", m.configPath))
		return fmt.Errorf("failed to write position config: %w", err)
	}
	m.logger.Debug("Saved overlay position", zap.Int("x", x), zap.Int("y", y))
	return nil
}

// --- Core Logic ---

func (m *Overlay) Start() {
	// Initial state is Hidden, mouse events should be ignored.
	if m.overlay != nil {
		m.overlay.SetIgnoreMouseEvents(true)
	} else {
		m.logger.Error("Overlay window not set before Start()")
		// Cannot proceed without a window
		return
	}

	go m.monitorGame()
	go m.registerGlobalHotkey()
	m.logger.Info("Overlay Manager Started")
}

func (m *Overlay) Stop() {
	m.logger.Info("Stopping Overlay Manager...")
	select {
	case <-m.stopChan:
		m.logger.Warn("Stop channel was already closed.")
	default:
		close(m.stopChan)
		m.logger.Info("Stop channel closed.")
	}
	// Save position one last time if visible? Optional.
	// m.savePosition() // Could call this here, but saving on hide is usually sufficient.
	m.logger.Info("Overlay Manager stop sequence initiated.")
}

func (m *Overlay) monitorGame() {
	processChan, stopMonitor := process.MonitorProcesses(false, 1*time.Second)
	defer stopMonitor()

	ticker := time.NewTicker(250 * time.Millisecond) // Check slightly less frequently
	defer ticker.Stop()

	var overlayHwnd windows.HWND
	if handle, err := m.overlay.NativeWindowHandle(); err == nil {
		overlayHwnd = windows.HWND(handle)
	} else {
		m.logger.Error("Failed to get overlay handle during init", zap.Error(err))
	}

	for {
		select {
		case <-m.stopChan:
			m.logger.Info("Monitor game loop stopping.")
			return
		case proc := <-processChan:
			// Simplified check for League process start
			if m.gameHwnd == 0 && strings.Contains(strings.ToLower(proc.Name), "league of legends.exe") {
				m.logger.Info("League of Legends process detected", zap.Uint32("pid", proc.PID))
				m.findAndTrackGameWindow() // Attempt to find the window immediately
			}
		case <-ticker.C:
			m.mutex.Lock()
			gameRunning := m.isGameRunning
			currentHwnd := m.gameHwnd
			currentState := m.state
			m.mutex.Unlock()

			if gameRunning {
				if !m.isWindowValid(currentHwnd) {
					m.logger.Info("Game window became invalid or closed.")
					m.mutex.Lock()
					m.isGameRunning = false
					m.gameHwnd = 0
					if m.state == StateVisibleInteractive {
						m.logger.Info("Hiding overlay because game window lost.")
						// Don't save position here, as it might be off-screen
						m.overlay.Hide()
						m.overlay.SetIgnoreMouseEvents(true)
						m.state = StateHidden
					}
					m.mutex.Unlock()
				} else {
					// Game is running and window is valid
					if currentState == StateVisibleInteractive {
						// Ensure it stays on top
						m.maintainZOrder(overlayHwnd)

						// Check if game *still* has focus. Hide if not.
						// This provides behavior similar to Blitz/OP.gg where overlay hides on Alt+Tab
						if !m.hasGameFocus() {
							// Check if overlay itself has focus (e.g., user clicked it)
							foregroundHwnd, _, _ := procGetForegroundWindow.Call()
							if windows.HWND(foregroundHwnd) != overlayHwnd {
								m.logger.Info("Game lost focus, hiding overlay.")
								m.mutex.Lock()
								// Save position *before* hiding
								m.savePosition()
								m.overlay.Hide()
								m.overlay.SetIgnoreMouseEvents(true)
								m.state = StateHidden
								m.mutex.Unlock()
							}
						}
					}
				}
			} else {
				// Game not marked as running, try to find it
				m.findAndTrackGameWindow()
			}

			// Update overlay handle if it was initially invalid
			if overlayHwnd == 0 && m.overlay != nil {
				if handle, err := m.overlay.NativeWindowHandle(); err == nil {
					overlayHwnd = windows.HWND(handle)
				}
			}
		}
	}
}

// Simplified: Toggles between Hidden and VisibleInteractive
func (m *Overlay) toggleOverlayVisibility() {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if m.overlay == nil {
		m.logger.Error("Toggle attempted but overlay window is nil")
		return
	}

	// Refresh game state check
	if m.gameHwnd != 0 && !m.isWindowValid(m.gameHwnd) {
		m.logger.Warn("Game window became invalid, marking game as not running.")
		m.isGameRunning = false
		m.gameHwnd = 0
		// Ensure overlay is hidden if game disappears
		if m.state == StateVisibleInteractive {
			m.overlay.Hide()
			m.overlay.SetIgnoreMouseEvents(true)
			m.state = StateHidden
		}
	}

	// Check if game is running *now*
	if !m.isGameRunning {
		m.logger.Info("Toggle hotkey pressed, but game is not running or window not found.")
		// If it's somehow visible, hide it
		if m.state == StateVisibleInteractive {
			m.overlay.Hide()
			m.overlay.SetIgnoreMouseEvents(true)
			m.state = StateHidden
		}
		return
	}

	// --- State Transition Logic ---
	switch m.state {
	case StateHidden:
		// Transition to VisibleInteractive
		if !m.hasGameFocus() {
			m.logger.Info("Show overlay requested, but game not focused.")
			return
		}

		m.logger.Info("Overlay state: Hidden -> Visible (Interactive)")

		// 1. Calculate Position
		targetX, targetY := m.calculateTargetPosition()

		// 2. Apply Position & Show
		m.overlay.SetPosition(targetX, targetY)
		// Show the window FIRST
		m.overlay.Show()
		// THEN make it interactive (might matter for timing)
		m.overlay.SetIgnoreMouseEvents(false)

		// 3. Update State & Z-Order
		m.state = StateVisibleInteractive
		overlayHwnd, err := m.overlay.NativeWindowHandle()
		if err == nil {
			m.maintainZOrder(windows.HWND(overlayHwnd)) // Ensure it's topmost immediately
		} else {
			m.logger.Error("Failed to get overlay handle for maintainZOrder", zap.Error(err))
		}

		// **** ADD THIS SECTION ****
		// 4. Attempt to restore focus immediately to the game window
		//    This helps prevent the "first click wasted" issue after showing.
		if m.gameHwnd != 0 {
			// Brief delay *might* sometimes help ensure the show/style changes
			// have settled before trying to set focus back. Usually not needed.
			// time.Sleep(10 * time.Millisecond)

			ret, _, err := procSetForegroundWindow.Call(uintptr(m.gameHwnd))
			// SetForegroundWindow returns 0 on failure, non-zero on success.
			// The error object might be non-nil even on success ("operation completed successfully").
			if ret == 0 {
				// Log failure only if ret is 0, indicating actual failure.
				m.logger.Warn("SetForegroundWindow call failed to restore focus to game", zap.Error(err))
			} else {
				m.logger.Debug("Attempted to restore focus to game window after showing overlay.")
			}
		}
		// **** END OF ADDED SECTION ****
	case StateVisibleInteractive:
		// Transition to Hidden
		m.logger.Info("Overlay state: Visible (Interactive) -> Hidden")

		// 1. Save Position *before* hiding
		err := m.savePosition()
		if err != nil {
			m.logger.Error("Failed to save position before hiding", zap.Error(err))
		}

		// 2. Hide
		m.overlay.Hide()
		m.overlay.SetIgnoreMouseEvents(true) // Ignore mouse when hidden

		// 3. Update State
		m.state = StateHidden
	}
}

// calculateTargetPosition determines where the overlay should appear.
// It prioritizes the last saved position, falling back to the default (top-right).
// It clamps the position within the current game window bounds.
// NOTE: This must be called *within* a mutex lock if accessing shared state like m.gameHwnd.
func (m *Overlay) calculateTargetPosition() (finalX, finalY int) {
	if m.overlay == nil || m.gameHwnd == 0 {
		return 0, 0 // Cannot calculate
	}

	var gameRect windows.Rect
	if err := GetWindowRect(m.gameHwnd, &gameRect); err != nil {
		m.logger.Error("Failed to get game window rect for positioning", zap.Error(err))
		// Fallback to a screen corner? Or just 0,0? Let's use 0,0.
		return 0, 0
	}

	overlayWidth, overlayHeight := m.overlay.Size()
	//gameWidth := int(gameRect.Right - gameRect.Left)
	//gameHeight := int(gameRect.Bottom - gameRect.Top)

	targetX, targetY := 0, 0
	positionSource := "default (top-right)"

	// Use last saved position if available
	if m.lastPosition != nil {
		targetX = m.lastPosition.X
		targetY = m.lastPosition.Y
		positionSource = "saved"
	} else {
		// Calculate default top-right position relative to game window
		targetX = int(gameRect.Right) - overlayWidth - defaultOffsetX
		targetY = int(gameRect.Top) + defaultOffsetY
	}

	// Clamp position to be fully within the game window bounds
	minX := int(gameRect.Left)
	minY := int(gameRect.Top)
	maxX := int(gameRect.Right) - overlayWidth   // Max X for top-left corner
	maxY := int(gameRect.Bottom) - overlayHeight // Max Y for top-left corner

	// Ensure min <= max, handle cases where overlay is larger than game window
	if maxX < minX {
		maxX = minX
	}
	if maxY < minY {
		maxY = minY
	}

	finalX = int(math.Max(float64(minX), math.Min(float64(targetX), float64(maxX))))
	finalY = int(math.Max(float64(minY), math.Min(float64(targetY), float64(maxY))))

	m.logger.Info("Calculated overlay position",
		zap.String("source", positionSource),
		zap.Int("targetX", targetX),
		zap.Int("targetY", targetY),
		zap.Int("finalX", finalX),
		zap.Int("finalY", finalY),
		zap.Int32("gameL", gameRect.Left),
		zap.Int32("gameT", gameRect.Top),
		zap.Int32("gameR", gameRect.Right),
		zap.Int32("gameB", gameRect.Bottom),
		zap.Int("overlayW", overlayWidth),
		zap.Int("overlayH", overlayHeight),
	)

	return finalX, finalY
}

func (m *Overlay) maintainZOrder(overlayHwnd windows.HWND) {
	// No need to check game running here, called only when needed by monitorGame
	if overlayHwnd == 0 {
		// Try to get it again if it was invalid before
		if m.overlay != nil {
			if handle, err := m.overlay.NativeWindowHandle(); err == nil {
				overlayHwnd = windows.HWND(handle)
			} else {
				m.logger.Warn("Could not get overlay handle for maintainZOrder", zap.Error(err))
				return
			}
		} else {
			return // Overlay not set
		}
	}
	if overlayHwnd == 0 {
		return
	} // Still couldn't get it

	// Set overlay to be topmost
	// Use SWP_NOACTIVATE to prevent stealing focus when enforcing Z-order
	user32.NewProc("SetWindowPos").Call(
		uintptr(overlayHwnd),
		^uintptr(0), // HWND_TOPMOST (-1)
		0, 0, 0, 0,  // x, y, cx, cy (ignored due to flags)
		0x0002|0x0001|0x0010, // SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE
	)
}

// --- Hotkey Registration (Modified Call) ---

func (m *Overlay) registerGlobalHotkey() {
	m.logger.Info("Registering global hotkey: Ctrl+Shift+B")

	hook.Register(hook.KeyDown, []string{"ctrl", "shift", "b"}, func(e hook.Event) {
		m.logger.Info("Global hotkey (Ctrl+Shift+B) detected!")
		// Call the simplified toggle function
		m.toggleOverlayVisibility() // Renamed from cycleOverlayState
	})

	// Start hook listener (unchanged from previous version)
	go func() {
		m.logger.Info("Starting hook event processing loop...")
		eventChannel := hook.Start()
		defer hook.End() // Ensure cleanup if Process returns unexpectedly
		<-hook.Process(eventChannel)
		m.logger.Info("Hook event processing loop finished.")
	}()

	// Listen for stop signal (unchanged from previous version)
	go func() {
		<-m.stopChan
		m.logger.Info("Received stop signal, calling hook.End() to release hooks.")
		hook.End()
	}()

	m.logger.Info("Global hotkey registration and processing initiated.")
}

// --- Game Window Tracking (Minor adjustments possible) ---

func (m *Overlay) findAndTrackGameWindow() {
	// This logic seems fine, but ensure it's called periodically if game wasn't found initially
	// The monitorGame loop already handles retrying this.
	possibleTitles := []string{
		"League of Legends (TM) Client",
		"League of Legends",
	}

	found := false
	for _, title := range possibleTitles {
		uintPtr, err := windows.UTF16PtrFromString(title)
		if err != nil {
			continue
		}
		hwnd := FindWindow(nil, uintPtr) // Looking for main game window class
		if hwnd != 0 && IsWindowVisible(hwnd) {
			m.mutex.Lock()
			// Check if we already found it or if it's a different window instance
			if !m.isGameRunning || m.gameHwnd != hwnd {
				m.logger.Info("League of Legends game window found", zap.String("title", title), zap.Uintptr("hwnd", uintptr(hwnd)))
				m.isGameRunning = true
				m.gameHwnd = hwnd
				// If the overlay is currently hidden, finding the game doesn't automatically show it.
				// The user must use the hotkey.
			}
			m.mutex.Unlock()
			found = true
			break // Found a valid window
		}
	}

	// If no window was found, but we previously thought the game was running
	m.mutex.Lock()
	if !found && m.isGameRunning {
		// This case is handled by the isWindowValid check in monitorGame,
		// but we could log it here too if desired.
		// m.logger.Debug("Previously tracked game window not found in current search.")
	}
	m.mutex.Unlock()
}

// isWindowValid checks if the HWND is non-zero and the window is currently visible.
func (m *Overlay) isWindowValid(hwnd windows.HWND) bool {
	return hwnd != 0 && IsWindowVisible(hwnd)
}

// --- END OF NEW FILE overlay_windows.h ---
