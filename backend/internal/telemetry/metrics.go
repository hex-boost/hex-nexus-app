package telemetry

import "context"

// MetricsRecorder defines a generic interface for recording application metrics.
// This decouples the application from a specific metrics implementation.
type MetricsRecorder interface {
	IncrementAppPanics(ctx context.Context)
	IncrementAppStartup(ctx context.Context)
	RecordHttpRequestDuration(ctx context.Context, duration float64)
	IncrementHttpRequestCount(ctx context.Context)
	IncrementUserSessions(ctx context.Context)
	DecrementUserSessions(ctx context.Context)
}
