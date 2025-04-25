package auth

import (
	"github.com/hex-boost/hex-nexus-app/backend/utils"
)

type AuthType string

const (
	LocalAuth AuthType = "local"
	WebAuth   AuthType = "web"
)

// NewAuthenticator creates the appropriate authenticator based on type
func NewAuthenticator(authType AuthType, logger *utils.Logger, captcha *riot.Captcha) Authenticator {
	switch authType {
	case WebAuth:
		return NewWebAuthenticator(logger, captcha)
	default:
		return NewLocalAuthenticator(logger, captcha)
	}
}
