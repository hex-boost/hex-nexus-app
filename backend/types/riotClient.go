package types

type RiotIdentityStartPayload struct {
	Apple        interface{} `json:"apple"`
	Campaign     interface{} `json:"campaign"`
	ClientId     string      `json:"clientId"`
	Code         interface{} `json:"code"`
	Facebook     interface{} `json:"facebook"`
	Gamecenter   interface{} `json:"gamecenter"`
	Google       interface{} `json:"google"`
	Language     string      `json:"language"`
	MockDeviceId interface{} `json:"mockDeviceId"`
	MockPlatform interface{} `json:"mockPlatform"`
	Multifactor  interface{} `json:"multifactor"`
	Nintendo     interface{} `json:"nintendo"`
	Platform     string      `json:"platform"`
	Playstation  interface{} `json:"playstation"`
	Qrcode       interface{} `json:"qrcode"`
	Remember     bool        `json:"remember"`
	RiotIdentity struct {
		Captcha  interface{} `json:"captcha"`
		Password interface{} `json:"password"`
		State    string      `json:"state"`
		Username interface{} `json:"username"`
	} `json:"riot_identity"`
	RiotIdentitySignup interface{} `json:"riot_identity_signup"`
	Rso                interface{} `json:"rso"`
	SdkVersion         string      `json:"sdkVersion"`
	Type               string      `json:"type"`
	Xbox               interface{} `json:"xbox"`
}
type ErrorResponse struct {
	ErrorCode             string                 `json:"errorCode"`
	HTTPStatus            int                    `json:"httpStatus"`
	ImplementationDetails map[string]interface{} `json:"implementationDetails"`
	Message               string                 `json:"message"`
}
type RiotIdentity struct {
	Captcha  string      `json:"captcha"`
	Password string      `json:"password"`
	State    interface{} `json:"state"`
	Username string      `json:"username"`
}
type LoginTokenResponse struct {
	Type string `json:"type"`
	
}
type LoginTokenRequest struct {
	AuthenticationType string `json:"authentication_type"`
	CodeVerifier       string `json:"code_verifier"`
	LoginToken         string `json:"login_token"`
	PersistLogin       bool   `json:"persist_login"`
}
type AuthorizationRequest struct {
	AcrValues           string  `json:"acr_values"`
	Claims              string  `json:"claims"`
	ClientID            string  `json:"client_id"`
	CodeChallenge       string  `json:"code_challenge"`
	CodeChallengeMethod string  `json:"code_challenge_method"`
	RedirectURI         string  `json:"redirect_uri"`
	ResponseType        string  `json:"response_type"`
	RiotPatchline       *string `json:"riot_patchline"`
	Scope               string  `json:"scope"`
}
type Authentication struct {
	Campaign     interface{}  `json:"campaign"`
	Language     string       `json:"language"`
	Remember     bool         `json:"remember"`
	RiotIdentity RiotIdentity `json:"riot_identity"`
	Type         string       `json:"type"`
}
type RiotIdentityResponse struct {
	Auth struct {
		AuthMethod string `json:"auth_method"`
	} `json:"auth"`
	Captcha struct {
		Hcaptcha struct {
			Data string `json:"data"`
			Key  string `json:"key"`
		} `json:"hcaptcha"`
		Type string `json:"type"`
	} `json:"captcha"`
	Cluster  string `json:"cluster"`
	Country  string `json:"country"`
	Error    string `json:"error"`
	Gamepass struct {
		Delay     int    `json:"delay"`
		Remaining int    `json:"remaining"`
		Status    string `json:"status"`
	} `json:"gamepass"`
	Healup struct {
		AuthMethod          string        `json:"auth_method"`
		RequiredFields      []interface{} `json:"required_fields"`
		RequiredFieldsHints interface{}   `json:"required_fields_hints"`
	} `json:"healup"`
	KrIdVerification struct {
		RedirectUrl string `json:"redirect_url"`
	} `json:"kr-id-verification"`
	Multifactor struct {
		AuthMethod string        `json:"auth_method"`
		Email      string        `json:"email"`
		KnownValue interface{}   `json:"known_value"`
		Method     string        `json:"method"`
		Methods    []interface{} `json:"methods"`
		Mode       string        `json:"mode"`
	} `json:"multifactor"`
	Signup struct {
		AuthMethod string `json:"auth_method"`
		Link       struct {
			AuthMethod      string        `json:"auth_method"`
			CodeLinking     interface{}   `json:"code_linking"`
			Options         []interface{} `json:"options"`
			PreviousLinking interface{}   `json:"previous_linking"`
			Suggested       []interface{} `json:"suggested"`
		} `json:"link"`
		RequiredFields      []interface{} `json:"required_fields"`
		RequiredFieldsHints interface{}   `json:"required_fields_hints"`
	} `json:"signup"`
	Success struct {
		AuthMethod           string `json:"auth_method"`
		IsConsoleLinkSession bool   `json:"is_console_link_session"`
		Linked               string `json:"linked"`
		LoginToken           string `json:"login_token"`
		Puuid                string `json:"puuid"`
		RedirectUrl          string `json:"redirect_url"`
	} `json:"success"`
	Suuid             string `json:"suuid"`
	Timestamp         string `json:"timestamp"`
	Type              string `json:"type"`
	ValidationCaptcha struct {
		Hcaptcha interface{} `json:"hcaptcha"`
		Type     string      `json:"type"`
	} `json:"validation_captcha"`
}
