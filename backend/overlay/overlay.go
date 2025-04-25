package overlay

import (
	"encoding/json"
	"github.com/hex-boost/hex-nexus-app/backend/process"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"golang.org/x/sys/windows"

	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
	"unsafe"
)

type Overlay struct {
	overlay       *application.WebviewWindow
	logger        *utils.Logger
	isGameRunning bool
	gameHwnd      windows.HWND
	mutex         sync.Mutex
	stopChan      chan struct{}
	position      map[string]int
	configPath    string
}

var (
	// Add these constants at the beginning of your file, near the other vars
	user32                  = windows.NewLazySystemDLL("user32.dll")
	procFindWindow          = user32.NewProc("FindWindowW")
	procGetWindowRect       = user32.NewProc("GetWindowRect")
	procIsWindowVisible     = user32.NewProc("IsWindowVisible")
	procGetForegroundWindow = user32.NewProc("GetForegroundWindow")
)

func (m *Overlay) hasGameFocus() bool {
	if m.gameHwnd == 0 {
		return false
	}

	// Get the foreground window
	foregroundHwnd, _, _ := procGetForegroundWindow.Call()

	// Check if the game window is the foreground window
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
		return err
	}
	return nil
}

func IsWindowVisible(hwnd windows.HWND) bool {
	ret, _, _ := procIsWindowVisible.Call(uintptr(hwnd))
	return ret != 0
}

func CreateGameOverlay(app *application.App) *application.WebviewWindow {
	overlay := app.NewWebviewWindowWithOptions(
		application.WebviewWindowOptions{
			Name:           "Overlay",
			Title:          "Nexus Overlay",
			Width:          260,
			Height:         296,
			DisableResize:  true,
			AlwaysOnTop:    true,
			BackgroundType: application.BackgroundTypeTransparent,
			BackgroundColour: application.RGBA{
				Red:   0,
				Green: 0,
				Blue:  0,
				Alpha: 0,
			},
			Hidden:    true,
			Frameless: true,
			URL:       "/?target=overlay",

			Windows: application.WindowsWindow{
				Theme:                             1, // Dark theme
				DisableFramelessWindowDecorations: true,
				BackdropType:                      application.Acrylic,
				ExStyle:                           0x00080000 | 0x00000020 | 0x00000008, // WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST
				HiddenOnTaskbar:                   true,
			},
		},
	)
	return overlay
}

func (m *Overlay) maintainZOrder() {
	if !m.isGameRunning || !m.isWindowValid(m.gameHwnd) {
		return
	}
	uintPTR, err := m.overlay.NativeWindowHandle()
	if err != nil {
		return
	}
	hwnd := windows.HWND(uintPTR)
	if hwnd == 0 {
		return
	}

	// Always set overlay to be topmost
	user32.NewProc("SetWindowPos").Call(
		uintptr(hwnd),
		^uintptr(0), // HWND_TOPMOST (-1)
		0, 0, 0, 0,
		0x0001|0x0002|0x0010, // SWP_NOACTIVATE | SWP_NOMOVE | SWP_NOSIZE
	)
}
func (m *Overlay) SetWindow(window *application.WebviewWindow) {
	m.overlay = window
}
func NewGameOverlayManager(logger *utils.Logger) *Overlay {
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = "."
	}

	configPath := filepath.Join(configDir, "hex-nexus", "overlay-position.json")

	// Ensure directory exists
	err = os.MkdirAll(filepath.Dir(configPath), 0755)
	if err != nil {
		return nil
	}

	manager := &Overlay{
		overlay:    nil,
		logger:     logger,
		stopChan:   make(chan struct{}),
		position:   map[string]int{"x": 20, "y": 20},
		configPath: configPath,
	}

	// Load saved position if exists
	manager.loadPosition()

	return manager
}

