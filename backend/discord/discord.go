package discord

import (
	"bytes"
	"net"
	"sync"

	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/gorilla/mux"
	"github.com/hex-boost/hex-nexus-app/backend"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/pkg/browser"
	"go.uber.org/zap"
	"html/template"
	"mime/multipart"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	discordCallbackPort = 45986
	discordApiBaseURL   = "https://discord.com/api"
	authWaitTimeout     = 2 * time.Minute
)

// Add these global variables at the package level
var (
	globalServer     *http.Server
	globalRouter     *mux.Router
	callbackHandlers map[string]func(*types.UserWithJWT, error) // Map to store callback handlers by ID
	serverMutex      sync.Mutex
	isServerRunning  bool
	isAuthInProgress bool                    // New flag to track if authentication is in progress
	currentAuthChan  chan *types.UserWithJWT // Channel for the current auth flow
	currentErrChan   chan error              // Error channel for current auth flow
)

type Discord struct {
	config        *config.Config
	backendClient *resty.Client
	logger        *utils.Logger
	utils         *utils.Utils
}

func New(config *config.Config, logger *utils.Logger, utils *utils.Utils) *Discord {
	client := resty.New()
	client.SetBaseURL(config.BackendURL)
	callbackHandlers = make(map[string]func(*types.UserWithJWT, error))
	return &Discord{
		backendClient: client,
		config:        config,
		logger:        logger,
		utils:         utils,
	}
}

func (d *Discord) renderTemplate(w http.ResponseWriter, tmplName string) error {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmplPath := "templates/" + tmplName
	tmpl, err := template.ParseFS(backend.TemplatesFS, tmplPath)
	if err != nil {
		d.logger.Sugar().Infow("error parsing template", "template", tmplPath, "error", err)
		return err
	}
	return tmpl.Execute(w, nil)
}
func (d *Discord) renderErrorTemplate(w http.ResponseWriter) {
	w.WriteHeader(http.StatusBadRequest)
	if err := d.renderTemplate(w, "discord_auth_error.html"); err != nil {
		d.logger.Error("Error rendering error template", zap.Error(err))
	}
	return
}

func (d *Discord) StartOAuth() (*types.UserWithJWT, error) {
	// Check if authentication is already in progress
	serverMutex.Lock()
	if isAuthInProgress {
		serverMutex.Unlock()
		return nil, errors.New("authentication_already_in_progress")
	}

	// Set the auth in progress flag
	isAuthInProgress = true

	// Create channels for this authentication flow
	userWithJWTChan := make(chan *types.UserWithJWT, 1)
	errChan := make(chan error, 1)

	// Store the current channels
	currentAuthChan = userWithJWTChan
	currentErrChan = errChan
	serverMutex.Unlock()

	// Make sure we reset the auth flag when this function returns
	defer func() {
		serverMutex.Lock()
		isAuthInProgress = false
		currentAuthChan = nil
		currentErrChan = nil
		serverMutex.Unlock()
	}()

	strapiAuthURL := fmt.Sprintf("%s/api/connect/discord", d.config.BackendURL)
	d.logger.Sugar().Infow("Starting OAuth authentication with Discord", "url", strapiAuthURL)
	if err := browser.OpenURL(strapiAuthURL); err != nil {
		d.logger.Error("Error opening browser for authentication", zap.Error(err))
		return nil, fmt.Errorf("error opening browser: %v", err)
	}

	// Create a context with timeout that we can cancel when needed
	ctx, cancel := context.WithTimeout(context.Background(), authWaitTimeout)
	defer cancel()

	// Set up server if it's not already running
	serverMutex.Lock()
	if !isServerRunning {
		globalRouter = mux.NewRouter()
		globalServer = &http.Server{
			Addr:    fmt.Sprintf(":%d", discordCallbackPort),
			Handler: globalRouter,
		}

		// Set up the persistent callback route handler
		globalRouter.HandleFunc("/callback", d.handleCallback)

		// Start the server in a goroutine
		go func() {
			d.logger.Info("Starting HTTP server for OAuth callback", zap.Int("port", discordCallbackPort))
			if err := globalServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
				d.logger.Error("HTTP server error", zap.Error(err))
			}
		}()

		isServerRunning = true
	}
	serverMutex.Unlock()

	// Wait for authentication result or timeout
	select {
	case result := <-userWithJWTChan:
		d.logger.Info("Authentication completed successfully")
		return result, nil
	case err := <-errChan:
		d.logger.Error("Authentication failed", zap.Error(err))
		return nil, err
	case <-ctx.Done():
		return nil, fmt.Errorf("authentication timeout exceeded")
	}
}

