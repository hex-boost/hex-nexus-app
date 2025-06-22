package observability

import (
	"context"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
	"net/http"
	"time"
)

type ObservabilityManager struct {
	config     *config.Config
	httpServer *http.Server
	logger     *zap.Logger
}

func NewManager(cfg *config.Config, logger *zap.Logger) *ObservabilityManager {
	return &ObservabilityManager{
		config: cfg,
		logger: logger,
	}
}

func (om *ObservabilityManager) Start() error {
	// Start HTTP server on a background port for Prometheus scraping
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())

	om.httpServer = &http.Server{
		Addr:    "127.0.0.1:9091", // Local metrics endpoint
		Handler: mux,
	}

	go func() {
		if err := om.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			om.logger.Error("Metrics server failed", zap.Error(err))
		}
	}()

	return nil
}

func (om *ObservabilityManager) Stop() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if om.httpServer != nil {
		return om.httpServer.Shutdown(ctx)
	}
	return nil
}
