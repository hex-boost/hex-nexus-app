package client

import (
	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
)

type BaseClient struct {
	Client *resty.Client
	Logger *logger.Logger
	JWT    string
}

// NewBaseClient creates a new base HTTP client
func NewBaseClient(logger *logger.Logger, config *config.Config) *BaseClient {
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
