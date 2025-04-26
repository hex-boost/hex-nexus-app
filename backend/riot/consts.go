package riot

import "github.com/hex-boost/hex-nexus-app/backend/types"

func getAuthorizationRequestPayload() types.AuthorizationRequest {
	return types.AuthorizationRequest{
		ClientID:      "riot-client",
		RedirectURI:   "http://localhost/redirect",
		ResponseType:  "token id_token",
		Scope:         "openid link ban lol_region account",
		AcrValues:     "",
		Claims:        "",
		CodeChallenge: "",
		RiotPatchline: nil,
	}
}

func getRiotIdentityStartPayload() types.RiotIdentityStartPayload {
	return types.RiotIdentityStartPayload{
		Apple:        nil,
		Campaign:     nil,
		ClientId:     "riot-client",
		Code:         nil,
		Facebook:     nil,
		Gamecenter:   nil,
		Google:       nil,
		Language:     "pt_BR",
		MockDeviceId: nil,
		MockPlatform: nil,
		Multifactor:  nil,
		Nintendo:     nil,
		Platform:     "windows",
		Playstation:  nil,
		Qrcode:       nil,
		Remember:     false,
		RiotIdentity: struct {
			Captcha  interface{} `json:"captcha"`
			Password interface{} `json:"password"`
			State    string      `json:"state"`
			Username interface{} `json:"username"`
		}{
			Captcha:  nil,
			Password: nil,
			State:    "auth",
			Username: nil,
		},
		RiotIdentitySignup: nil,
		Rso:                nil,
		SdkVersion:         "25.2.0.5047",
		Type:               "auth",
		Xbox:               nil,
	}
}
