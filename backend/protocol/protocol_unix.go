//go:build !windows
// +build !windows

package protocol

func IsRunningAsAdmin() (bool, error) {
	return true, nil
}

func (p *Protocol) Register() error {
	return nil
}
