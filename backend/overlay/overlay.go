package overlay

import (
	"encoding/json"
	"github.com/hex-boost/hex-nexus-app/backend/process"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	hook "github.com/robotn/gohook"
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

type GameOverlayManager struct {
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
	user32              = windows.NewLazySystemDLL("user32.dll")
	procFindWindow      = user32.NewProc("FindWindowW")
	procGetWindowRect   = user32.NewProc("GetWindowRect")
	procIsWindowVisible = user32.NewProc("IsWindowVisible")
)

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
			Name:          "GameOverlay",
			Title:         "Nexus Overlay",
			Width:         400,
			Height:        260,
			DisableResize: true,
			AlwaysOnTop:   true,
			Hidden:        true,
			Frameless:     true,

			Windows: application.WindowsWindow{
				Theme:                             1, // Use dark theme
				DisableFramelessWindowDecorations: true,
			},
		},
	)
	return overlay
}
func NewGameOverlayManager(overlay *application.WebviewWindow, logger *utils.Logger) *GameOverlayManager {
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = "."
	}

	configPath := filepath.Join(configDir, "hex-nexus", "overlay-position.json")

	// Ensure directory exists
	os.MkdirAll(filepath.Dir(configPath), 0755)

	manager := &GameOverlayManager{
		overlay:    overlay,
		logger:     logger,
		stopChan:   make(chan struct{}),
		position:   map[string]int{"x": 20, "y": 20},
		configPath: configPath,
	}

	// Load saved position if exists
	manager.loadPosition()

	return manager
}
func (m *GameOverlayManager) loadPosition() {
	data, err := os.ReadFile(m.configPath)
	if err != nil {
		m.logger.Info("No saved position found, using defaults")
		return
	}

	if err := json.Unmarshal(data, &m.position); err != nil {
		m.logger.Error("Failed to parse saved position", zap.Error(err))
	}
}

func (m *GameOverlayManager) savePosition(x, y int) error {
	m.position["x"] = x
	m.position["y"] = y

	data, err := json.Marshal(m.position)
	if err != nil {
		return err
	}

	return os.WriteFile(m.configPath, data, 0644)
}
func (m *GameOverlayManager) initializeOverlay() {
	m.overlay.SetHTML(`<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            background-color: transparent;
            margin: 0;
            padding: 0;
            overflow: hidden;
            color: white;
            font-family: Arial, sans-serif;
            width: 400px;
            height: 260px;
        }
        .overlay-content {
            background-color: rgba(0,0,0,0.8);
            border-radius: 5px;
			padding:20px;
            display: inline-block;
            text-shadow: 1px 1px 2px black;
            --wails-draggable: drag;  /* Make content draggable */
        }
    </style>
</head>
<body>
<div class="overlay-content">
    <h3 id="status">Nexus Overlay Active</h3>
    <p id="game-text">Press Ctrl+Shift+B to toggle visibility</p>
    <p>Press Ctrl+Shift+M to toggle click-through</p>
</div>

<script>
    window.runtime.EventsOn("overlay:update", (message) => {
        document.getElementById("game-text").textContent = message;
    });
</script>
</body>
</html>`)
}
func (m *GameOverlayManager) Start() {
	m.initializeOverlay()
	m.overlay.IsIgnoreMouseEvents()

	// Register frontend bindings
	//m.overlay.Bind("overlay:savePosition", func(pos map[string]interface{}) {
	//	if x, ok := pos["x"].(float64); ok {
	//		if y, ok := pos["y"].(float64); ok {
	//			m.savePosition(int(x), int(y))
	//		}
	//	}
	//})
	//
	//m.overlay("overlay:getPosition", func() map[string]int {
	//	return m.position
	//})

	go m.monitorGame()
	go m.registerGlobalHotkey()
}
func (m *GameOverlayManager) Stop() {
	close(m.stopChan)
}

