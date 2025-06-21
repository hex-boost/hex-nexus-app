package logger

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
)

type Logger struct {
	*zap.Logger
}
type Loggerer interface {
	Info(msg string, fields ...zap.Field)
	Debug(msg string, fields ...zap.Field)
	Error(msg string, fields ...zap.Field)
}

func New(prefix string, config *config.Config) *Logger {
	// Try to create logs directory
	logFilePath := filepath.Join(config.LogsDirectory, "app.log")
	err := os.MkdirAll(config.LogsDirectory, os.ModePerm)

	// Core configuration
	encoderConfig := zap.NewDevelopmentEncoderConfig()
	encoderConfig.TimeKey = "time"
	encoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("15:04:05") // Shorter time format
	encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder       // Color-coded log levels
	encoderConfig.EncodeCaller = zapcore.ShortCallerEncoder            // Shorter caller path
	encoderConfig.StacktraceKey = "stacktrace"

	consoleEncoder := zapcore.NewConsoleEncoder(encoderConfig)

	// Determine log level
	zapLogLevel := getLogLevel(config.LogLevel)
	atomicLevel := zap.NewAtomicLevelAt(zapLogLevel)

	// Always have console logging
	cores := []zapcore.Core{
		zapcore.NewCore(
			consoleEncoder,
			zapcore.AddSync(os.Stdout),
			atomicLevel,
		),
	}

	logFilePath := filepath.Join(config.LogsDirectory, "app.log")
	err := os.MkdirAll(config.LogsDirectory, os.ModePerm)
	if err == nil {
		fileEncoder := zapcore.NewConsoleEncoder(encoderConfig)
		cores = append(cores, zapcore.NewCore(
			fileEncoder,
			zapcore.AddSync(&lumberjack.Logger{
				Filename:   logFilePath,
				MaxSize:    10, // megabytes
				MaxBackups: 3,
				MaxAge:     28, // days
				Compress:   true,
			}),
			atomicLevel,
		))
	} else {
		fmt.Printf("Warning: Could not create logs directory: %v. Continuing with console logging only.\n", err)
	}

	// Create the logger with available cores
	core := zapcore.NewTee(cores...)
	logger := zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))

	// Add prefix if provided
	if prefix != "" {
		logger = logger.With(zap.String("module", prefix))
	}

	return &Logger{logger}
}

func getLogLevel(logLevel string) zapcore.Level {
	switch strings.ToLower(logLevel) {
	case "debug":
		return zapcore.DebugLevel
	case "info":
		return zapcore.InfoLevel
	case "warn", "warning":
		return zapcore.WarnLevel
	case "error":
		return zapcore.ErrorLevel
	default:
		return zapcore.InfoLevel
	}
}
