package command

import (
	"os/exec"
)

type Command struct{}

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

func (c *Command) Run(command string, arg ...string) error {
	cmd := exec.Command(command, arg...)
	cmd = c.hideConsole(cmd)
	return cmd.Run()
}
