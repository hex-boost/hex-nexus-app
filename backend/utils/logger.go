package utils

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"os"
	"path/filepath"
)

type Logger struct {
	*zap.Logger
}

func NewLogger(prefix string) *Logger {
	// Create logs directory
	logsDir := "logs"
	if err := os.MkdirAll(logsDir, os.ModePerm); err != nil {
		panic(err)
	}

	// Configure encoder for both console and file
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.TimeKey = "time"
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder

	// Use the same encoder for console and files
	consoleEncoder := zapcore.NewConsoleEncoder(encoderConfig)
	fileEncoder := zapcore.NewConsoleEncoder(encoderConfig) // Same as console for consistency

	// Log level - DebugLevel to show all logs
	logLevel := zap.NewAtomicLevelAt(zapcore.DebugLevel)

	// Open log file - using append mode instead of truncating
	logFilePath := filepath.Join(logsDir, "app.log")
	logFile, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		panic(err)
	}

	// Create cores for both outputs with same level and encoder style
	consoleCore := zapcore.NewCore(
		consoleEncoder,

		zapcore.AddSync(os.Stdout),
		logLevel,
	)

	fileCore := zapcore.NewCore(
		fileEncoder,
		zapcore.AddSync(logFile),
		logLevel,
	)

	// Combine both cores
	core := zapcore.NewTee(consoleCore, fileCore)

	// Create the logger
	logger := zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))

	// Add prefix if provided
	if prefix != "" {
		logger = logger.With(zap.String("module", prefix))
	}

	return &Logger{
		logger,
	}
}