// Create a separate handler function for the callback
func (d *Discord) handleCallback(w http.ResponseWriter, r *http.Request) {
	// Get a lock to ensure we're accessing the channels safely
	serverMutex.Lock()
	userWithJWTChan := currentAuthChan
	errChan := currentErrChan

	// Check if we have an active authentication flow
	if !isAuthInProgress || userWithJWTChan == nil || errChan == nil {
		serverMutex.Unlock()
		d.logger.Warn("Received callback but no authentication is in progress")
		d.renderErrorTemplate(w)
		return
	}
	serverMutex.Unlock()

	code := r.URL.Query().Get("access_token")
	if code == "" {
		errMsg := errors.New("authorization code not found")
		d.renderErrorTemplate(w)
		select {
		case errChan <- errMsg:
		default:
		}
		return
	}

	d.logger.Info("Authorization code received", zap.Int("code_length", len(code)))
	userWithJWT, err := d.authenticateWithStrapiAndProcessAvatar(code)
	if err != nil {
		errMsg := errors.New("error in Strapi authentication")
		d.renderErrorTemplate(w)
		select {
		case errChan <- errMsg:
		default:
		}
		return
	}

	if err := d.renderTemplate(w, "discord_auth_success.html"); err != nil {
		d.logger.Error("Error rendering success template", zap.Error(err))
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Error rendering success page"))
		return
	}

	d.logger.Info("Authentication successful")
	// Send the result to the waiting goroutine
	select {
	case userWithJWTChan <- userWithJWT:
	default:
		d.logger.Warn("Could not send authentication result - channel may be closed")
	}
}
func (d *Discord) isPortAvailable(port int) bool {
	serverMutex.Lock()
	defer serverMutex.Unlock()

	if isServerRunning {
		// If our server is already running, the port is "available" for our use
		return false
	}

	addr := fmt.Sprintf(":%d", port)
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		d.logger.Warn("Port is already in use by another process", zap.Int("port", port))
		return false
	}
	ln.Close()
	return true
}

func (d *Discord) fetchDiscordUserInfo(accessToken string) (*types.DiscordUser, error) {
	restyClient := resty.New()
	request := restyClient.R()
	resp, err := request.SetHeader("Authorization", "Bearer "+accessToken).
		Get(discordApiBaseURL + "/users/@me")
	if err != nil {
		d.logger.Error("Failed to fetch Discord user information", zap.Error(err))
		return nil, fmt.Errorf("failed to fetch user information: %v", err)
	}
	if resp.StatusCode() != 200 {
		d.logger.Error("Discord API returned error", zap.Int("status", resp.StatusCode()), zap.String("body", string(resp.Body())))
		return nil, fmt.Errorf("failed to fetch Discord user information: status %d", resp.StatusCode())
	}
	var user types.DiscordUser
	if err := json.Unmarshal(resp.Body(), &user); err != nil {
		d.logger.Error("Error decoding Discord API response", zap.Error(err))
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}
	d.logger.Info("Discord user information obtained successfully", zap.String("user_id", user.ID), zap.String("username", user.Username))
	return &user, nil
}

