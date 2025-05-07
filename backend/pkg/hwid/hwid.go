package hwid

import (
	"crypto/sha256"
	"encoding/hex"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/sysquery"
)

type HWID struct {
	command  *command.Command
	sysquery *sysquery.SysQuery
}

func New() *HWID {
	return &HWID{
		command:  command.New(),
		sysquery: sysquery.New(),
	}
}

func (u *HWID) Get() (string, error) {
	output, err := u.sysquery.GetHardwareUUID()
	if err != nil {
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
