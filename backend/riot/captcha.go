package riot

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/inkeliz/gowebview"
	"go.uber.org/zap"
	"net/http"
	"time"
)

// Captcha handles all captcha-related functionality
type Captcha struct {
	client     *resty.Client
	logger     *utils.Logger
	cancel     context.CancelFunc
	response   chan string
	webview    gowebview.WebView
	ctx        context.Context
	httpServer *http.Server
}

func NewCaptcha(logger *utils.Logger) *Captcha {
	ctx, cancel := context.WithCancel(context.Background())

	return &Captcha{
		logger:   logger,
		response: make(chan string),
		ctx:      ctx,
		cancel:   cancel,
	}
}
func (c *Captcha) startServer(rqdata string) {
	mux := http.NewServeMux()

	captchaServer := &http.Server{
		Addr:    ":6969",
		Handler: mux,
	}

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
    <input type="submit" value="SEND">
</form>
</body>
</html>`

		fmt.Fprint(w, htmlContent)
	})

	mux.HandleFunc("/api/captcha/data", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

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
				go func() {
					select {
					case <-c.ctx.Done():
						c.logger.Info("Context already canceled, not sending token")
					default:
						c.response <- tokenData.Token
						c.logger.Info("token sent to channel")
					}
					err := c.httpServer.Shutdown(context.Background())
					if err != nil {
						c.logger.Error("Error shutting down HTTP server", zap.Error(err))
					}
					c.webview.Terminate()
				}()
			}

			json.NewEncoder(w).Encode(map[string]string{"status": "success"})
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	go func() {
		c.logger.Info("Starting captcha server on http://127.0.0.1:6969")
		if err := captchaServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			c.logger.Error("Failed to start captcha server", zap.Error(err))
		}
	}()
}

func (c *Captcha) SetResponse(response string) {
	select {
	case <-c.ctx.Done():
		c.logger.Info("Context already canceled, not sending response")
	default:
		c.response <- response
	}
}
func (c *Captcha) GetWebView() (gowebview.WebView, error) {
	// Reset context for a new captcha session
	c.ctx, c.cancel = context.WithCancel(context.Background())

	// Initialize and create webview
	webviewConfig := &gowebview.Config{
		WindowConfig: &gowebview.WindowConfig{
			Title: "Nexus HCaptcha",
		},
		URL: "http://127.0.0.1:6969/index.html",
	}

	webview, err := gowebview.New(webviewConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create webview: %w", err)
	}

	c.webview = webview

	// Set up monitoring of the webview
	go func() {
		// This will block until the webview is terminated
		webview.Run()

		// When webview is closed by the user, cancel the context
		c.logger.Info("Webview was closed by user")
		c.cancel()

		// Clean up resources
		if c.httpServer != nil {
			ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
			defer cancel()
			if err := c.httpServer.Shutdown(ctx); err != nil {
				c.logger.Error("Error shutting down HTTP server", zap.Error(err))
			}
		}

		// Send an empty response to unblock any waiters
		select {
		case c.response <- "":
			c.logger.Info("Sent empty captcha response due to webview closure")
		default:
			c.logger.Info("Response channel already processed or closed")
		}
	}()

	return webview, nil
}

func (c *Captcha) WaitAndGetCaptchaResponse(timeout time.Duration) (string, error) {
	c.logger.Info("Waiting for captcha resolution", zap.Duration("timeout", timeout))
	select {
	case token := <-c.response:
		if token == "" {
			c.logger.Info("Received empty captcha token, webview was likely closed")
			return "", errors.New("captcha_cancelled")
		}
		c.logger.Info("Captcha successfully resolved", zap.String("token_length", fmt.Sprintf("%d", len(token))))
		return token, nil
	case <-c.ctx.Done():
		c.logger.Info("Captcha context canceled (webview closed)")
		return "", errors.New("captcha_cancelled")
	case <-time.After(timeout):
		c.logger.Info("Timeout waiting for captcha resolution")
		return "", errors.New("captcha_timeout")
	}
}
