package riot

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/inkeliz/gowebview"
	"go.uber.org/zap"
	"net/http"
	"time"
)

func (rc *RiotClient) startCaptchaServer() {
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

		rc.logger.Info("sending captcha token from the endpoint", zap.String("token_length", rc.captchaData))
		response := map[string]string{
			"rqdata": rc.captchaData,
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
			rc.logger.Info("Received captcha token", zap.String("token_length", fmt.Sprintf("%d", len(tokenData.Token))))
			if tokenData.Token != "" {

				go func() {
					rc.hcaptchaResponse <- tokenData.Token
					rc.logger.Info("token sent to channel")
					err := captchaServer.Shutdown(context.Background())
					if err != nil {
						return
					}
					rc.webview.Terminate()
				}()
			}

			json.NewEncoder(w).Encode(map[string]string{"status": "success"})
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	
	go func() {
		rc.logger.Info("Starting captcha server on http://127.0.0.1:6969")
		if err := captchaServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			rc.logger.Error("Failed to start captcha server", zap.Error(err))
		}
	}()
}

func (rc *RiotClient) GetWebView() (gowebview.WebView, error) {
	webview, err := gowebview.New(&gowebview.Config{URL: "http://127.0.0.1:6969/index.html"})
	if err != nil {
		return nil, err
	}
	rc.webview = webview
	return webview, nil
}

func (rc *RiotClient) CloseWebview() {
	
}
func (rc *RiotClient) handleCaptcha() error {
	rc.logger.Info("Starting captcha handling")

	captchaData, err := rc.getCaptchaData()
	if err != nil {
		rc.logger.Error("Failed to get captcha data", zap.Error(err))
		return err
	}

	rc.captchaData = captchaData

	return nil
}
func (rc *RiotClient) IsAuthStateValid() error {
	if rc.client == nil {
		return errors.New("client is not initialized")
	}
	var getCurrentAuthResult types.RiotIdentityResponse
	result, err := rc.client.R().SetResult(&getCurrentAuthResult).Get("/rso-authenticator/v1/authentication")
	if err != nil {
		rc.logger.Error("Authentication failed", zap.Error(err))
		return err
	}
	if result.IsError() {
		rc.logger.Error("Authentication failed",
			zap.String("message", string(result.Body())),
			zap.Int("status_code", result.StatusCode()))
		return fmt.Errorf("authentication failed with status code %d: %s",
			result.StatusCode(), string(result.Body()))
	}
	if getCurrentAuthResult.Type != "auth" {
		return errors.New("invalid authentication state")
	}
	return nil
}
func (rc *RiotClient) getCaptchaData() (string, error) {
	err := rc.IsAuthStateValid()
	if err != nil {
		rc.logger.Error("Invalid authentication state", zap.Error(err))
		return "", err
	}
	_, err = rc.client.R().
		Delete("/rso-authenticator/v1/authentication")
	if err != nil {
		rc.logger.Error("Error in authentication delete session", zap.Error(err))
		return "", err
	}
	var startAuthResult types.RiotIdentityResponse
	startAuthRes, err := rc.client.R().
		SetBody(getRiotIdentityStartPayload()).
		SetResult(&startAuthResult).
		Post("/rso-authenticator/v1/authentication/riot-identity/start")
	if err != nil {
		rc.logger.Error("Error in authentication start request", zap.Error(err))
		return "", err
	}
	if startAuthRes.IsError() {
		var errorResponse types.ErrorResponse
		if err := json.Unmarshal(startAuthRes.Body(), &errorResponse); err != nil {
			rc.logger.Error("Failed to parse error response", zap.Error(err))
		}
		rc.logger.Error("Authentication failed", zap.String("message", errorResponse.Message))
		return "", errors.New(errorResponse.Message)
	}
	if startAuthResult.Captcha.Hcaptcha.Data == "" {
		return "", errors.New("no captcha data")
	}
	return startAuthResult.Captcha.Hcaptcha.Data, nil
}

func (rc *RiotClient) WaitAndGetCaptchaResponse(timeout time.Duration) (string, error) {
	rc.logger.Info("Waiting for captcha resolution", zap.Duration("timeout", timeout))
	select {
	case token := <-rc.hcaptchaResponse:
		rc.logger.Info("Captcha successfully resolved", zap.String("token_length", fmt.Sprintf("%d", len(token))))
		return token, nil
	case <-time.After(timeout):
		return "", errors.New("timeout waiting for captcha resolution")
	}
}
