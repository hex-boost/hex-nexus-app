package logger

import "context"

// LogService provides methods to interact with the logger from the frontend.
type LogService struct {
	ctx context.Context
}

func NewLogService() *LogService {
	return &LogService{}
}

// Startup is called when the app starts.
func (s *LogService) Startup(ctx context.Context) {
	s.ctx = ctx
}

func (s *LogService) SetUserContext(userID string, username string) {
	SetUser(userID, username)
}

func (s *LogService) ClearUserContext() {
	SetUser("", "")
}
