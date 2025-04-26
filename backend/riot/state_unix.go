//go:build !windows
// +build !windows

package riot

func findWindow(className, windowName string) uintptr {
	return 0
}
