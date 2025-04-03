package utils

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"os"
	"path/filepath"
)

type Logger struct {
	*zap.SugaredLogger
}

func NewLogger(prefix string) *Logger {
	
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.TimeKey = "time"
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder

	consoleCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(encoderConfig),
		zapcore.AddSync(os.Stdout),
		zap.NewAtomicLevelAt(zap.InfoLevel),
	)

	logsDir := "logs"
	if err := os.MkdirAll(logsDir, os.ModePerm); err != nil {
		panic(err)
	}

	infoLogPath := filepath.Join(logsDir, "app.log")
	debugLogPath := filepath.Join(logsDir, "debug.log")

	if _, err := os.Stat(infoLogPath); err == nil {
		os.Remove(infoLogPath) 
	}
	if _, err := os.Stat(debugLogPath); err == nil {
		os.Remove(debugLogPath) 
	}

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

	core := zapcore.NewTee(consoleCore, infoCore, debugCore)

	logger := zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))

	if prefix != "" {
		logger = logger.With(zap.String("module", prefix))
	}

	return &Logger{
		SugaredLogger: logger.Sugar(),
	}
}

func NewFileLogger(prefix string) *Logger {
	logsDir := "logs"
	if err := os.MkdirAll(logsDir, os.ModePerm); err != nil {
		panic(err)
	}

	logPath := filepath.Join(logsDir, "app")

	file, err := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		panic(err)
	}
	
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.TimeKey = "time"
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder

	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig), 
		zapcore.AddSync(file),
		zap.NewAtomicLevelAt(zap.InfoLevel),
	)

	logger := zap.New(
		core,
		zap.AddCaller(),
		zap.AddCallerSkip(1),
		zap.AddStacktrace(zapcore.ErrorLevel),
	)

	if prefix != "" {
		logger = logger.With(zap.String("module", prefix))
	}

	return &Logger{
		SugaredLogger: logger.Sugar(),
	}
}

func (l *Logger) WithField(key string, value interface{}) *Logger {
	return &Logger{
		SugaredLogger: l.SugaredLogger.With(key, value),
	}
}

func (l *Logger) WithFields(fields map[string]interface{}) *Logger {
	args := make([]interface{}, 0, len(fields)*2)
	for k, v := range fields {
		args = append(args, k, v)
	}
	return &Logger{
		SugaredLogger: l.SugaredLogger.With(args...),
	}
}
