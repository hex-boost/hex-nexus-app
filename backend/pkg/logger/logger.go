package logger

import (
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
	"os"
	"path/filepath"
	"strings"
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
	// Core configuration
	encoderConfig := zap.NewDevelopmentEncoderConfig()
	encoderConfig.TimeKey = "time"
	encoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("15:04:05") // Shorter time format
	encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder       // Color-coded log levels
	encoderConfig.EncodeCaller = zapcore.ShortCallerEncoder            // Shorter caller path
	encoderConfig.StacktraceKey = "stacktrace"

	// Determine log level
	zapLogLevel := getLogLevel(config.LogLevel)
	atomicLevel := zap.NewAtomicLevelAt(zapLogLevel)

	var cores []zapcore.Core

	// Console core
	consoleEncoder := zapcore.NewConsoleEncoder(encoderConfig)
	cores = append(cores, zapcore.NewCore(
		consoleEncoder,
		zapcore.AddSync(os.Stdout),
		atomicLevel,
	))

	// File core
	logFilePath := filepath.Join(config.LogsDirectory, "app.log")
	if err := os.MkdirAll(config.LogsDirectory, os.ModePerm); err == nil {
		fileEncoder := zapcore.NewConsoleEncoder(encoderConfig)
		cores = append(cores, zapcore.NewCore(
			fileEncoder,
			zapcore.AddSync(&lumberjack.Logger{
				Filename:   logFilePath,
				MaxSize:    10, // megabytes
				MaxBackups: 3,
				MaxAge:     7, // days
				Compress:   true,
			}),
			atomicLevel,
		))
	} else {
		fmt.Printf("Warning: Could not create logs directory: %v. Continuing with console logging only.\n", err)
	}

	// Loki core
	if config.Loki.Enabled {
		lokiHook := NewLokiHook(config)
		lokiWriter := NewLokiWriter(lokiHook, getLogLevel(config.LogLevel))

		lokiEncoderConfig := zap.NewProductionEncoderConfig()
		lokiEncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
		lokiEncoderConfig.TimeKey = "time"
		lokiEncoderConfig.MessageKey = "msg"
		lokiEncoderConfig.LevelKey = "level"
		lokiEncoder := zapcore.NewJSONEncoder(lokiEncoderConfig)

		lokiCore := zapcore.NewCore(
			lokiEncoder,
			zapcore.AddSync(lokiWriter),
			atomicLevel,
		)
		cores = append(cores, lokiCore)
	}

	core := &contextCore{zapcore.NewTee(cores...)}

	// Create the logger
	logger := zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))

	// This section was causing the issue - it was adding another Loki core and
	// trying to reassign to core without properly wrapping it in a contextCore
	if config.Loki.Enabled {
		lokiHook := NewLokiHook(config)

		lokiEncoder := zapcore.NewJSONEncoder(encoderConfig)
		lokiCore := zapcore.NewCore(
			lokiEncoder,
			zapcore.AddSync(lokiHook),
			atomicLevel,
		)

		// Fix: Wrap the new tee in a contextCore struct
		core = &contextCore{zapcore.NewTee(append(cores, lokiCore)...)}

		// Update the logger with the new core
		logger = zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))
	}

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