func (m *Overlay) loadPosition() {
	data, err := os.ReadFile(m.configPath)
	if err != nil {
		m.logger.Info("No saved position found, using defaults")
		return
	}

	if err := json.Unmarshal(data, &m.position); err != nil {
		m.logger.Error("Failed to parse saved position", zap.Error(err))
	}
}

func (m *Overlay) savePosition(x, y int) error {
	m.position["x"] = x
	m.position["y"] = y

	data, err := json.Marshal(m.position)
	if err != nil {
		return err
	}

	return os.WriteFile(m.configPath, data, 0644)
}

func (m *Overlay) Start() {
	m.overlay.IsIgnoreMouseEvents()

	go m.monitorGame()
	//go m.registerLowLevelKeyboardHook()
	go m.registerGlobalHotkey()
}

func (m *Overlay) Stop() {
	close(m.stopChan)

	// Unregister hotkeys when stopping
}

func (m *Overlay) monitorGame() {
	processChan, stopMonitor := process.MonitorProcesses(false, 1*time.Second)
	defer stopMonitor()

	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	var wasGameFocused = false
	var overlayHwnd windows.HWND
	var lastFocusLossTime time.Time
	const focusLossConfirmDelay = 250 * time.Millisecond

	// Get overlay handle once
	if handle, err := m.overlay.NativeWindowHandle(); err == nil {
		overlayHwnd = windows.HWND(handle)
	}

	for {
		select {
		case <-m.stopChan:
			return
		case proc := <-processChan:
			if strings.Contains(strings.ToLower(proc.Name), "league of legends.exe") {
				m.logger.Info("League of Legends game detected", zap.Uint32("pid", proc.PID))
				m.findAndTrackGameWindow()
			}
		case <-ticker.C:
			if m.isGameRunning {
				if !m.isWindowValid(m.gameHwnd) {
					m.mutex.Lock()
					m.isGameRunning = false
					m.gameHwnd = 0
					m.mutex.Unlock()
					m.overlay.Hide()
					wasGameFocused = false
				} else {
					// Get foreground window
					foregroundHwnd, _, _ := procGetForegroundWindow.Call()
					foregroundWindow := windows.HWND(foregroundHwnd)

					// Check if either game or overlay has focus
					hasFocus := foregroundWindow == m.gameHwnd || foregroundWindow == overlayHwnd

					// Handle focus loss with delay to prevent false positives during transitions
					if !hasFocus && wasGameFocused {
						if lastFocusLossTime.IsZero() {
							// First detection of focus loss
							lastFocusLossTime = time.Now()
						} else if time.Since(lastFocusLossTime) > focusLossConfirmDelay {
							// Focus loss confirmed after delay
							if m.overlay.IsVisible() {
								m.logger.Info("Both game and overlay lost focus, hiding overlay")
								m.overlay.Hide()
							}
							lastFocusLossTime = time.Time{} // Reset timer
						}
					} else if hasFocus {
						// Reset focus loss timer when focus is detected
						lastFocusLossTime = time.Time{}
					}

					wasGameFocused = hasFocus

					if m.overlay.IsVisible() {
						m.maintainZOrder()
					}
				}
			} else {
				m.findAndTrackGameWindow()

				// Update overlay handle if needed
				if overlayHwnd == 0 {
					if handle, err := m.overlay.NativeWindowHandle(); err == nil {
						overlayHwnd = windows.HWND(handle)
					}
				}

				wasGameFocused = false
			}
		}
	}
}
func (m *Overlay) registerGlobalHotkey() {
	//// Use correct package name (gohook instead of hook)
	//hook.Register(hook.KeyDown, []string{"ctrl", "shift", "b"}, func(e hook.Event) {
	//	m.toggleOverlay()
	//})
	//hook.Register(hook.KeyDown, []string{"ctrl", "shift", "m"}, func(e hook.Event) {
	//	m.toggleMouseEvents()
	//})
	//
	//// Start hook in the background without blocking
	//go func() {
	//	_ = hook.Start()
	//	<-m.stopChan // Wait for stop signal
	//	hook.End()   // Properly end the hook when stopping
	//}()
}

