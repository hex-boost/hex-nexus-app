package metrics

import (
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/prometheus"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.20.0"
)

type Metrics struct {
	// App metrics
	AppStartupCounter metric.Int64Counter
	AppInfo           metric.Int64ObservableGauge

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

func NewMetrics() *Metrics {
	meter := otel.GetMeterProvider().Meter("nexus-app")

	// App metrics
	appStartupCounter, _ := meter.Int64Counter("app.startup",
		metric.WithDescription("Number of application startups"))

	appInfo, _ := meter.Int64ObservableGauge("app.info",
		metric.WithDescription("Application information"))

	// System metrics
	systemMemory, _ := meter.Float64Histogram("system.memory.usage",
		metric.WithDescription("System memory usage in MB"))

	systemCPU, _ := meter.Float64Histogram("system.cpu.usage",
		metric.WithDescription("System CPU usage percentage"))

	// League metrics
	leagueClients, _ := meter.Int64Counter("league.clients.connected",
		metric.WithDescription("Number of League client connections"))

	leagueErrors, _ := meter.Int64Counter("league.clients.errors",
		metric.WithDescription("Number of League client errors"))

	// Network metrics
	httpDuration, _ := meter.Float64Histogram("http.request.duration",
		metric.WithDescription("Duration of HTTP requests"))

	httpCount, _ := meter.Int64Counter("http.request.count",
		metric.WithDescription("Count of HTTP requests"))

	// User metrics
	userSessions, _ := meter.Int64UpDownCounter("user.sessions",
		metric.WithDescription("Number of active user sessions"))

	userActions, _ := meter.Int64Counter("user.actions",
		metric.WithDescription("Count of user actions"))

	return &Metrics{
		AppStartupCounter:       appStartupCounter,
		AppInfo:                 appInfo,
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

	// Set up the meter provider with the exporter and resource
	provider := sdkmetric.NewMeterProvider(
		sdkmetric.WithResource(res),
		sdkmetric.WithReader(exporter),
	)

	// Set the global meter provider
	otel.SetMeterProvider(provider)

	return exporter, nil
}
