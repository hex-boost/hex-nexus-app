package riot

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
	"net/http"
	"time"
)

// Captcha handles all captcha-related functionality
type Captcha struct {
	client        *resty.Client
	logger        *utils.Logger
	cancel        context.CancelFunc
	window        *application.WebviewWindow
	response      chan string
	captchaServer *http.Server
	rqdata        string
}

func NewCaptcha(logger *utils.Logger) *Captcha {

	return &Captcha{
		logger:   logger,
		response: make(chan string),
	}
}
func (c *Captcha) setRqData(rqdata string) {
	c.rqdata = rqdata
}
func (c *Captcha) startServer() {
	if c.captchaServer != nil {
		c.logger.Info("Captcha server already started")
		return
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
    <input type="submit" value="SEND">
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
		if err := captchaServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			c.logger.Error("Failed to start captcha server", zap.Error(err))
		}
	}()
}

func (c *Captcha) SetResponse(response string) {
	c.response <- response
}
func (c *Captcha) SetWindow(window *application.WebviewWindow) {
	c.window = window

}
func (c *Captcha) GetWebView() (*application.WebviewWindow, error) {

	c.window.SetURL("http://127.0.0.1:6969/index.html")
	c.window.Show()
	return c.window, nil
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
	case <-time.After(timeout):
		c.logger.Info("Timeout waiting for captcha resolution")
		return "", errors.New("captcha_timeout")
	}
}
