package league

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

type LCUutils struct {
}
type DecodedData struct {
	Header  interface{}            `json:"header"`
	Payload map[string]interface{} `json:"payload"`
}

func (l *LCUutils) DecodeRiotJWT(token string) (*DecodedData, error) {
	if token == "" {
		return nil, errors.New("invalid token format")
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid JWT format")
	}

	// Decode payload
	padding := strings.Repeat("=", (4-len(parts[1])%4)%4)
	payload, err := base64.URLEncoding.DecodeString(parts[1] + padding)
	if err != nil {
		return nil, fmt.Errorf("failed to decode payload: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(payload, &result); err != nil {
		return nil, fmt.Errorf("failed to parse token content: %w", err)
	}

	items, ok := result["items"].(map[string]interface{})
	if !ok {
		return nil, errors.New("invalid token structure")
	}

	return &DecodedData{
		Header:  nil,
		Payload: items,
	}, nil
}
