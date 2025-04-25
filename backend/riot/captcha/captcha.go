package captcha

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"net/http"
	"sync"
	"time"
)

// Captcha handles all captcha-related functionality
type Captcha struct {
	client            *resty.Client
	logger            *logger.Logger
	window            *application.WebviewWindow
	response          chan string
	captchaServer     *http.Server
	rqdata            string
	isServerRunning   bool
	serverMutex       sync.Mutex
	captchaInProgress bool
}

func New(logger *logger.Logger) *Captcha {

	return &Captcha{
		logger:            logger,
		response:          make(chan string, 1), // Buffered channel to avoid deadlocks
		isServerRunning:   false,
		serverMutex:       sync.Mutex{},
		captchaInProgress: false,
	}
}
func (c *Captcha) SetRQData(rqdata string) {
	c.rqdata = rqdata
}

func (c *Captcha) StartServer() error {
	c.serverMutex.Lock()
	defer c.serverMutex.Unlock()

	if c.isServerRunning {
		c.logger.Info("Captcha server already started")
		// Clear the response channel if it has pending data
		select {
		case <-c.response:
			c.logger.Info("Cleared pending response from previous captcha session")
		default:
			// Channel already empty, do nothing
		}
		return nil
	}

	// Reset the response channel if needed
	if c.response == nil {
		c.response = make(chan string, 1)
	}

	mux := http.NewServeMux()

	captchaServer := &http.Server{
		Addr:    ":6969",
		Handler: mux,
	}
	c.captchaServer = captchaServer

	mux.HandleFunc("/index.html", func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Content-Type", "text/html")

		htmlContent := `<html>
<head>
    <script src="https://js.hcaptcha.com/1/api.js?render=explicit&onload=hCaptchaLoaded"
            async
            defer>
    </script>
    <script>
        async function hCaptchaLoaded() {
            widgetId = hcaptcha.render('hcaptcha-container', {
                sitekey: '019f1553-3845-481c-a6f5-5a60ccf6d830',
                callback: function (token) {
                    console.log("token received:", token)
                    const body = document.querySelector('#fds')
                    body.innerText = token

                    fetch('/api/captcha/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ token: token })
                    })
                    .then(response => response.json())
                    .then(data => console.log("Token submission result:", data))
                    .catch(error => console.error("Error submitting token:", error));
                },
            })

            try {
                const response = await fetch('/api/captcha/data');
                const data = await response.json();
                const rqdata = data.rqdata;
                document.querySelector('#fds').innerText = rqdata;
                hcaptcha.setData(widgetId, {
                    rqdata: rqdata
                });
            } catch (error) {
                console.error("Error fetching captcha data:", error);
            }
        }
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('hcaptcha-form').addEventListener('submit', function(event) {
                console.log('submit prevented')
                event.preventDefault();
            });
        });
    </script>
</head>
<body>
<div id="fds" style="display: none;">not selected</div>
<form action="/" method="POST" id="hcaptcha-form">
    <div id="hcaptcha-container"></div>
</form>
</body>
</html>`

		fmt.Fprint(w, htmlContent)
	})

	mux.HandleFunc("/api/captcha/data", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		rqdata := c.rqdata
		c.logger.Info("sending captcha token from the endpoint", zap.String("rqdata", rqdata))
		response := map[string]string{
			"rqdata": rqdata,
		}

		err := json.NewEncoder(w).Encode(response)
		if err != nil {
			return
		}
	})

	mux.HandleFunc("/api/captcha/token", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if r.Method == "POST" {
			var tokenData struct {
				Token string `json:"token"`
			}

			if err := json.NewDecoder(r.Body).Decode(&tokenData); err != nil {
				http.Error(w, "Invalid request", http.StatusBadRequest)
				return
			}
			c.logger.Info("Received captcha token", zap.String("token_length", fmt.Sprintf("%d", len(tokenData.Token))))
			if tokenData.Token != "" {
				c.SetResponse(tokenData.Token)
				c.logger.Info("token sent to channel")
			}

			json.NewEncoder(w).Encode(map[string]string{"status": "success"})
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	go func() {
		c.logger.Info("Starting captcha server on http://127.0.0.1:6969")
		c.isServerRunning = true
		if err := captchaServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			c.logger.Error("Failed to start captcha server", zap.Error(err))
			c.isServerRunning = false
		}
	}()

	return nil
}

func (c *Captcha) stopServer() {
	c.serverMutex.Lock()
	defer c.serverMutex.Unlock()

	if c.captchaServer != nil && c.isServerRunning {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		c.logger.Info("Stopping captcha server")
		if err := c.captchaServer.Shutdown(ctx); err != nil {
			c.logger.Error("Error shutting down captcha server", zap.Error(err))
		}
		c.isServerRunning = false
		c.captchaServer = nil
	}
}

func (c *Captcha) SetResponse(response string) {
	// Use non-blocking send to avoid deadlocks if channel isn't read
	select {
	case c.response <- response:
		c.logger.Info("Response sent to channel successfully")
	default:
		c.logger.Warn("Channel full or closed, creating new channel")
		c.response = make(chan string, 1)
		c.response <- response
	}
}

func (c *Captcha) SetWindow(window *application.WebviewWindow) {
	c.window = window

}
func (c *Captcha) GetWebView() (*application.WebviewWindow, error) {
	if c.window == nil {
		return nil, errors.New("webview_not_initialized")
	}
	return c.window, nil
}

func (c *Captcha) Reset() {
	c.serverMutex.Lock()
	defer c.serverMutex.Unlock()
	c.rqdata = ""
	c.captchaInProgress = false
	c.response = make(chan string, 1)
	c.logger.Info("Captcha fully reseted", zap.String("rqdata", c.rqdata), zap.Bool("captchaInProgress", c.captchaInProgress), zap.Any("response", c.response))
}

func (c *Captcha) WaitAndGetCaptchaResponse(ctx context.Context, timeout time.Duration) (string, error) {

	c.captchaInProgress = true
	defer func() { c.captchaInProgress = false }()

	c.logger.Info("Waiting for captcha resolution", zap.Duration("timeout", timeout))
	select {
	case token := <-c.response:
		if token == "" {
			c.logger.Info("Received empty captcha token, webview was likely closed")
			return "", errors.New("captcha_cancelled")
		}
		c.logger.Info("Captcha successfully resolved", zap.String("token_length", fmt.Sprintf("%d", len(token))))
		return token, nil
	case <-time.After(timeout):
		c.logger.Info("Timeout waiting for captcha resolution")
		return "", errors.New("captcha_timeout")

	case <-ctx.Done():
		c.logger.Info("Context cancelled before captcha resolution")
		return "", errors.New("captcha_cancelled")
	}
}
