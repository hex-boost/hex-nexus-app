package sysquery

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
)

// SysQuery provides system information querying capabilities using PowerShell commands
type SysQuery struct {
	cmd *command.Command
}

// New creates a new SysQuery instance
func New() *SysQuery {
	return &SysQuery{
		cmd: command.New(),
	}
}

// GetProcessCommandLineByName retrieves command line by process name
func (s *SysQuery) GetProcessCommandLineByName(processName string) ([]byte, error) {
	// Escape single quotes in process name for PowerShell
	escapedName := strings.Replace(processName, "'", "''", -1)
	powershellCmd := fmt.Sprintf("Get-CimInstance Win32_Process -Filter \"name = '%s'\" | Select-Object -ExpandProperty CommandLine", escapedName)
	return s.cmd.Execute("powershell", "-Command", powershellCmd)
}

// GetProcessCommandLineByPID retrieves command line by process ID
func (s *SysQuery) GetProcessCommandLineByPID(pid uint32) (string, error) {
	powershellCmd := fmt.Sprintf("Get-CimInstance Win32_Process -Filter \"ProcessId = %d\" | Select-Object -ExpandProperty CommandLine", pid)
	output, err := s.cmd.Execute("powershell", "-Command", powershellCmd)
	if err != nil {
		return "", fmt.Errorf("failed to get command line for PID %d: %w", pid, err)
	}

	// Format output to maintain compatibility with existing code
	cmdLine := string(bytes.TrimSpace(output))
	if cmdLine == "" {
		return "", fmt.Errorf("no command line found for PID %d", pid)
	}

	return fmt.Sprintf("CommandLine=%s", cmdLine), nil
}

// GetHardwareUUID gets system UUID
func (s *SysQuery) GetHardwareUUID() ([]byte, error) {
	powershellCmd := "(Get-CimInstance Win32_ComputerSystemProduct).UUID"
	output, err := s.cmd.Execute("powershell", "-Command", powershellCmd)
	if err != nil {
		return nil, err
	}

	// Format output for compatibility with existing code
	uuid := strings.TrimSpace(string(output))
	result := fmt.Sprintf("UUID\n%s", uuid)

	return []byte(result), nil
}

// GetProcessDetails gets detailed information about a process by PID
func (s *SysQuery) GetProcessDetails(pid uint32) (map[string]interface{}, error) {
	powershellCmd := fmt.Sprintf(`
		$process = Get-CimInstance Win32_Process -Filter "ProcessId = %d"
		$processInfo = @{
			"PID" = $process.ProcessId;
			"Name" = $process.Name;
			"CommandLine" = $process.CommandLine;
			"Path" = $process.ExecutablePath;
			"MemoryUsage" = $process.WorkingSetSize;
			"ParentPID" = $process.ParentProcessId;
			"ThreadCount" = $process.ThreadCount;
		}
		ConvertTo-Json -InputObject $processInfo
	`, pid)

	output, err := s.cmd.Execute("powershell", "-Command", powershellCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to get process details for PID %d: %w", pid, err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(output, &result); err != nil {
		return nil, fmt.Errorf("failed to parse process details: %w", err)
	}

	return result, nil
}

// ExecuteQuery provides a generic interface for advanced system queries
func (s *SysQuery) ExecuteQuery(queryType string, args ...string) ([]byte, error) {
	// Convert legacy wmic syntax to PowerShell CIM syntax
	if len(args) < 1 {
		return nil, fmt.Errorf("insufficient query arguments")
	}

	// Map common query patterns to PowerShell
	switch queryType {
	case "process":
		return s.handleProcessQuery(args)
	case "path":
		return s.handlePathQuery(args)
	case "csproduct":
		return s.GetHardwareUUID()
	default:
		// Fallback to a generic approach for unmapped queries
		cmd := fmt.Sprintf("Get-CimInstance %s %s", queryType, strings.Join(args, " "))
		return s.cmd.Execute("powershell", "-Command", cmd)
	}
}

// Helper method to handle process queries
func (s *SysQuery) handleProcessQuery(args []string) ([]byte, error) {
	filter := ""
	properties := ""

	for i, arg := range args {
		if arg == "where" && i+1 < len(args) {
			// Convert where clause to -Filter
			filter = args[i+1]
		} else if arg == "get" && i+1 < len(args) {
			// Get properties to select
			properties = args[i+1]
		}
	}

	cmd := fmt.Sprintf("Get-CimInstance Win32_Process")
	if filter != "" {
		// Convert WMIC style filter to PowerShell filter syntax
		filter = strings.Replace(filter, "'", "\"", -1)
		cmd = fmt.Sprintf("%s -Filter %s", cmd, filter)
	}
	if properties != "" {
		cmd = fmt.Sprintf("%s | Select-Object -ExpandProperty %s", cmd, properties)
	}

	return s.cmd.Execute("powershell", "-Command", cmd)
}

// Helper method to handle path queries
func (s *SysQuery) handlePathQuery(args []string) ([]byte, error) {
	class := ""
	filter := ""
	properties := ""
	format := ""

	for i, arg := range args {
		if i == 0 {
			// First arg is the WMI class
			class = arg
		} else if arg == "where" && i+1 < len(args) {
			filter = args[i+1]
		} else if arg == "get" && i+1 < len(args) {
			properties = args[i+1]
		} else if strings.HasPrefix(arg, "/format:") {
			format = strings.TrimPrefix(arg, "/format:")
		}
	}

	cmd := fmt.Sprintf("Get-CimInstance %s", class)
	if filter != "" {
		filter = strings.Replace(filter, "'", "\"", -1)
		cmd = fmt.Sprintf("%s -Filter %s", cmd, filter)
	}

	if properties != "" {
		if format == "list" {
			// Emulate list format
			cmd = fmt.Sprintf("%s | ForEach-Object { \"%s=\" + $_.\"%s\" }", cmd, properties, properties)
		} else {
			cmd = fmt.Sprintf("%s | Select-Object -ExpandProperty %s", cmd, properties)
		}
	}

	return s.cmd.Execute("powershell", "-Command", cmd)
}

// ListProcessesByName finds all processes with a given name and returns their PIDs
func (s *SysQuery) ListProcessesByName(name string) ([]uint32, error) {
	escapedName := strings.Replace(name, "'", "''", -1)
	powershellCmd := fmt.Sprintf(`
		Get-CimInstance Win32_Process -Filter "name = '%s'" | 
		Select-Object -ExpandProperty ProcessId
	`, escapedName)

	output, err := s.cmd.Execute("powershell", "-Command", powershellCmd)
	if err != nil {
		return nil, err
	}

	// Parse the output to get PIDs
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	var pids []uint32

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		var pid uint32
		if _, err := fmt.Sscanf(line, "%d", &pid); err == nil {
			pids = append(pids, pid)
		}
	}

	return pids, nil
}