func (m *Overlay) toggleMouseEvents() {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if !m.overlay.IsVisible() || !m.isGameRunning || !m.isWindowValid(m.gameHwnd) {
		return
	}

	ignoring := m.overlay.IsIgnoreMouseEvents()
	m.overlay.SetIgnoreMouseEvents(!ignoring)

	if !ignoring {
		m.logger.Info("Mouse events now pass through overlay")
	} else {
		m.logger.Info("Overlay now captures mouse events")
	}
}
func (m *Overlay) Hide() {
	m.logger.Info("Hiding overlay")
	m.overlay.Hide()
}
func (m *Overlay) toggleOverlay() {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if !m.isGameRunning || !m.isWindowValid(m.gameHwnd) {
		m.logger.Info("Toggle requested but game not running or not visible")
		return
	}

	if m.overlay.IsVisible() {
		m.Hide()
	} else {
		// Get foreground window
		foregroundHwnd, _, _ := procGetForegroundWindow.Call()
		foregroundWindow := windows.HWND(foregroundHwnd)

		// Only show if the game has focus
		if foregroundWindow == m.gameHwnd {
			m.logger.Info("Showing overlay")
			m.overlay.Show()

			// Immediately maintain z-order after showing
			m.maintainZOrder()

			// Get native handle for the overlay
			overlayHwnd, err := m.overlay.NativeWindowHandle()
			if err == nil {
				// Set window position with SWP_NOACTIVATE to prevent focus stealing
				user32.NewProc("SetWindowPos").Call(
					uintptr(overlayHwnd),
					^uintptr(0), // HWND_TOPMOST
					0, 0, 0, 0,
					0x0001|0x0002|0x0010, // SWP_NOACTIVATE | SWP_NOMOVE | SWP_NOSIZE
				)
			}
		} else {
			m.logger.Info("Toggle requested but game window is not focused")
		}
	}
}

func (m *Overlay) findAndTrackGameWindow() {
	// League in-game window title can be either of these
	possibleTitles := []string{
		"League of Legends (TM) Client",
		"League of Legends",
		"League of Legends (TM) Game",
	}

	for _, title := range possibleTitles {
		uintPtr, err := windows.UTF16PtrFromString(title)
		if err != nil {
			continue
		}
		hwnd := FindWindow(nil, uintPtr)
		if hwnd != 0 && IsWindowVisible(hwnd) {
			m.mutex.Lock()
			m.isGameRunning = true
			m.gameHwnd = hwnd
			m.mutex.Unlock()
			m.logger.Info("League of Legends game window found", zap.String("title", title))
			return
		}
	}
}
func (m *Overlay) updateOverlayPosition() {
	if m.gameHwnd == 0 {
		return
	}

	var rect windows.Rect
	if err := GetWindowRect(m.gameHwnd, &rect); err != nil {
		m.logger.Error("Failed to get game window rect", zap.Error(err))
		return
	}

	// Get overlay size
	width, height := m.overlay.Size()

	// Calculate position, ensuring overlay stays within game window bounds
	x := int(rect.Left) + m.position["x"]
	y := int(rect.Top) + m.position["y"]

	// Constrain to game window bounds
	if x < int(rect.Left) {
		x = int(rect.Left)
	}
	if y < int(rect.Top) {
		y = int(rect.Top)
	}
	if x+width > int(rect.Right) {
		x = int(rect.Right) - width
	}
	if y+height > int(rect.Bottom) {
		y = int(rect.Bottom) - height
	}

	m.overlay.SetPosition(x, y)
}

func (m *Overlay) isWindowValid(hwnd windows.HWND) bool {
	if hwnd == 0 {
		return false
	}

	// Only check if the window is visible, not if it's the foreground window
	return IsWindowVisible(hwnd)
}
