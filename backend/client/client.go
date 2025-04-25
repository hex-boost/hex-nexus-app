package client

import (
	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
)

type BaseClient struct {
	Client *resty.Client
	Logger *utils.Logger
	JWT    string
}

// NewBaseClient creates a new base HTTP client
func NewBaseClient(logger *utils.Logger, config *config.Config) *BaseClient {
	client := resty.New()
	client.SetBaseURL(config.BackendURL)
	client.SetHeader("Content-Type", "application/json")
	client.SetHeader("Accept", "application/json")
	return &BaseClient{
		Client: client,
		Logger: logger,
		JWT:    "",
	}
}

// SetJWT updates the JWT token for authentication
func (b *BaseClient) SetJWT(jwt string) {
	b.JWT = jwt
	b.Client.SetHeader("Authorization", "Bearer "+jwt)
}

func (b *BaseClient) ClearJWT() {
	b.JWT = ""
	b.Client.Header.Del("Authorization")
}
