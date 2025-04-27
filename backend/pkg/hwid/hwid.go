package hwid

import (
	"crypto/sha256"
	"encoding/hex"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
)

type HWID struct {
	command *command.Command
}

func New() *HWID {
	return &HWID{
		command: command.New(),
	}
}

func (u *HWID) Get() (string, error) {
	// Execute the command using command.Command
	output, err := u.command.Execute("cmd.exe", "/c", "wmic csproduct get uuid")
	if err != nil {
		// Handle error - return empty string or some default value
		return "", err
	}

	// Convert output bytes to string
	out := string(output)

	// Hash the output
	hasher := sha256.New()
	hasher.Write([]byte(out))
	hash := hex.EncodeToString(hasher.Sum(nil))
	return hash, nil
}
