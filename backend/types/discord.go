package types

import "encoding/json"

type DiscordUser struct {
	ID                   string          `json:"id"`
	Username             string          `json:"username"`
	Discriminator        string          `json:"discriminator"`
	GlobalName           *string         `json:"global_name,omitempty"`
	Avatar               string          `json:"avatar,omitempty"`
	Bot                  *bool           `json:"bot,omitempty"`
	System               *bool           `json:"system,omitempty"`
	MfaEnabled           *bool           `json:"mfa_enabled,omitempty"`
	Banner               *string         `json:"banner,omitempty"`
	AccentColor          *int            `json:"accent_color,omitempty"`
	Locale               *string         `json:"locale,omitempty"`
	Verified             *bool           `json:"verified,omitempty"`
	Email                *string         `json:"email,omitempty"`
	Flags                *int            `json:"flags,omitempty"`
	PremiumType          *int            `json:"premium_type,omitempty"`
	PublicFlags          *int            `json:"public_flags,omitempty"`
	AvatarDecorationData json.RawMessage `json:"avatar_decoration_data,omitempty"`
}
