//go:build windows
// +build windows

package updaterUtils

import "golang.org/x/sys/windows/registry"

func (u *UpdaterUtils) CheckWebView2Installation() bool {
	// Check 64-bit registry first
	key, err := registry.OpenKey(registry.LOCAL_MACHINE, `SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}`, registry.QUERY_VALUE)
	if err == nil {
		key.Close()
		return true
	}

	// Check 32-bit registry if 64-bit check failed
	key, err = registry.OpenKey(registry.LOCAL_MACHINE, `SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}`, registry.QUERY_VALUE)
	if err == nil {
		key.Close()
		return true
	}

	return false
}
