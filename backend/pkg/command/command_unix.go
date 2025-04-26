//go:build !windows
// +build !windows

package command

import (
	"os/exec"
)

func (c *Command) hideConsole(cmd *exec.Cmd) *exec.Cmd {
	// No-op for non-Windows platforms
	return cmd
}