func (m *GameOverlayManager) monitorGame() {
	processChan, stopMonitor := process.MonitorProcesses(false, 1*time.Second)
	defer stopMonitor()

	// Check existing processes
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-m.stopChan:
			return
		case proc := <-processChan:
			// Handle new processes
			if strings.Contains(strings.ToLower(proc.Name), "league of legends.exe") {
				m.logger.Info("League of Legends game detected", zap.Uint32("pid", proc.PID))
				m.findAndTrackGameWindow()
			}
		case <-ticker.C:
			// Periodically check if game window is still available and correctly positioned
			if m.isGameRunning {
				if !m.isWindowValid(m.gameHwnd) {
					m.mutex.Lock()
					m.isGameRunning = false
					m.gameHwnd = 0
					m.mutex.Unlock()
					m.overlay.Hide()
				} else {
					//m.updateOverlayPosition()
				}
			} else {
				m.findAndTrackGameWindow()
			}
		}
	}
}

func (m *GameOverlayManager) registerGlobalHotkey() {

	//ctrlDown := false
	//shiftDown := false
	// Add this to your registerGlobalHotkey function to reduce hook sensitivity
	hook.Register(hook.KeyDown, []string{"ctrl", "shift", "b"}, func(event hook.Event) {
		m.toggleOverlay()
	})
	hook.Register(hook.KeyDown, []string{"ctrl", "shift", "m"}, func(event hook.Event) {
		m.toggleMouseEvents()
	})

	s := hook.Start()
	<-hook.Process(s)
}

func (m *GameOverlayManager) toggleMouseEvents() {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if !m.overlay.IsVisible() {
		return // Don't toggle if not visible
	}

	// Check current state
	ignoring := m.overlay.IsIgnoreMouseEvents()

	// Toggle the state
	m.overlay.SetIgnoreMouseEvents(!ignoring)

	// Update UI to show current mode
	if ignoring {
		m.overlay.EmitEvent("overlay:update", "Mode: Draggable (Ctrl+Shift+M to toggle)")
		m.logger.Info("Overlay is now draggable")
	} else {
		m.overlay.EmitEvent("overlay:update", "Mode: Click-through (Ctrl+Shift+M to toggle)")
		m.logger.Info("Overlay is now click-through")
	}
}
func (m *GameOverlayManager) toggleOverlay() {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if !m.isGameRunning {
		m.logger.Info("Toggle requested but game not running")
		return
	}

	if m.overlay.IsVisible() {
		m.logger.Info("Hiding overlay")
		m.overlay.Hide()
	} else {
		m.logger.Info("Showing overlay")
		//m.updateOverlayPosition()
		m.overlay.Show()
	}
}

func (m *GameOverlayManager) findAndTrackGameWindow() {
	// Find League of Legends game window
	hwnd := FindWindow(nil, windows.StringToUTF16Ptr("League of Legends (TM) Client"))
	if hwnd == 0 {
		return
	}

	// Check if window is visible
	if !IsWindowVisible(hwnd) {
		return
	}

	m.mutex.Lock()
	m.isGameRunning = true
	m.gameHwnd = hwnd
	m.mutex.Unlock()

	m.logger.Info("League of Legends game window found")
}

func (m *GameOverlayManager) updateOverlayPosition() {
	if m.gameHwnd == 0 {
		return
	}

	var rect windows.Rect
	if err := GetWindowRect(m.gameHwnd, &rect); err != nil {
		m.logger.Error("Failed to get game window rect", zap.Error(err))
		return
	}

	// Set overlay position relative to game window, but don't resize
	// Apply the saved position offset
	x := int(rect.Left) + m.position["x"]
	y := int(rect.Top) + m.position["y"]

	m.overlay.SetPosition(x, y)
	// Don't set size here - keep the overlay at its original dimensions
}

// Update the isWindowVisible function to use our helper
func (m *GameOverlayManager) isWindowValid(hwnd windows.HWND) bool {
	if hwnd == 0 {
		return false
	}

	return IsWindowVisible(hwnd)
}

func isWindowVisible(hwnd windows.HWND) bool {
	return windows.IsWindowVisible(hwnd)
}
