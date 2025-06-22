package logger

import (
	"github.com/google/uuid"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"sync"
)

var (
	contextFields = make(map[string]string)
	contextMu     sync.RWMutex
)

// InitSession initializes the logging session with a unique ID and app version.
// It should be called once at application startup.
func InitSession(config *config.Config) {
	contextMu.Lock()
	defer contextMu.Unlock()
	contextFields["sessionID"] = uuid.New().String()
	contextFields["appVersion"] = config.Version
	if config.Debug {
		contextFields["debug"] = "true"
	} else {
		contextFields["debug"] = "false"
	}
}

// SetUser sets the user for the current logging context. Call with an empty string on logout.
func SetUser(userID string, userUsername string) {
	contextMu.Lock()
	defer contextMu.Unlock()
	if userID == "" {
		delete(contextFields, "userID")
		delete(contextFields, "username")
	} else {
		contextFields["userID"] = userID
		contextFields["username"] = userUsername
	}
}

// contextCore is a zapcore.Core wrapper that adds dynamic fields to each log entry.
type contextCore struct {
	zapcore.Core
}

func (c *contextCore) With(fields []zapcore.Field) zapcore.Core {
	return &contextCore{c.Core.With(fields)}
}

func (c *contextCore) Check(ent zapcore.Entry, ce *zapcore.CheckedEntry) *zapcore.CheckedEntry {
	if c.Enabled(ent.Level) {
		return ce.AddCore(ent, c)
	}
	return ce
}

func (c *contextCore) Write(ent zapcore.Entry, fields []zapcore.Field) error {
	contextMu.RLock()
	for k, v := range contextFields {
		fields = append(fields, zap.String(k, v))
	}
	contextMu.RUnlock()
	return c.Core.Write(ent, fields)
}