func (d *Discord) authenticateWithStrapiAndProcessAvatar(code string) (*types.UserWithJWT, error) {
	var authResult types.UserWithJWT
	authURL := fmt.Sprintf("/api/auth/discord/callback?access_token=%s", url.QueryEscape(code))

	request := d.backendClient.R()

	if d.utils != nil {
		request.SetHeader("hwid", d.utils.GetHWID())
	} else {
		d.logger.Warn("Utils is nil, cannot get HWID")
	}

	resp, err := request.Get(authURL)
	if err != nil {
		d.logger.Error("Error in Strapi authentication", zap.Error(err))
		return nil, fmt.Errorf("authentication error: %v", err)
	}
	if resp.IsError() {
		d.logger.Error("error in Strapi authentication", zap.Int("status", resp.StatusCode()), zap.String("response", string(resp.Body())))
		return nil, fmt.Errorf("authentication error: %d - %s", resp.StatusCode(), string(resp.Body()))
	}

	// Parse the response body into authResult
	if err := json.Unmarshal(resp.Body(), &authResult); err != nil {
		d.logger.Error("Error parsing authentication response", zap.Error(err))
		return nil, fmt.Errorf("error parsing authentication response: %v", err)
	}

	d.logger.Info("Strapi authentication successful", zap.Int("user_id", authResult.User.Id))

	// Use a separate error variable to avoid overwriting the JWT on avatar upload failure
	avatarErr := d.uploadDiscordAvatar(code, authResult.JWT, authResult.User.Id)
	if avatarErr != nil {
		d.logger.Warn("Error processing avatar", zap.Error(avatarErr), zap.Int("user_id", authResult.User.Id))
	} else {
		d.logger.Info("Avatar processed successfully", zap.Int("user_id", authResult.User.Id))
	}
	userResp, err := d.backendClient.R().
		SetHeader("Authorization", "Bearer "+authResult.JWT).
		Get("/api/users/me")

	if err != nil {
		d.logger.Error("Error fetching user data", zap.Error(err))
		return &authResult, nil
	}
	var userData types.User
	if err := json.Unmarshal(userResp.Body(), &userData); err != nil {
		d.logger.Error("Error decoding user response", zap.Error(err))
		return &authResult, nil
	}
	userId := userData.Id
	username := userData.Username
	d.logger.Info("User data fetched successfully after avatar upload", zap.Int("user_id", userId), zap.String("username", username))
	return &authResult, nil
}

func (d *Discord) uploadDiscordAvatar(accessToken string, userJwt string, userId int) error {
	d.logger.Debug("Starting Discord avatar upload process", zap.Int("user_id", userId))
	discordUser, err := d.fetchDiscordUserInfo(accessToken)
	if err != nil {
		return err
	}
	if discordUser.Avatar == "" {
		d.logger.Info("User does not have a Discord avatar", zap.Int("user_id", userId))
		return fmt.Errorf("user does not have a Discord avatar")
	}
	avatarUrl := fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png", discordUser.ID, discordUser.Avatar)
	d.logger.Debug("Avatar URL", zap.String("url", avatarUrl))
	imgResp, err := d.backendClient.R().Get(avatarUrl)
	if err != nil {
		d.logger.Error("Error downloading avatar", zap.Error(err))
		return fmt.Errorf("error downloading avatar: %v", err)
	}
	if imgResp.IsError() {
		d.logger.Error("Failed to get image", zap.Int("status", imgResp.StatusCode()))
		return fmt.Errorf("failed to get image: %d", imgResp.StatusCode())
	}
	contentType := imgResp.Header().Get("Content-Type")
	if contentType == "" {
		contentType = "image/png"
	}
	extension := strings.Split(contentType, "/")[1]
	if extension == "" {
		extension = "png"
	}
	d.logger.Debug("Avatar content type", zap.String("content_type", contentType), zap.String("extension", extension))
	var requestBody bytes.Buffer
	multipartWriter := multipart.NewWriter(&requestBody)
	part, err := multipartWriter.CreateFormFile("files", fmt.Sprintf("avatar-%s.%s", discordUser.ID, extension))
	if err != nil {
		d.logger.Error("Error creating multipart", zap.Error(err))
		return fmt.Errorf("error creating multipart: %v", err)
	}
	if _, err = part.Write(imgResp.Body()); err != nil {
		d.logger.Error("Error writing image data", zap.Error(err))
		return fmt.Errorf("error writing image data: %v", err)
	}
	multipartWriter.Close()
	d.logger.Debug("Sending image to Strapi", zap.String("endpoint", "/api/upload"))
	uploadResp, err := d.backendClient.R().
		SetHeader("Content-Type", multipartWriter.FormDataContentType()).
		SetHeader("Authorization", "Bearer "+userJwt).
		SetBody(requestBody.Bytes()).
		Post("/api/upload")
	if err != nil {
		d.logger.Error("Error sending upload request", zap.Error(err))
		return fmt.Errorf("error sending upload request: %v", err)
	}
	if uploadResp.IsError() {
		d.logger.Error("Upload failed", zap.Int("status", uploadResp.StatusCode()), zap.String("response", string(uploadResp.Body())))
		return fmt.Errorf("upload failed: %d - %s", uploadResp.StatusCode(), string(uploadResp.Body()))
	}
	var uploadResult []map[string]interface{}
	if err := json.Unmarshal(uploadResp.Body(), &uploadResult); err != nil {
		d.logger.Error("Error decoding upload response", zap.Error(err))
		return fmt.Errorf("error decoding upload response: %v", err)
	}
	if len(uploadResult) == 0 {
		d.logger.Error("Empty upload response")
		return fmt.Errorf("empty upload response")
	}
	avatarId, ok := uploadResult[0]["id"].(float64)
	if !ok {
		d.logger.Error("Avatar ID not found in response")
		return fmt.Errorf("avatar ID not found in response")
	}
	d.logger.Debug("Avatar uploaded successfully", zap.Float64("avatar_id", avatarId))
	updateData := map[string]interface{}{
		"avatar": avatarId,
	}
	updateURL := fmt.Sprintf("/api/users/%d", userId)
	d.logger.Debug("Updating user with new avatar", zap.String("url", updateURL))
	updateResp, err := d.backendClient.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("Authorization", "Bearer "+userJwt).
		SetBody(updateData).
		Put(updateURL)
	if err != nil {
		d.logger.Error("Error sending update request", zap.Error(err))
		return fmt.Errorf("error sending update request: %v", err)
	}
	if updateResp.IsError() {
		d.logger.Error("Failed to update user", zap.Int("status", updateResp.StatusCode()), zap.String("response", string(updateResp.Body())))
		return fmt.Errorf("failed to update user: %d - %s", updateResp.StatusCode(), string(updateResp.Body()))
	}

	d.logger.Info("Avatar updated successfully", zap.Int("user_id", userId), zap.Float64("avatar_id", avatarId))
	return nil
}

