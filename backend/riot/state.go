package riot

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"golang.org/x/sys/windows"
	"os/exec"
	"regexp"
	"strings"
	"syscall"
	"time"
	"unsafe"

	"go.uber.org/zap"

	"github.com/hex-boost/hex-nexus-app/backend/types"
)

const (
	targetProcessName = "riot client.exe" // Lowercase for case-insensitive comparison
)

type ProcessCredentials struct {
	PID       uint32
	Port      string
	AuthToken string // This will be the Base64 encoded "riot:<token>" string
}

// FindRiotClientWithCredentials scans running processes to find the Riot Client
func getProcessCommandLine(pid uint32) (string, error) {
	// Use wmic to get the command line for the specific process ID
	// Using "path" instead of "process" and "CommandLine" property can sometimes be more reliable or require fewer privileges
	// cmd := exec.Command("wmic", "process", "where", fmt.Sprintf("ProcessId=%d", pid), "get", "CommandLine", "/format:list")

	commander := command.New()
	cmd := commander.Exec("wmic", "path", "win32_process", "where", fmt.Sprintf("ProcessId=%d", pid), "get", "CommandLine", "/format:list")

	output, err := cmd.Output() // Use Output instead of Execute for simplicity here
	if err != nil {
		// Handle cases where the process might have exited between listing and querying
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			return "", fmt.Errorf("wmic failed for PID %d (process likely exited or access denied): %v, stderr: %s", pid, exitErr, string(exitErr.Stderr))
		}
		return "", fmt.Errorf("failed to execute wmic for PID %d: %w", pid, err)
	}

	cmdLine := string(output)
	// Parse the "CommandLine=..." output format from wmic /format:list
	parts := strings.SplitN(cmdLine, "=", 2)
	if len(parts) < 2 {
		// It's possible wmic returns empty output if command line is inaccessible or empty
		return "", fmt.Errorf("unexpected wmic output format for PID %d: %q", pid, cmdLine)
	}
	// Trim whitespace (like carriage returns/newlines from wmic)
	return strings.TrimSpace(parts[1]), nil
}
func FindRiotClientWithCredentials() (*ProcessCredentials, error) {
	// Pre-compile regexes for efficiency
	portRegex := regexp.MustCompile(`--app-port=(\d+)`)
	authRegex := regexp.MustCompile(`--remoting-auth-token=([\w-]+)`)

	// Get a snapshot of all running processes
	snapshot, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to create process snapshot: %w", err)
	}
	// Ensure the snapshot handle is closed eventually
	defer windows.CloseHandle(snapshot)

	var pe32 windows.ProcessEntry32
	pe32.Size = uint32(unsafe.Sizeof(pe32))

	// Iterate through the processes
	if err := windows.Process32First(snapshot, &pe32); err != nil {
		// Check for ERROR_NO_MORE_FILES specifically, although it shouldn't happen on First call
		if err == syscall.ERROR_NO_MORE_FILES {
			return nil, fmt.Errorf("no processes found")
		}
		return nil, fmt.Errorf("failed to get first process: %w", err)
	}

	for {
		// Extract process name
		procName := windows.UTF16ToString(pe32.ExeFile[:])
		procNameLower := strings.ToLower(procName)

		// Check if it's the target process
		if procNameLower == targetProcessName {
			// Found a potential candidate, now get its command line
			cmdLine, err := getProcessCommandLine(pe32.ProcessID)
			if err != nil {
				// Log the error but continue searching, as this might be a zombie process
				// or one we don't have permission for, or it exited quickly.
				fmt.Printf("Skipping PID %d (%s): failed to get command line: %v\n", pe32.ProcessID, procName, err)
				// Continue to the next process
				if err := windows.Process32Next(snapshot, &pe32); err != nil {
					if err == syscall.ERROR_NO_MORE_FILES {
						break // End of list
					}
					return nil, fmt.Errorf("failed to get next process after error: %w", err)
				}
				continue // Skip to the next iteration
			}

			// Check if the command line contains the required arguments
			portMatch := portRegex.FindStringSubmatch(cmdLine)
			authMatch := authRegex.FindStringSubmatch(cmdLine)

			// We need both matches to succeed
			if len(portMatch) > 1 && len(authMatch) > 1 {
				// Found the correct process!
				port := portMatch[1]
				token := authMatch[1]
				// Encode the auth token as required (e.g., for HTTP Basic Auth)
				authHeader := base64.StdEncoding.EncodeToString([]byte("riot:" + token))

				return &ProcessCredentials{
					PID:       pe32.ProcessID,
					Port:      port,
					AuthToken: authHeader, // Store the encoded header
				}, nil
			}
			// If it's Riot Client.exe but doesn't have the args, keep searching
		}

		// Move to the next process
		if err := windows.Process32Next(snapshot, &pe32); err != nil {
			// Check if we've reached the end of the list
			if err == syscall.ERROR_NO_MORE_FILES {
				break // Normal loop termination
			}
			// An unexpected error occurred
			return nil, fmt.Errorf("failed to get next process: %w", err)
		}
	}

	// If the loop finishes without finding the process
	return nil, fmt.Errorf("'%s' process with --app-port and --remoting-auth-token not found", targetProcessName)
}

func (s *Service) IsRunning() bool {
	hwnd := findWindow("Riot Client")
	if hwnd != 0 {
		return true
	}
	credentials, err := FindRiotClientWithCredentials()
	if err != nil {
		return false
	}
	return credentials.PID != 0
}

func (s *Service) WaitUntilIsRunning(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	checkInterval := 500 * time.Millisecond

	s.logger.Info("Aguardando o cliente Riot iniciar", zap.Duration("timeout", timeout))

	for time.Now().Before(deadline) {
		if s.IsRunning() {
			s.logger.Info("Cliente Riot está em execução")
			return nil
		}

		s.logger.Debug("Cliente Riot não encontrado, verificando novamente")
		time.Sleep(checkInterval)
	}

	return fmt.Errorf("timeout ao aguardar o cliente Riot iniciar")
}

func (s *Service) IsAuthenticationReady() bool {
	pid, err := s.getProcess()
	if err != nil {
		return false
	}

	_, _, err = s.getCredentials(pid)
	return err == nil
}

func (s *Service) IsClientInitialized() bool {
	return s.client != nil
}

func (s *Service) GetUserinfo() (*types.UserInfo, error) {
	var rawResponse types.RCUUserinfo
	resp, err := s.client.R().SetResult(&rawResponse).Get("/rso-auth/v1/authorization/userinfo")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, errors.New("erro ao obter informações do usuário")
	}
	var userInfoData types.UserInfo
	if err := json.Unmarshal([]byte(rawResponse.UserInfo), &userInfoData); err != nil {
		s.logger.Debug("Erro ao decodificar dados do usuário", zap.Error(err))
		return nil, fmt.Errorf("erro ao decodificar informações do usuário: %w", err)
	}
	return &userInfoData, nil
}

func (s *Service) WaitUntilUserinfoIsReady(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	interval := 200 * time.Millisecond

	s.logger.Info("Verificando disponibilidade das informações do usuário", zap.Duration("timeout", timeout))

	for time.Now().Before(deadline) {
		_, err := s.GetUserinfo()
		if err != nil {
			time.Sleep(interval)
			continue
		}

		s.logger.Info("Informações do usuário estão prontas")
		return nil
	}

	return errors.New("timeout ao aguardar informações do usuário ficarem prontas")
}
