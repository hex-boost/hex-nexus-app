package riot

import (
	"errors"
	"fmt"
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
func (rc *RiotClient) IsAuthenticationReady() bool {
	// Verifica se o cliente está pronto para autenticação
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
		rc.logger.Info("Riot client is running and ready",
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

		// Registra o status da tentativa
		status := "erro"
		if err != nil {
			status = err.Error()
		} else {
			status = fmt.Sprintf("status %d", resp.StatusCode())
		}
		rc.logger.Debug("Aguardando serviço ficar pronto", zap.String("status", status))

		// Aguarda antes da próxima tentativa
		time.Sleep(interval)
	}

	return errors.New("timeout ao aguardar serviço de autenticação ficar pronto")
}
