package stripe

import (
	"context"
	"errors"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/hex-boost/hex-nexus-app/backend"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"go.uber.org/zap"
	"html/template"
	"net"
	"net/http"
	"sync"
	"time"
)

// PaymentResult contains the result of a payment operation
type PaymentResult struct {
	Success   bool
	SessionID string
	Error     error
	Canceled  bool
}

// CheckoutSession represents a Stripe checkout session
type CheckoutSession struct {
	URL       string `json:"url"`
	SessionID string `json:"session_id,omitempty"`
}

// SubscriptionRequest represents a request to create a subscription
type SubscriptionRequest struct {
	SubscriptionTier string `json:"subscriptionTier"`
	SuccessURL       string `json:"successUrl"`
	CancelURL        string `json:"cancelUrl"`
}

// Stripe handles payment processing and callbacks
type Stripe struct {
	logger     *logger.Logger
	server     *http.Server
	port       int
	callbackCh chan PaymentResult
	mu         sync.Mutex
	ctx        context.Context
	cancel     context.CancelFunc
	serverUsed bool // Tracks if the current server has received a callback
}

// New creates a new Stripe handler
func New(logger *logger.Logger) *Stripe {
	ctx, cancel := context.WithCancel(context.Background())
	return &Stripe{
		logger:     logger,
		callbackCh: make(chan PaymentResult, 1),
		ctx:        ctx,
		cancel:     cancel,
		serverUsed: false,
	}
}

// findFreePort gets an available port
func findFreePort() (int, error) {
	addr, err := net.ResolveTCPAddr("tcp", "localhost:0")
	if err != nil {
		return 0, err
	}

	l, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return 0, err
	}
	defer l.Close()

	return l.Addr().(*net.TCPAddr).Port, nil
}

// resetServer stops the current server and prepares for a new one if needed
func (s *Stripe) resetServer() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.server != nil && s.serverUsed {
		// If server exists and was used, shut it down
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		err := s.server.Shutdown(ctx)
		s.server = nil
		s.port = 0
		if err != nil {
			return err
		}
	}

	// Reset context and server used flag
	s.ctx, s.cancel = context.WithCancel(context.Background())
	s.serverUsed = false

	return nil
}

// StartServer initializes and starts the HTTP server
func (s *Stripe) StartServer() (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.server != nil {
		return s.port, nil
	}

	port, err := findFreePort()
	if err != nil {
		return 0, fmt.Errorf("failed to find free port: %w", err)
	}
	s.port = port

	router := mux.NewRouter()

	// Setup routes
	router.HandleFunc("/stripe_payment_success", s.handleSuccess)
	router.HandleFunc("/stripe_payment_cancelled", s.handleCancelled)

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: router,
	}
	s.server = server

	go func() {
		s.logger.Info("Starting Stripe callback server", zap.Int("port", port))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.logger.Error("Stripe HTTP server error", zap.Error(err))
		}
	}()

	return port, nil
}

// StopServer gracefully shuts down the server
func (s *Stripe) StopServer() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.server == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := s.server.Shutdown(ctx)
	s.server = nil // Make sure this is set to nil
	s.port = 0     // Reset port

	return err
}

// renderTemplate serves an HTML template from the embedded filesystem
func (s *Stripe) renderTemplate(w http.ResponseWriter, tmplName string) error {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmplPath := "templates/" + tmplName
	tmpl, err := template.ParseFS(backend.TemplatesFS, tmplPath)
	if err != nil {
		s.logger.Error("Error parsing template", zap.String("template", tmplPath), zap.Error(err))
		return err
	}
	return tmpl.Execute(w, nil)
}

// handleSuccess processes successful payment callbacks
func (s *Stripe) handleSuccess(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	s.serverUsed = true
	s.mu.Unlock()

	sessionID := r.URL.Query().Get("session_id")
	s.logger.Info("Payment successful", zap.String("session_id", sessionID))

	if err := s.renderTemplate(w, "stripe_payment_success.html"); err != nil {
		s.logger.Error("Error rendering success template", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Error rendering success page"))
		return
	}

	// Send success result through channel
	s.callbackCh <- PaymentResult{
		Success:   true,
		SessionID: sessionID,
	}

	// Schedule server shutdown
	go func() {
		time.Sleep(5 * time.Second)
		s.StopServer()
	}()
}

// handleCancelled processes cancelled payment callbacks
func (s *Stripe) handleCancelled(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	s.serverUsed = true
	s.mu.Unlock()

	s.logger.Info("Payment cancelled")

	if err := s.renderTemplate(w, "stripe_payment_cancel.html"); err != nil {
		s.logger.Error("Error rendering cancellation template", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Error rendering cancellation page"))
		return
	}

	// Send cancellation result through channel
	s.callbackCh <- PaymentResult{
		Canceled: true,
	}

	// Schedule server shutdown
	go func() {
		time.Sleep(5 * time.Second)
		s.StopServer()
	}()
}

func (s *Stripe) GetCallbackURLs() (string, string, error) {
	// Reset server if it's been used
	if err := s.resetServer(); err != nil {
		return "", "", fmt.Errorf("failed to reset server: %w", err)
	}

	// Clear any pending results from the channel
	select {
	case <-s.callbackCh:
		// Drain channel if there's a pending result
	default:
		// Channel already empty, do nothing
	}

	port, err := s.StartServer()
	if err != nil {
		return "", "", fmt.Errorf("failed to start callback server: %w", err)
	}

	successURL := fmt.Sprintf("http://nexus.localhost:%d/stripe_payment_success", port)
	cancelURL := fmt.Sprintf("http://nexus.localhost:%d/stripe_payment_cancelled", port)
	s.logger.Info("Callback URLs created",
		zap.String("successUrl", successURL),
		zap.String("cancelUrl", cancelURL))

	return successURL, cancelURL, nil
}

// WaitForPaymentResult waits for the payment to complete or timeout
func (s *Stripe) WaitForPaymentResult(timeout time.Duration) (PaymentResult, error) {
	select {
	case result := <-s.callbackCh:
		return result, nil
	case <-time.After(timeout):
		s.StopServer()
		return PaymentResult{}, errors.New("payment_timeout")
	case <-s.ctx.Done():
		return PaymentResult{}, errors.New("payment_canceled")
	}
}

// CancelPendingPayment cancels any in-progress payment flow
func (s *Stripe) CancelPendingPayment() {
	s.cancel()
	s.StopServer()
}
