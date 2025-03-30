package utils

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"github.com/pkg/browser"
	"os"
	"os/exec"
)

type Utils struct {
}

func NewUtils() *Utils {
	return &Utils{}
}

func (h *Utils) GetHWID() string {
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

func (h *Utils) GetBackendUrl() string {
	return os.Getenv("BACKEND_URL")
}
func (h *Utils) OpenBrowser(url string) error {
	return browser.OpenURL(url)
}
