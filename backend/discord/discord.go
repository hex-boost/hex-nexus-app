package discord

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/gorilla/mux"
	"github.com/hex-boost/hex-nexus-app/backend"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/pkg/browser"
	"html/template"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	discordCallbackPort = 45986
	discordApiBaseURL   = "https://discord.com/api"
	authWaitTimeout     = 2 * time.Minute
)

// Discord encapsulates functionality related to Discord authentication and integration
type Discord struct {
	config *DiscordConfig
	logger *utils.Logger
}

// DiscordConfig contains the necessary configurations for Discord integration
type DiscordConfig struct {
	backendURL string
	client     *resty.Client
}

// NewDiscord creates a new instance of the Discord service
func New(logger *utils.Logger) *Discord {
	return &Discord{
		config: &DiscordConfig{
			backendURL: os.Getenv("BACKEND_URL"),
			client:     resty.New(),
		},
		logger: logger,
	}
}

// renderTemplate renders an HTML template from the embedded file system
func (d *Discord) renderTemplate(w http.ResponseWriter, tmplName string) error {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmplPath := "templates/" + tmplName
	tmpl, err := template.ParseFS(backend.TemplatesFS, tmplPath)
	if err != nil {
		d.logger.Error("Error parsing template", "template", tmplPath, "error", err)
		return err
	}
	return tmpl.Execute(w, nil)
}

func (d *Discord) renderErrorTemplate(w http.ResponseWriter, err error) {
	w.WriteHeader(http.StatusBadRequest)
	if err := d.renderTemplate(w, "discord_auth_error.html"); err != nil {
		d.logger.Error("Error rendering error template", err)
	}
	return
}

// StartDiscordOAuth starts the OAuth authentication flow with Discord
func (d *Discord) StartDiscordOAuth() (map[string]interface{}, error) {
	strapiAuthURL := fmt.Sprintf("%s/api/connect/discord", d.config.backendURL)

	d.logger.Info("Starting OAuth authentication with Discord", "url", strapiAuthURL)

	// Open browser with authentication URL
	if err := browser.OpenURL(strapiAuthURL); err != nil {
		d.logger.Error("Error opening browser for authentication", "error", err)
		return nil, fmt.Errorf("error opening browser: %v", err)
	}

	// Channels for asynchronous communication
	resultChan := make(chan map[string]interface{}, 1)
	errChan := make(chan error, 1)

	// Set up HTTP server with Gorilla Mux
	router := mux.NewRouter()
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", discordCallbackPort),
		Handler: router,
	}

	router.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		code := r.URL.Query().Get("access_token")
		if code == "" {
			errMsg := errors.New("authorization code not found")
			d.renderErrorTemplate(w, errMsg)
			errChan <- errMsg

		}

		d.logger.Info("Authorization code received", "code_length", len(code))

		// Authenticate with Strapi and process avatar
		jwt, userData, err := d.authenticateWithStrapiAndProcessAvatar(code)
		if err != nil {
			errMsg := errors.New("error in Strapi authentication")
			d.renderErrorTemplate(w, errMsg)
			errChan <- errMsg
			return
		}

		if err := d.renderTemplate(w, "discord_auth_success.html"); err != nil {
			d.logger.Error("Error rendering success template", "error", err)
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Error rendering success page"))
			return
		}
		d.logger.Info("Authentication successful")

		// Send result to channel
		resultChan <- map[string]interface{}{
			"jwt":  jwt,
			"user": userData,
		}

		// Close the server after a brief delay
		go func() {
			time.Sleep(1 * time.Second)
			d.logger.Debug("Shutting down temporary HTTP server")
			srv.Shutdown(context.Background())
		}()
	})

	// Start the server in a goroutine
	d.logger.Info("Starting HTTP server for OAuth callback", "port", discordCallbackPort)
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			d.logger.Error("HTTP server error", "error", err)
			errChan <- fmt.Errorf("HTTP server error: %v", err)
		}
	}()

	// Wait for result or error
	select {
	case result := <-resultChan:
		d.logger.Info("Authentication completed successfully")
		return result, nil
	case err := <-errChan:
		d.logger.Error("Authentication failed", "error", err)
		return nil, err
	case <-time.After(authWaitTimeout):
		d.logger.Warn("Authentication timeout exceeded", "timeout", authWaitTimeout)
		srv.Shutdown(context.Background())
		return nil, fmt.Errorf("authentication timeout exceeded")
	}
}

