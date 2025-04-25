package discord

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"go.uber.org/zap"
	"mime/multipart"
	"net/url"
)

// Client handles Discord-related API operations
type Client struct {
	api *client.HTTPClient
}

// NewDiscordClient creates a new Discord client
func NewDiscordClient(api *HTTPClient) *Client {
	return &Client{
		api
		: api
		,
	}
}

// Authenticate authenticates a user with Discord
func (d *Client) Authenticate(accessToken string, hwid string) (*types.UserWithJWT, error) {
	var authResult types.UserWithJWT
	authURL := fmt.Sprintf("/api/auth/discord/callback?access_token=%s", url.QueryEscape(accessToken))

	request := d.api
	.Client.R()
	if hwid != "" {
		request.SetHeader("hwid", hwid)
	}

	resp, err := request.Get(authURL)
	if err != nil {
		d.api
		.Logger.Error("Error in Discord authentication", zap.Error(err))
		return nil, fmt.Errorf("authentication error: %v", err)
	}

	if resp.IsError() {
		return nil, fmt.Errorf("authentication error: %d - %s", resp.StatusCode(), string(resp.Body()))
	}

	if err := json.Unmarshal(resp.Body(), &authResult); err != nil {
		return nil, fmt.Errorf("error parsing authentication response: %v", err)
	}

	return &authResult, nil
}

// UploadAvatar uploads a Discord avatar for a user
func (d *Client) UploadAvatar(imageData []byte, filename string, jwt string) (float64, error) {
	var requestBody bytes.Buffer
	multipartWriter := multipart.NewWriter(&requestBody)

	part, err := multipartWriter.CreateFormFile("files", filename)
	if err != nil {
		return 0, fmt.Errorf("error creating multipart: %v", err)
	}

	if _, err = part.Write(imageData); err != nil {
		return 0, fmt.Errorf("error writing image data: %v", err)
	}

	multipartWriter.Close()

	client := d.api
	.Client.R().
		SetHeader("Content-Type", multipartWriter.FormDataContentType()).
		SetHeader("Authorization", "Bearer "+jwt)

	uploadResp, err := client.SetBody(requestBody.Bytes()).Post("/api/upload")
	if err != nil {
		return 0, fmt.Errorf("error sending upload request: %v", err)
	}

	if uploadResp.IsError() {
		return 0, fmt.Errorf("upload failed: %d - %s", uploadResp.StatusCode(), string(uploadResp.Body()))
	}

	var uploadResult []map[string]interface{}
	if err := json.Unmarshal(uploadResp.Body(), &uploadResult); err != nil {
		return 0, fmt.Errorf("error decoding upload response: %v", err)
	}

	if len(uploadResult) == 0 {
		return 0, fmt.Errorf("empty upload response")
	}

	avatarId, ok := uploadResult[0]["id"].(float64)
	if !ok {
		return 0, fmt.Errorf("avatar ID not found in response")
	}

	return avatarId, nil
}
