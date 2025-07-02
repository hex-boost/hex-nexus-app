package metrics

import (
	"context"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/hex-boost/hex-nexus-app/backend/internal/telemetry"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/tracing"
	"go.opentelemetry.io/otel/attribute"
	"go.uber.org/zap"
)

// InitializeObservability sets up initial metrics, traces, and logs
func InitializeObservability(ctx context.Context, metrics telemetry.MetricsRecorder, tracer *tracing.Tracer, logger *zap.Logger, cfg *config.Config) {
	sendInitialTraces(ctx, tracer, logger)

	logStartupInfo(logger, cfg)
}

func sendInitialTraces(ctx context.Context, tracer *tracing.Tracer, logger *zap.Logger) {
	ctx, span := tracer.StartSpan(ctx, "app.startup")
	defer span.End()

	// Add attributes to the span
	span.SetAttributes(
		attribute.String("event", "application_start"),
		attribute.Bool("successful", true),
	)

	_, configSpan := tracer.StartSpan(ctx, "app.init.config")
	configSpan.End()

	_, servicesSpan := tracer.StartSpan(ctx, "app.init.services")
	servicesSpan.End()

	logger.Info("Application tracing initialized",
		zap.String("trace_id", span.SpanContext().TraceID().String()),
	)
}

func logStartupInfo(logger *zap.Logger, cfg *config.Config) {
	logger.Info("Application started",
		zap.String("version", cfg.Version),
		zap.Bool("debug", cfg.Debug),
		zap.Bool("loki_enabled", cfg.Loki.Enabled),
		zap.Bool("prometheus_enabled", cfg.Prometheus.Enabled),
	)
}