// fetchDiscordUserInfo fetches user information from the Discord API
func (d *Discord) fetchDiscordUserInfo(accessToken string) (*types.DiscordUser, error) {
	d.logger.Debug("Fetching Discord user information")

	resp, err := d.config.client.R().
		SetHeader("Authorization", "Bearer "+accessToken).
		Get(discordApiBaseURL + "/users/@me")

	if err != nil {
		d.logger.Error("Failed to fetch Discord user information", "error", err)
		return nil, fmt.Errorf("failed to fetch user information: %v", err)
	}

	if resp.StatusCode() != 200 {
		d.logger.Error("Discord API returned error", "status", resp.StatusCode(), "body", string(resp.Body()))
		return nil, fmt.Errorf("failed to fetch Discord user information: status %d", resp.StatusCode())
	}

	var user types.DiscordUser
	if err := json.Unmarshal(resp.Body(), &user); err != nil {
		d.logger.Error("Error decoding Discord API response", "error", err)
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	d.logger.Info("Discord user information obtained successfully", "user_id", user.ID, "username", user.Username)
	return &user, nil
}

// authenticateWithStrapiAndProcessAvatar authenticates user with Strapi and processes avatar
func (d *Discord) authenticateWithStrapiAndProcessAvatar(code string) (string, interface{}, error) {
	d.logger.Info("Authenticating with Strapi", "backend_url", d.config.backendURL)

	// Authenticate with Strapi to get JWT
	var authResult struct {
		JWT  string     `json:"jwt"`
		User types.User `json:"user"`
	}
	authURL := fmt.Sprintf("%s/api/auth/discord/callback?access_token=%s", d.config.backendURL, code)
	resp, err := d.config.client.R().
		SetResult(&authResult).
		SetHeader("hwid", utils.NewUtils().GetHWID()).
		Get(authURL)
	if err != nil {
		d.logger.Error("Error in Strapi authentication", "error", err)
		return "", nil, fmt.Errorf("authentication error: %v", err)
	}
	if resp.IsError() {
		d.logger.Error("error in Strapi authentication", "status", resp.StatusCode(), "response", string(resp.Body()))
		return "", nil, fmt.Errorf("authentication error: %d - %s", resp.StatusCode(), string(resp.Body()))
	}
	d.logger.Info("Strapi authentication successful", "user_id", authResult.User.Id)

	// Process and upload Discord avatar
	if err := d.uploadDiscordAvatar(code, authResult.JWT, authResult.User.Id); err != nil {
		d.logger.Warn("Error processing avatar", "error", err, "user_id", authResult.User.Id)
	} else {
		d.logger.Info("Avatar processed successfully", "user_id", authResult.User.Id)
	}

	// Fetch updated user information after avatar upload
	userMeURL := fmt.Sprintf("%s/api/users/me", d.config.backendURL)
	userResp, err := d.config.client.R().
		SetHeader("Authorization", "Bearer "+authResult.JWT).
		Get(userMeURL)

	if err != nil {
		d.logger.Error("Error fetching user data", "error", err)
		return authResult.JWT, &authResult.User, nil // Retorna usuário da autenticação como fallback
	}

	var userData map[string]interface{}
	if err := json.Unmarshal(userResp.Body(), &userData); err != nil {
		d.logger.Error("Error decoding user response", "error", err)
		return authResult.JWT, &authResult.User, nil // Retorna usuário da autenticação como fallback
	}
	userId, _ := userData["id"].(float64) // Ou int, dependendo de como o número é serializado
	username, _ := userData["username"].(string)
	d.logger.Info("User data fetched successfully after avatar upload", "user_id", userId, "username", username)

	return authResult.JWT, &userData, nil
}

// uploadDiscordAvatar downloads the Discord user's avatar and uploads it to Strapi
func (d *Discord) uploadDiscordAvatar(accessToken string, userJwt string, userId int) error {
	d.logger.Debug("Starting Discord avatar upload process", "user_id", userId)

	// Get Discord user data
	discordUser, err := d.fetchDiscordUserInfo(accessToken)
	if err != nil {
		return err
	}

	// Check if user has an avatar
	if discordUser.Avatar == "" {
		d.logger.Info("User does not have a Discord avatar", "user_id", userId)
		return fmt.Errorf("user does not have a Discord avatar")
	}

	// Build avatar URL
	avatarUrl := fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png", discordUser.ID, discordUser.Avatar)
	d.logger.Debug("Avatar URL", "url", avatarUrl)

	// Download avatar image
	d.logger.Debug("Downloading Discord avatar")
	imgResp, err := d.config.client.R().Get(avatarUrl)
	if err != nil {
		d.logger.Error("Error downloading avatar", "error", err)
		return fmt.Errorf("error downloading avatar: %v", err)
	}

	if imgResp.IsError() {
		d.logger.Error("Failed to get image", "status", imgResp.StatusCode())
		return fmt.Errorf("failed to get image: %d", imgResp.StatusCode())
	}

	// Determine content type
	contentType := imgResp.Header().Get("Content-Type")
	if contentType == "" {
		contentType = "image/png"
	}
	extension := strings.Split(contentType, "/")[1]
	if extension == "" {
		extension = "png"
	}

	d.logger.Debug("Avatar content type", "content_type", contentType, "extension", extension)

	// Create multipart for upload
	var requestBody bytes.Buffer
	multipartWriter := multipart.NewWriter(&requestBody)

	part, err := multipartWriter.CreateFormFile("files", fmt.Sprintf("avatar-%s.%s", discordUser.ID, extension))
	if err != nil {
		d.logger.Error("Error creating multipart", "error", err)
		return fmt.Errorf("error creating multipart: %v", err)
	}

	if _, err = part.Write(imgResp.Body()); err != nil {
		d.logger.Error("Error writing image data", "error", err)
		return fmt.Errorf("error writing image data: %v", err)
	}
	multipartWriter.Close()

	// Upload the image
	d.logger.Debug("Sending image to Strapi", "endpoint", "/api/upload")
	uploadResp, err := d.config.client.R().
		SetHeader("Content-Type", multipartWriter.FormDataContentType()).
		SetHeader("Authorization", "Bearer "+userJwt).
		SetBody(requestBody.Bytes()).
		Post(d.config.backendURL + "/api/upload")

	if err != nil {
		d.logger.Error("Error sending upload request", "error", err)
		return fmt.Errorf("error sending upload request: %v", err)
	}

	if uploadResp.IsError() {
		d.logger.Error("Upload failed", "status", uploadResp.StatusCode(), "response", string(uploadResp.Body()))
		return fmt.Errorf("upload failed: %d - %s", uploadResp.StatusCode(), string(uploadResp.Body()))
	}

	// Process upload response
	var uploadResult []map[string]interface{}
	if err := json.Unmarshal(uploadResp.Body(), &uploadResult); err != nil {
		d.logger.Error("Error decoding upload response", "error", err)
		return fmt.Errorf("error decoding upload response: %v", err)
	}

	if len(uploadResult) == 0 {
		d.logger.Error("Empty upload response")
		return fmt.Errorf("empty upload response")
	}

	// Extract avatar ID
	avatarId, ok := uploadResult[0]["id"].(float64)
	if !ok {
		d.logger.Error("Avatar ID not found in response")
		return fmt.Errorf("avatar ID not found in response")
	}

	d.logger.Debug("Avatar uploaded successfully", "avatar_id", avatarId)

	// Update user avatar
	updateData := map[string]interface{}{
		"avatar": avatarId,
	}

	updateURL := fmt.Sprintf("%s/api/users/%d", d.config.backendURL, userId)
	d.logger.Debug("Updating user with new avatar", "url", updateURL)
	updateResp, err := d.config.client.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("Authorization", "Bearer "+userJwt).
		SetBody(updateData).
		Put(updateURL)

	if err != nil {
		d.logger.Error("Error sending update request", "error", err)
		return fmt.Errorf("error sending update request: %v", err)
	}

	if updateResp.IsError() {
		d.logger.Error("Failed to update user", "status", updateResp.StatusCode(), "response", string(updateResp.Body()))
		return fmt.Errorf("failed to update user: %d - %s", updateResp.StatusCode(), string(updateResp.Body()))
	}

	d.logger.Info("Avatar updated successfully", "user_id", userId, "avatar_id", avatarId)
	return nil
}

// HandleDiscordCallback sets up an HTTP server to process Discord callbacks
func (d *Discord) handleDiscordCallback(callback func(token string, err error)) {
	router := mux.NewRouter()
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", discordCallbackPort),
		Handler: router,
	}

	d.logger.Info("Setting up server for Discord callback", "port", discordCallbackPort)

	router.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		code := r.URL.Query().Get("access_token")
		d.logger.Debug("Callback received with token", "token_length", len(code))

		// Authenticate with Strapi
		authURL := fmt.Sprintf("%s/api/auth/discord/callback?access_token=%s", d.config.backendURL, code)
		resp, err := d.config.client.R().Get(authURL)

		var token string
		if err == nil {
			var result struct {
				JWT string `json:"jwt"`
			}
			if jsonErr := json.Unmarshal(resp.Body(), &result); jsonErr == nil {
				token = result.JWT
				d.logger.Info("Authentication successful", "token_length", len(token))
			} else {
				err = jsonErr
				d.logger.Error("Error decoding JWT response", "error", jsonErr)
			}
		} else {
			d.logger.Error("Authentication error", "error", err)
		}

		if err := d.renderTemplate(w, "discord_auth_success.html"); err != nil {
			d.logger.Error("Error rendering success template", "error", err)
		}

		go func() {
			time.Sleep(2 * time.Second)
			d.logger.Debug("Shutting down HTTP server")
			srv.Shutdown(context.Background())
		}()

		callback(token, err)
	})

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			d.logger.Error("HTTP server error", "error", err)
		}
	}()
}
