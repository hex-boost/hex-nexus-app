package metrics

import (
	"context"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/prometheus"
	"go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"

	semconv "go.opentelemetry.io/otel/semconv/v1.20.0"
)

// OtelMetrics holds the OpenTelemetry metric instruments and implements the MetricsRecorder interface.
type OtelMetrics struct {
	// App metrics
	AppStartupCounter metric.Int64Counter
	AppInfo           metric.Int64ObservableGauge
	AppPanics         metric.Int64Counter

	// System metrics
	SystemMemoryUsage metric.Float64Histogram
	SystemCPUUsage    metric.Float64Histogram

	// League metrics
	LeagueClientConnections metric.Int64Counter
	LeagueClientErrors      metric.Int64Counter

	// Network metrics
	HttpRequestDuration metric.Float64Histogram
	HttpRequestCount    metric.Int64Counter

	// User metrics
	UserSessions metric.Int64UpDownCounter
	UserActions  metric.Int64Counter
}

// NewOtelMetrics creates a new OtelMetrics instance.
func NewOtelMetrics() *OtelMetrics {
	meter := otel.GetMeterProvider().Meter("nexus-app")

	appStartupCounter, _ := meter.Int64Counter("app.startup", metric.WithDescription("Number of application startups"))
	appInfo, _ := meter.Int64ObservableGauge("app.info", metric.WithDescription("Application information"))
	appPanics, _ := meter.Int64Counter("app.panics", metric.WithDescription("Number of application panics"))
	systemMemory, _ := meter.Float64Histogram("system.memory.usage", metric.WithDescription("System memory usage in MB"))
	systemCPU, _ := meter.Float64Histogram("system.cpu.usage", metric.WithDescription("System CPU usage percentage"))
	leagueClients, _ := meter.Int64Counter("league.clients.connected", metric.WithDescription("Number of League client connections"))
	leagueErrors, _ := meter.Int64Counter("league.clients.errors", metric.WithDescription("Number of League client errors"))
	httpDuration, _ := meter.Float64Histogram("http.request.duration", metric.WithDescription("Duration of HTTP requests"))
	httpCount, _ := meter.Int64Counter("http.request.count", metric.WithDescription("Count of HTTP requests"))
	userSessions, _ := meter.Int64UpDownCounter("user.sessions", metric.WithDescription("Number of active user sessions"))
	userActions, _ := meter.Int64Counter("user.actions", metric.WithDescription("Count of user actions"))

	return &OtelMetrics{
		AppStartupCounter:       appStartupCounter,
		AppInfo:                 appInfo,
		AppPanics:               appPanics,
		SystemMemoryUsage:       systemMemory,
		SystemCPUUsage:          systemCPU,
		LeagueClientConnections: leagueClients,
		LeagueClientErrors:      leagueErrors,
		HttpRequestDuration:     httpDuration,
		HttpRequestCount:        httpCount,
		UserSessions:            userSessions,
		UserActions:             userActions,
	}
}

// IncrementAppPanics increases the count of application panics.
func (m *OtelMetrics) IncrementAppPanics(ctx context.Context) {
	m.AppPanics.Add(ctx, 1)
}

// IncrementAppStartup increases the count of application startups.
func (m *OtelMetrics) IncrementAppStartup(ctx context.Context) {
	m.AppStartupCounter.Add(ctx, 1)
}

// RecordHttpRequestDuration records the duration of an HTTP request.
func (m *OtelMetrics) RecordHttpRequestDuration(ctx context.Context, duration float64) {
	m.HttpRequestDuration.Record(ctx, duration)
}

// IncrementHttpRequestCount increases the count of HTTP requests.
func (m *OtelMetrics) IncrementHttpRequestCount(ctx context.Context) {
	m.HttpRequestCount.Add(ctx, 1)
}

// IncrementUserSessions increases the count of active user sessions.
func (m *OtelMetrics) IncrementUserSessions(ctx context.Context) {
	m.UserSessions.Add(ctx, 1)
}

// DecrementUserSessions decreases the count of active user sessions.
func (m *OtelMetrics) DecrementUserSessions(ctx context.Context) {
	m.UserSessions.Add(ctx, -1)
}

func InitPrometheusExporter() (*prometheus.Exporter, error) {
	exporter, err := prometheus.New(
		prometheus.WithNamespace("nexus_app"),
	)
	if err != nil {
		return nil, err
	}

	res := resource.NewWithAttributes(
		semconv.SchemaURL,
		semconv.ServiceName("nexus-app"),
	)

	provider := sdkmetric.NewMeterProvider(
		sdkmetric.WithResource(res),
		sdkmetric.WithReader(exporter),
	)

	otel.SetMeterProvider(provider)

	return exporter, nil
}
