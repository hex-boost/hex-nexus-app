//go:build !windows
// +build !windows

package updaterUtils

func (u *UpdaterUtils) CheckWebView2Installation() bool {
	return false
}
