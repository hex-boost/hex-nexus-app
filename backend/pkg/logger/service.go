package logger

import (
	"context"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
)

// LogService provides methods to interact with the logger from the frontend.
type LogService struct {
	ctx    context.Context
	logger *Logger
}

func NewLogService(logger *Logger) *LogService {
	return &LogService{logger: logger}
}
func (s *LogService) OnStartup(ctx context.Context, options application.ServiceOptions) error {
	s.ctx = ctx
	return nil
}

func (s *LogService) SetUserContext(userID string, username string) {
	SetUser(userID, username)
}

func (s *LogService) ClearUserContext() {
	SetUser("", "")
}
func (s *LogService) Info(component string, message string, data map[string]interface{}) {
	fields := []zap.Field{zap.String("component", component)}
	if data != nil {
		fields = append(fields, zap.Any("data", data))
	}
	s.logger.Info(message, fields...)
}

// Warn logs a warning message from the frontend.
func (s *LogService) Warn(component string, message string, data map[string]interface{}) {
	fields := []zap.Field{zap.String("component", component)}
	if data != nil {
		fields = append(fields, zap.Any("data", data))
	}
	s.logger.Warn(message, fields...)
}

// Error logs an error message from the frontend.
func (s *LogService) Error(component string, message string, data map[string]interface{}) {
	fields := []zap.Field{zap.String("component", component)}
	if data != nil {
		fields = append(fields, zap.Any("data", data))
	}
	s.logger.Error(message, fields...)
}