func (d *Discord) handleDiscordCallback(callback func(token string, err error)) {
	// Create a context with timeout to ensure proper cleanup
	ctx, cancel := context.WithTimeout(context.Background(), authWaitTimeout)
	defer cancel()

	router := mux.NewRouter()
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", discordCallbackPort),
		Handler: router,
	}

	d.logger.Info("Setting up server for Discord callback", zap.Int("port", discordCallbackPort))

	router.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		code := r.URL.Query().Get("access_token")
		d.logger.Debug("Callback received with token", zap.Int("token_length", len(code)))

		authURL := fmt.Sprintf("/api/auth/discord/callback?access_token=%s", code)
		resp, err := d.backendClient.R().Get(authURL)

		var token string
		if err == nil {
			var result struct {
				JWT string `json:"jwt"`
			}
			if jsonErr := json.Unmarshal(resp.Body(), &result); jsonErr == nil {
				token = result.JWT
				d.logger.Info("Authentication successful", zap.Int("token_length", len(token)))
			} else {
				err = jsonErr
				d.logger.Error("Error decoding JWT response", zap.Error(jsonErr))
			}
		} else {
			d.logger.Error("Authentication error", zap.Error(err))
		}

		if err := d.renderTemplate(w, "discord_auth_success.html"); err != nil {
			d.logger.Error("Error rendering success template", zap.Error(err))
		}

		// Call the callback with the result
		callback(token, err)

		// Schedule server shutdown
		go func() {
			time.Sleep(2 * time.Second)
			d.logger.Debug("Shutting down HTTP server")
			// Use a separate context for shutdown
			shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer shutdownCancel()
			srv.Shutdown(shutdownCtx)
		}()
	})

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			d.logger.Error("HTTP server error", zap.Error(err))
			callback("", fmt.Errorf("HTTP server error: %v", err))
		}
	}()

	// Ensure server gets shut down after context timeout
	go func() {
		<-ctx.Done()
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			d.logger.Warn("Authentication timeout exceeded")
			callback("", fmt.Errorf("authentication timeout exceeded"))

			// Ensure server shutdown
			shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer shutdownCancel()
			srv.Shutdown(shutdownCtx)
		}
	}()
}
