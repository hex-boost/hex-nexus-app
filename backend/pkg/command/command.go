package command

import (
	"os/exec"
	"syscall"
)

type Command struct {
}

func New() *Command {
	return &Command{}
}

func (c *Command) Execute(command string) ([]byte, error) {
	cmd := exec.Command(command)
	cmd = c.hideConsole(cmd)
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	return output, nil
}

func (u *Command) hideConsole(cmd *exec.Cmd) *exec.Cmd {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	cmd.SysProcAttr.CreationFlags = 0x08000000
	return cmd
}
