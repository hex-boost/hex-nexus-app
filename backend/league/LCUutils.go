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

func (l *LCUutils) DecodeRiotJWT(token string, result interface{}) error {
	if token == "" {
		return errors.New("invalid token format")
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return errors.New("invalid JWT format")
	}

	padding := strings.Repeat("=", (4-len(parts[1])%4)%4)
	payload, err := base64.URLEncoding.DecodeString(parts[1] + padding)
	if err != nil {
		return fmt.Errorf("failed to decode payload: %w", err)
	}

	// Directly unmarshal into the provided result interface
	if err := json.Unmarshal(payload, result); err != nil {
		return fmt.Errorf("failed to parse token content: %w", err)
	}

	return nil
}
