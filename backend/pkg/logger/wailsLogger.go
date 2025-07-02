package logger

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
)

// WailsLoggerAdapter implements slog.Handler to bridge your custom logger with slog
type WailsLoggerAdapter struct {
	zapLogger *Logger
}

func NewWailsAdapter(zapLogger *Logger) *slog.Logger {
	adapter := &WailsLoggerAdapter{
		zapLogger: zapLogger,
	}

	// Create a new slog.Logger with our custom handler
	return slog.New(adapter)
}

// Enabled reports whether the handler handles records at the given level
func (w *WailsLoggerAdapter) Enabled(ctx context.Context, level slog.Level) bool {
	// Always return true for simplicity, or implement proper level checking
	return true
}

// Handle processes the slog.Record
// Handle processes the slog.Record
func (w *WailsLoggerAdapter) Handle(ctx context.Context, record slog.Record) error {
	message := record.Message

	// Handle Call Binding logs with clean formatting
	if strings.Contains(message, "Call Binding:") {
		var attrs []string
		record.Attrs(func(a slog.Attr) bool {
			attrs = append(attrs, fmt.Sprintf("%s=%v", a.Key, a.Value))
			return true
		})

		if len(attrs) > 0 {
			formattedMsg := fmt.Sprintf("%s %s", message, strings.Join(attrs, " "))
			w.zapLogger.Debug(formattedMsg)
		} else {
			w.zapLogger.Debug(message)
		}
		return nil
	}

	// Handle errors and warnings from Wails
	switch record.Level {
	case slog.LevelError:
		w.zapLogger.Error(message)
	case slog.LevelWarn:
		w.zapLogger.Warn(message)
	default:
		// Skip debug and info logs that aren't Call Binding
		return nil
	}

	return nil
}

// WithAttrs returns a new handler with the given attributes
func (w *WailsLoggerAdapter) WithAttrs(attrs []slog.Attr) slog.Handler {
	// For simplicity, return the same handler
	// You could implement attribute handling if needed
	return w
}

// WithGroup returns a new handler with the given group name
func (w *WailsLoggerAdapter) WithGroup(name string) slog.Handler {
	// For simplicity, return the same handler
	// You could implement group handling if needed
	return w
}
