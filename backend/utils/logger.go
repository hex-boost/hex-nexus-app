package utils

import (
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"os"
	"path/filepath"
	"strings"
)

type Logger struct {
	*zap.Logger
}

func NewLogger(prefix string, config *config.Config) *Logger {
	// Create logs directory
	if err := os.MkdirAll(config.LogsDirectory, os.ModePerm); err != nil {
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
	var zapLogLevel zapcore.Level
	switch strings.ToLower(config.LogLevel) {
	case "debug":
		zapLogLevel = zapcore.DebugLevel
	case "info":
		zapLogLevel = zapcore.InfoLevel
	case "warn", "warning":
		zapLogLevel = zapcore.WarnLevel
	case "error":
		zapLogLevel = zapcore.ErrorLevel
	default:
		zapLogLevel = zapcore.InfoLevel
	}
	// Log level - DebugLevel to show all logs
	atomicLevel := zap.NewAtomicLevelAt(zapLogLevel)

	// Open log file - using append mode instead of truncating
	logFilePath := filepath.Join(config.LogsDirectory, "app.log")
	logFile, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		panic(fmt.Sprintf("error opening log file %v", err))
	}

	// Create cores for both outputs with same level and encoder style
	consoleCore := zapcore.NewCore(
		consoleEncoder,

		zapcore.AddSync(os.Stdout),
		atomicLevel,
	)

	fileCore := zapcore.NewCore(
		fileEncoder,
		zapcore.AddSync(logFile),
		atomicLevel,
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
