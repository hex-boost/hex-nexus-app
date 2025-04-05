package repository

import (
	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
)

// BaseRepository provides a common client for all repositories
type BaseRepository struct {
	Client *resty.Client
	Logger *utils.Logger
	JWT    string
}

// NewBaseRepository creates a new base repository with shared client
func NewBaseRepository(config *config.Config, logger *utils.Logger) *BaseRepository {
	client := resty.New()
	client.SetBaseURL(config.BackendURL)
	client.SetHeader("Content-Type", "application/json")
	client.SetHeader("Accept", "application/json")
	return &BaseRepository{
		Client: client,
		Logger: logger,
		JWT:    "",
	}
}

// SetJWT updates the JWT token for authentication
func (b *BaseRepository) SetJWT(jwt string) {
	b.JWT = jwt
	b.Client.SetHeader("Authorization", "Bearer "+jwt)
}

func (b *BaseRepository) ClearJWT() {
	b.JWT = ""
	b.Client.Header.Del("Authorization") // Remove the Authorization header completely
}
