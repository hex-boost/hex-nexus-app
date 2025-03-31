package riot

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/inkeliz/gowebview"
	"go.uber.org/zap"
	"net/http"
)

func (c *Client) startCaptchaServer() {
	http.HandleFunc("/index.html", func(w http.ResponseWriter, r *http.Request) {
		// Set the requested headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Content-Type", "text/html")

		// Serve the HTML file content
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

                    // Submit token using fetch
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
<div id="fds">not selected</div>
<form action="/" method="POST" id="hcaptcha-form">
    <div id="hcaptcha-container"></div>
    <input type="submit" value="SEND">
</form>
</body>
</html>`

		fmt.Fprint(w, htmlContent)
	})

	// API endpoint to get captcha data
	http.HandleFunc("/api/captcha/data", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		c.logger.Info("sending captcha token from the endpoint", zap.String("token_length", c.captchaData))
		response := map[string]string{
			"rqdata": c.captchaData,
		}

		err := json.NewEncoder(w).Encode(response)
		if err != nil {
			return
		}
	})

	// API endpoint to receive token
	http.HandleFunc("/api/captcha/token", func(w http.ResponseWriter, r *http.Request) {
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
					c.hcaptchaResponse <- tokenData.Token
					c.logger.Info("token sent to channel")
				}()
			}

			json.NewEncoder(w).Encode(map[string]string{"status": "success"})
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Start the server on port 6969
	go func() {
		c.logger.Info("Starting captcha server on http://127.0.0.1:6969")
		if err := http.ListenAndServe(":6969", nil); err != nil {
			c.logger.Error("Failed to start captcha server", zap.Error(err))
		}
	}()
}

func (c *Client) getWebView() (gowebview.WebView, error) {
	webview, err := gowebview.New(&gowebview.Config{URL: "http://127.0.0.1:6969/index.html"})
	if err != nil {
		return nil, err
	}

	return webview, nil
}
func (c *Client) handleCaptcha() error {
	c.logger.Info("Starting captcha handling")

	// Get captcha data
	captchaData, err := c.getCaptchaData()
	if err != nil {
		c.logger.Error("Failed to get captcha data", zap.Error(err))
		return err
	}

	c.captchaData = captchaData

	// Return captcha data so it can be rendered
	return nil
}

func (c *Client) getCaptchaData() (string, error) {
	var getCurrentAuthResult types.RiotIdentityResponse

	_, err := c.client.R().SetResult(&getCurrentAuthResult).Get("/rso-authenticator/v1/authentication")
	if err != nil {
		return "", err
	}
	if getCurrentAuthResult.Type == "auth" && getCurrentAuthResult.Captcha.Hcaptcha.Data != "" {
		return getCurrentAuthResult.Captcha.Hcaptcha.Data, nil
	}

	var startAuthResult types.RiotIdentityResponse
	startAuthRes, err := c.client.R().
		SetBody(getRiotIdentityStartPayload()).
		SetResult(&startAuthResult).
		Post("/rso-authenticator/v1/authentication/riot-identity/start")
	if err != nil {
		c.logger.Error("Error in authentication start request", zap.Error(err))
		return "", err
	}

	if startAuthRes.IsError() {
		var errorResponse types.ErrorResponse
		if err := json.Unmarshal(startAuthRes.Body(), &errorResponse); err != nil {
			c.logger.Error("Failed to parse error response", zap.Error(err))
		}
		c.logger.Error("Authentication failed", zap.String("message", errorResponse.Message))
		return "", errors.New(errorResponse.Message)
	}

	if startAuthResult.Captcha.Hcaptcha.Data == "" {
		return "", errors.New("no captcha data")
	}
	return startAuthResult.Captcha.Hcaptcha.Data, nil
}
