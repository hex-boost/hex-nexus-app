package riot

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"go.uber.org/zap"
	"time"
)

func (rc *RiotClient) IsRunning() bool {
	_, err := rc.getProcess()
	if err != nil {
		return false
	}

	return true
}

func (rc *RiotClient) WaitUntilIsRunning(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	checkInterval := 500 * time.Millisecond

	rc.logger.Info("Aguardando o cliente Riot iniciar", zap.Duration("timeout", timeout))

	for time.Now().Before(deadline) {
		if rc.IsRunning() {
			rc.logger.Info("Cliente Riot está em execução")
			return nil
		}

		rc.logger.Debug("Cliente Riot não encontrado, verificando novamente")
		time.Sleep(checkInterval)
	}

	return fmt.Errorf("timeout ao aguardar o cliente Riot iniciar")
}
func (rc *RiotClient) IsAuthenticationReady() bool {

	pid, err := rc.getProcess()
	if err != nil {
		return false
	}

	_, _, err = rc.getCredentials(pid)
	return err == nil
}
func (rc *RiotClient) WaitUntilAuthenticationIsReady(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	checkInterval := 100 * time.Millisecond

	for time.Now().Before(deadline) {
		pid, err := rc.getProcess()
		if err != nil {
			time.Sleep(checkInterval)
			continue
		}

		port, _, err := rc.getCredentials(pid)

		if err != nil {
			rc.logger.Debug("Riot client process found but not fully initialized")
			continue
		}
		if !rc.IsClientInitialized() {
			rc.logger.Info("Riot client is not initialized")
			_ = rc.InitializeRestyClient()
			rc.logger.Info("Riot client must be initialized now")
			continue
		}

		// Fix: Add proper time unit (e.g., 500 milliseconds)
		time.Sleep(500 * time.Millisecond)

		err = rc.IsAuthStateValid()
		if err != nil {
			rc.logger.Info("Riot client is opened but auth state is invalid")
			continue
		}

		rc.logger.Info("Riot client is opened and auth state is valid")
		rc.logger.Info("Credentials:",
			zap.Int("pid", pid),
			zap.String("port", port))
		return nil
	}

	return errors.New("timeout waiting for Riot client to initialize")
}

func (rc *RiotClient) IsClientInitialized() bool {
	return rc.client != nil
}

func (rc *RiotClient) GetUserinfo() (*types.UserInfo, error) {
	var rawResponse types.RCUUserinfo
	resp, err := rc.client.R().SetResult(&rawResponse).Get("/rso-auth/v1/authorization/userinfo")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		rc.logger.Debug("Erro ao obter informações do usuário", zap.Any("response", resp))
		return nil, errors.New("erro ao obter informações do usuário")
	}
	var userInfoData types.UserInfo
	if err := json.Unmarshal([]byte(rawResponse.UserInfo), &userInfoData); err != nil {
		rc.logger.Debug("Erro ao decodificar dados do usuário", zap.Error(err))
		return nil, fmt.Errorf("erro ao decodificar informações do usuário: %w", err)
	}
	return &userInfoData, nil
}
func (rc *RiotClient) WaitUntilUserinfoIsReady(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	interval := 200 * time.Millisecond

	rc.logger.Info("Verificando disponibilidade das informações do usuário", zap.Duration("timeout", timeout))

	for time.Now().Before(deadline) {
		_, err := rc.GetUserinfo()
		if err != nil {
			time.Sleep(interval)
			continue
		}

		rc.logger.Info("Informações do usuário estão prontas")
		return nil
	}

	return errors.New("timeout ao aguardar informações do usuário ficarem prontas")
}
