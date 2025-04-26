//go:build windows
// +build windows

package command

import (
	"os/exec"
	"syscall"
)

func (c *Command) hideConsole(cmd *exec.Cmd) *exec.Cmd {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	cmd.SysProcAttr.CreationFlags = 0x08000000 // CREATE_NO_WINDOW
	return cmd
}
