package auth

import (
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/riot"
	"github.com/hex-boost/hex-nexus-app/backend/riot/captcha"
)

type AuthType string

const (
	LocalAuth AuthType = "local"
	WebAuth   AuthType = "web"
)

// NewAuthenticator creates the appropriate authenticator based on type
func NewAuthenticator(authType AuthType, logger *logger.Logger, captcha *captcha.Captcha) Authenticator {
	switch authType {
	//case WebAuth:
	//	return NewWebAuthenticator(logger, captcha)
	default:
		return riot.NewService(logger, captcha)
	}
}
