package auth

type AuthType string

const (
	LocalAuth AuthType = "local"
	WebAuth   AuthType = "web"
)

// NewAuthenticator creates the appropriate authenticator based on type
//func NewAuthenticator(authType AuthType, logger *logger.Logger, captcha *captcha.Captcha) Authenticator {
//	switch authType {
//	//case WebAuth:
//	//	return NewWebAuthenticator(logger, captcha)
//	default:
//		return riot.NewService(logger, captcha)
//	}
//}
