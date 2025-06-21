package tracing

import (
	"context"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.20.0"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

type Tracer struct {
	provider *sdktrace.TracerProvider
	tracer   trace.Tracer
	logger   *zap.Logger
}

func NewTracer(ctx context.Context, cfg *config.Config, logger *zap.Logger) (*Tracer, error) {
	if !cfg.Tempo.Enabled {
		return &Tracer{
			tracer: otel.GetTracerProvider().Tracer("noop"),
			logger: logger,
		}, nil
	}
	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithInsecure(),
		otlptracegrpc.WithEndpoint(cfg.Tempo.Endpoint),
		otlptracegrpc.WithDialOption(),
	)
	if err != nil {
		return nil, err
	}

	res := resource.NewWithAttributes(
		semconv.SchemaURL,
		semconv.ServiceName("nexus-app"),
		semconv.ServiceVersion(cfg.Version),
	)

	provider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)

	// Set global trace provider and propagator
	otel.SetTracerProvider(provider)
	otel.SetTextMapPropagator(propagation.TraceContext{})

	tracer := provider.Tracer("nexus-app")

	return &Tracer{
		provider: provider,
		tracer:   tracer,
		logger:   logger,
	}, nil
}
func (t *Tracer) StartSpan(ctx context.Context, name string) (context.Context, trace.Span) {
	return t.tracer.Start(ctx, name)
}

func (t *Tracer) Shutdown(ctx context.Context) error {
	if t.provider != nil {
		return t.provider.Shutdown(ctx)
	}
	return nil
}
