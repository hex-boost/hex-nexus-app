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
		rc.logger.Debug("Riot client not found")
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
			continue
		}
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

func (rc *RiotClient) waitForReadyState(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	interval := 200 * time.Millisecond

	rc.logger.Info("Verificando disponibilidade do serviço de autenticação", zap.Duration("timeout", timeout))

	for time.Now().Before(deadline) {
		resp, err := rc.client.R().Get("/rso-auth/configuration/v3/ready-state")

		if err == nil && resp.StatusCode() == 200 {
			rc.logger.Info("Serviço de autenticação está pronto")
			return nil
		}

		status := "erro"
		if err != nil {
			status = err.Error()
		} else {
			status = fmt.Sprintf("status %d", resp.StatusCode())
		}
		rc.logger.Debug("Aguardando serviço ficar pronto", zap.String("status", status))

		time.Sleep(interval)
	}

	return errors.New("timeout ao aguardar serviço de autenticação ficar pronto")
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
