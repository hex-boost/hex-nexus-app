package riot

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"go.uber.org/zap"
	"syscall"
	"time"
	"unsafe"
)

var (
	user32          = syscall.NewLazyDLL("user32.dll")
	procFindWindowW = user32.NewProc("FindWindowW")
)

// findWindow finds a window by class name and window name
func findWindow(className, windowName string) uintptr {
	var classNamePtr, windowNamePtr *uint16
	if className != "" {
		classNamePtr = syscall.StringToUTF16Ptr(className)
	}
	if windowName != "" {
		windowNamePtr = syscall.StringToUTF16Ptr(windowName)
	}
	ret, _, _ := procFindWindowW.Call(
		uintptr(unsafe.Pointer(classNamePtr)),
		uintptr(unsafe.Pointer(windowNamePtr)),
	)
	return ret
}
func (s *Service) IsRunning() bool {
	hwnd := findWindow("", "Riot Client")
	if hwnd != 0 {
		return true
	}

	return false
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
