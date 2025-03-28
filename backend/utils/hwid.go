package utils

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"os/exec"
)

type HWID struct {
}

func NewHWID() *HWID {
	return &HWID{}
}
func (h *HWID) GetHWID() string {
	const xx = "cmd.exe"
	var stdout bytes.Buffer
	cmd := exec.Command(xx, "/c", "wmic csproduct get uuid")
	cmd.Stdout = &stdout
	cmd.Run()
	out := stdout.String()
	hasher := sha256.New()
	hasher.Write([]byte(out))
	hash := hex.EncodeToString(hasher.Sum(nil))
	return hash
}
