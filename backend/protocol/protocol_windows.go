//go:build windows
// +build windows

package protocol

import (
	"fmt"
	"os"

	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

func IsRunningAsAdmin() (bool, error) {
	var sid *windows.SID
	err := windows.AllocateAndInitializeSid(
		&windows.SECURITY_NT_AUTHORITY,
		2,
		windows.SECURITY_BUILTIN_DOMAIN_RID,
		windows.DOMAIN_ALIAS_RID_ADMINS,
		0, 0, 0, 0, 0, 0,
		&sid)
	if err != nil {
		return false, err
	}
	defer windows.FreeSid(sid)

	token := windows.Token(0)
	member, err := token.IsMember(sid)
	if err != nil {
		return false, err
	}

	return member, nil
}

func (p *Protocol) Register() error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	// Register the protocol handler
	k, _, err := registry.CreateKey(registry.CURRENT_USER, `Software\Classes\nexus`, registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer k.Close()

	if err := k.SetStringValue("", "URL:Nexus Protocol"); err != nil {
		return err
	}
	if err := k.SetStringValue("URL Protocol", ""); err != nil {
		return err
	}

	// Add additional security keys for browsers
	// Create a DefaultIcon entry
	iconKey, _, err := registry.CreateKey(k, "DefaultIcon", registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer iconKey.Close()
	if err := iconKey.SetStringValue("", fmt.Sprintf("%s,1", exePath)); err != nil {
		return err
	}

	// Create the command to execute
	shellKey, _, err := registry.CreateKey(k, "shell", registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer shellKey.Close()

	openKey, _, err := registry.CreateKey(shellKey, "open", registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer openKey.Close()

	cmdKey, _, err := registry.CreateKey(openKey, "command", registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer cmdKey.Close()

	// Use a more explicit command format for browsers
	return cmdKey.SetStringValue("", fmt.Sprintf("\"%s\" \"%%1\"", exePath))
}
