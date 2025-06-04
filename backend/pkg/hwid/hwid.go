package hwid

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/sysquery"
)

type HWID struct {
	command  *command.Command
	sysquery *sysquery.SysQuery
}

func New() *HWID {
	return &HWID{
		command:  command.New(),
		sysquery: sysquery.New(),
	}
}

func (u *HWID) Get() (string, error) {
	motherboardUUIDCmd := `(Get-CimInstance Win32_ComputerSystemProduct).UUID`

	diskSerialCmd := `$diskSerial = (Get-CimInstance Win32_DiskDrive | Where-Object {$_.SerialNumber -ne $null -and $_.SerialNumber.Trim() -ne ''} | Select-Object -First 1).SerialNumber; if ($diskSerial) { $diskSerial.Trim() } else { "" }`

	motherboardUUIDOutput, err := u.command.Execute("powershell.exe", "-NoProfile", "-Command", motherboardUUIDCmd)
	if err != nil {
		fmt.Println("Error getting Motherboard UUID:", err)
	}
	motherboardUUID := strings.TrimSpace(string(motherboardUUIDOutput))

	diskSerialOutput, err := u.command.Execute("powershell.exe", "-NoProfile", "-Command", diskSerialCmd)
	if err != nil {
		fmt.Println("Error getting Disk Serial Number:", err)
	}
	diskSerial := strings.TrimSpace(string(diskSerialOutput))

	combinedOutput := motherboardUUID + diskSerial

	if combinedOutput == "" {
		return "", fmt.Errorf("failed to retrieve any hardware identifiers (Motherboard UUID or Disk Serial)")
	}

	hasher := sha256.New()
	hasher.Write([]byte(combinedOutput))
	hash := hex.EncodeToString(hasher.Sum(nil))
	return hash, nil
}
