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

func (c *Command) Start(command string, arg ...string) (*exec.Cmd, error) {
	cmd := exec.Command(command, arg...)
	cmd = c.hideConsole(cmd)
	return cmd, cmd.Start()
}
func (c *Command) Execute(command string, arg ...string) ([]byte, error) {
	cmd := exec.Command(command, arg...)
	cmd = c.hideConsole(cmd)
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	return output, nil
}

func (c *Command) hideConsole(cmd *exec.Cmd) *exec.Cmd {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	cmd.SysProcAttr.CreationFlags = 0x08000000
	return cmd
}
func (c *Command) Run(command string, arg ...string) error {
	cmd := exec.Command(command, arg...)
	cmd = c.hideConsole(cmd)
	return cmd.Run()
}
