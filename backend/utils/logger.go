package utils

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"os"
	"path/filepath"
)

// Logger wraps zap logger functionality
type Logger struct {
	*zap.SugaredLogger
}

// NewLogger creates a logger that outputs to the console
func NewLogger(prefix string) *Logger {
	// Create encoder config
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.TimeKey = "time"
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder

	// Create console core
	consoleCore := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),
		zapcore.AddSync(os.Stdout),
		zap.NewAtomicLevelAt(zap.InfoLevel),
	)

	// Ensure logs directory exists
	logsDir := "logs"
	if err := os.MkdirAll(logsDir, os.ModePerm); err != nil {
		panic(err)
	}

	// Define log file paths
	infoLogPath := filepath.Join(logsDir, "app.log")
	debugLogPath := filepath.Join(logsDir, "debug.log")

	// Try to delete log files, but continue if they're in use
	if _, err := os.Stat(infoLogPath); err == nil {
		os.Remove(infoLogPath) // Ignore errors
	}
	if _, err := os.Stat(debugLogPath); err == nil {
		os.Remove(debugLogPath) // Ignore errors
	}

	// Create file cores with truncation flag to clear contents if we couldn't delete
	infoFile, err := os.OpenFile(infoLogPath, os.O_TRUNC|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		panic(err)
	}
	debugFile, err := os.OpenFile(debugLogPath, os.O_TRUNC|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		panic(err)
	}

	infoCore := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),
		zapcore.AddSync(infoFile),
		zap.NewAtomicLevelAt(zap.InfoLevel),
	)

	debugCore := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),
		zapcore.AddSync(debugFile),
		zap.NewAtomicLevelAt(zap.DebugLevel),
	)

	// Combine cores
	core := zapcore.NewTee(consoleCore, infoCore, debugCore)

	// Create logger with prefix as initial fields
	logger := zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))

	// Add prefix if provided
	if prefix != "" {
		logger = logger.With(zap.String("module", prefix))
	}

	// Return sugared logger for easier use
	return &Logger{
		SugaredLogger: logger.Sugar(),
	}
}

// NewFileLogger creates a logger that outputs to a file
func NewFileLogger(prefix string, file *os.File) *Logger {
	// Create encoder config
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.TimeKey = "time"
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder

	// Create core that outputs to file
	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig), // Use JSON for file output
		zapcore.AddSync(file),
		zap.NewAtomicLevelAt(zap.InfoLevel),
	)

	// Create logger with prefix as initial fields
	logger := zap.New(
		core,
		zap.AddCaller(),
		zap.AddCallerSkip(1),
		zap.AddStacktrace(zapcore.ErrorLevel),
	)

	// Add prefix if provided
	if prefix != "" {
		logger = logger.With(zap.String("module", prefix))
	}

	// Return sugared logger for easier use
	return &Logger{
		SugaredLogger: logger.Sugar(),
	}
}

func (l *Logger) WithField(key string, value interface{}) *Logger {
	return &Logger{
		SugaredLogger: l.SugaredLogger.With(key, value),
	}
}

// WithFields adds multiple fields to the logger
func (l *Logger) WithFields(fields map[string]interface{}) *Logger {
	args := make([]interface{}, 0, len(fields)*2)
	for k, v := range fields {
		args = append(args, k, v)
	}
	return &Logger{
		SugaredLogger: l.SugaredLogger.With(args...),
	}
}
