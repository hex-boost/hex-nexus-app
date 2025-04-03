package cmdUtils

import (
	"os/exec"
	"syscall"
)

func HideConsoleWindow(cmd *exec.Cmd) *exec.Cmd {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	cmd.SysProcAttr.CreationFlags = 0x08000000 
	return cmd
}
