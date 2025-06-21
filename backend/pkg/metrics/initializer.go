package metrics

import (
	"context"
	"time"

	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/tracing"
	"go.opentelemetry.io/otel/attribute"
	"go.uber.org/zap"
)

// InitializeObservability sets up initial metrics, traces, and logs
func InitializeObservability(ctx context.Context, metrics *Metrics, tracer *tracing.Tracer, logger *zap.Logger, cfg *config.Config) {
	// Send startup metrics
	sendStartupMetrics(ctx, metrics, cfg)

	// Create initial trace
	sendInitialTraces(ctx, tracer, logger)

	// Log startup information
	logStartupInfo(logger, cfg)
}

func sendStartupMetrics(ctx context.Context, m *Metrics, cfg *config.Config) {
	// Record app startup
	m.AppStartupCounter.Add(ctx, 1)

	// Record system info available at startup
	m.SystemMemoryUsage.Record(ctx, float64(getSystemMemoryUsage()))
	m.SystemCPUUsage.Record(ctx, float64(getSystemCPUUsage()))
}

func sendInitialTraces(ctx context.Context, tracer *tracing.Tracer, logger *zap.Logger) {
	ctx, span := tracer.StartSpan(ctx, "app.startup")
	defer span.End()

	// Add attributes to the span
	span.SetAttributes(
		attribute.String("event", "application_start"),
		attribute.Bool("successful", true),
	)

	// Create child spans for initialization phases
	_, configSpan := tracer.StartSpan(ctx, "app.init.config")
	time.Sleep(1 * time.Millisecond) // Simulate work
	configSpan.End()

	_, servicesSpan := tracer.StartSpan(ctx, "app.init.services")
	time.Sleep(2 * time.Millisecond) // Simulate work
	servicesSpan.End()

	logger.Info("Application tracing initialized",
		zap.String("trace_id", span.SpanContext().TraceID().String()),
	)
}

func logStartupInfo(logger *zap.Logger, cfg *config.Config) {
	logger.Info("Application started",
		zap.String("version", cfg.Version),
		zap.Bool("debug", cfg.Debug),
		zap.String("auth_type", cfg.LeagueAuthType),
		zap.Bool("loki_enabled", cfg.Loki.Enabled),
		zap.Bool("tempo_enabled", cfg.Tempo.Enabled),
		zap.Bool("prometheus_enabled", cfg.Prometheus.Enabled),
	)
}

// Helper functions to get system metrics - implement these for your platform
func getSystemMemoryUsage() int64 {
	// Implement this based on your platform
	return 1000 // Placeholder value
}

func getSystemCPUUsage() float64 {
	// Implement this based on your platform
	return 5.0 // Placeholder value
}
