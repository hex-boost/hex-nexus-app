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

func findWindow(className, windowName string) uintptr {
	var classNamePtr, windowNamePtr *uint16
	if className != "" {
		classNamePtr = syscall.StringToUTF16Ptr(className)
	}
	if windowName != "" {
		windowNamePtr = syscall.StringToUTF16Ptr(windowName)
	}
	ret, _, _ := procFindWindowW.Call(
		uintptr(unsafe.Pointer(classNamePtr)),
		uintptr(unsafe.Pointer(windowNamePtr)),
	)
	return ret
}
