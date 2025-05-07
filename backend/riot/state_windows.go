//go:build windows
// +build windows

package riot

import (
	"syscall"
	"unsafe"
)

var (
	user32          = syscall.NewLazyDLL("user32.dll")
	procFindWindowW = user32.NewProc("FindWindowW")
)

func findWindow(windowName string) uintptr {
	var windowNamePtr *uint16
	if windowName != "" {
		windowNamePtr, _ = syscall.UTF16PtrFromString(windowName)
	}
	ret, _, _ := procFindWindowW.Call(
		0,                                      // NULL for class name (first parameter)
		uintptr(unsafe.Pointer(windowNamePtr)), // Window title (second parameter)
	)
	return ret
}
