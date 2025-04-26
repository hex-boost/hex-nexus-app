//go:build !windows
// +build !windows

package watchdog

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type WatchdogUpdater interface {
	Update(active bool) error
}

const (
	// PipeName is a placeholder on non-Windows platforms
	PipeName = "/tmp/nexus_watchdog.sock"
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

// WatchdogClient is a stub client for non-Windows platforms
type WatchdogClient struct {
	logger *zap.Logger
}

// NewWatchdogClient creates a new stub watchdog client
func NewWatchdogClient() *WatchdogClient {
	logger, _ := zap.NewProduction()
	return &WatchdogClient{
		logger: logger,
	}
}

// Update is a stub implementation for non-Windows platforms
func (c *WatchdogClient) Update(active bool) error {
	c.logger.Info("Watchdog update called (stub implementation)",
		zap.Bool("active", active))
	return nil
}

// Update is a stub implementation for non-Windows platforms
func Update(active bool) error {
	return nil
}

// StartNamedPipeServer is a stub implementation for non-Windows platforms
func StartNamedPipeServer(w *Watchdog) error {
	w.logger.Info("Named pipe server not supported on this platform")
	return nil
}

// handlePipeConnection is a stub implementation for non-Windows platforms
func (w *Watchdog) handlePipeConnection(pipeHandle interface{}) {
	// No-op implementation
}

// LaunchStealthyWatchdog is a stub implementation for non-Windows platforms
func LaunchStealthyWatchdog(executablePath string, mainPID int) (*os.Process, error) {
	// Just return nil on Unix platforms
	return nil, nil
}

// InitializeStealthMode is a stub implementation for non-Windows platforms
func InitializeStealthMode() error {
	return nil
}

// UpdateAccountStatus updates the account status in memory
func (w *Watchdog) UpdateAccountStatus(active bool) {
	w.logger.Info("Updating account status (stub implementation)", zap.Bool("active", active))
	w.accountActive = active
}

// New creates a new watchdog instance (stub implementation)
func New(mainPID int, mainProcessPath string) *Watchdog {
	// Create logs directory if it doesn't exist
	logsDir := filepath.Join(filepath.Dir(mainProcessPath), "logs")
	if err := os.MkdirAll(logsDir, 0o755); err != nil {
		fmt.Printf("Failed to create logs directory: %v\n", err)
	}

	// Create log file with timestamp in name
	logPath := filepath.Join(logsDir, fmt.Sprintf("watchdog_%d_%s.log",
		mainPID, time.Now().Format("20060102_150405")))
	logFile, err := os.Create(logPath)
	if err != nil {
		fmt.Printf("Failed to create log file: %v\n", err)
	}

	// Configure zap logger
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

	logger.Info("Stub watchdog initialized",
		zap.Int("mainPID", mainPID),
		zap.String("mainProcessPath", mainProcessPath))

	return watchdog
}

func (w *Watchdog) AddCleanupFunction(fn func()) {
	w.logger.Debug("Adding cleanup function to watchdog (stub)")
	w.cleanupFuncs = append(w.cleanupFuncs, fn)
}

func (w *Watchdog) LoadState() (*WatchdogState, error) {
	return &WatchdogState{
		MainPID:       w.pid,
		NeedsCleanup:  false,
		AccountActive: w.accountActive,
		LastUpdated:   time.Now().Unix(),
	}, nil
}

func (w *Watchdog) SaveState(state WatchdogState) error {
	w.accountActive = state.AccountActive
	return nil
}

func (w *Watchdog) Start() error {
	w.logger.Info("Starting stub watchdog", zap.Int("forPID", w.pid))
	return nil
}

func (w *Watchdog) monitorLoop() {
	// Stub implementation - does nothing
}

// isProcessRunning is a minimal Unix implementation
func isProcessRunning(pid int) bool {
	process, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	fmt.Println(process)
	return err == nil
}

func (w *Watchdog) performCleanup() {
	w.logger.Info("Performing stub cleanup operations")

	// Call cleanup functions
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
	}

	// Flush logs
	if err := w.logger.Sync(); err != nil {
		fmt.Printf("Failed to sync logger: %v\n", err)
	}
	if w.logFile != nil {
		w.logFile.Close()
	}
}

func (w *Watchdog) Stop() {
	w.logger.Info("Stopping stub watchdog")
	close(w.stopChan)

	// Flush logs
	if err := w.logger.Sync(); err != nil {
		fmt.Printf("Failed to sync logger: %v\n", err)
	}
	if w.logFile != nil {
		w.logFile.Close()
	}
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
