package auth

import (
	"context"
	"github.com/hex-boost/hex-nexus-app/backend/types"
)

type Authenticator interface {
	LoginWithCaptcha(ctx context.Context, username, password, captchaToken string) (string, error)
	GetAuthenticationState() (*types.RiotIdentityResponse, error)
	IsAuthStateValid() error
	Logout() error

	// Captcha related methods
	SetupCaptchaVerification() error

	IsClientInitialized() bool
	InitializeClient() error
}
