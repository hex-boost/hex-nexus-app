package riot

import (
	"errors"
	"fmt"
	"go.uber.org/zap"
	"time"
)

func (c *Client) IsRunning() bool {
	_, err := c.getRiotProcess()
	if err != nil {
		c.logger.Debug("Riot client not found")
		return false
	}

	return true
}
func (c *Client) isAuthenticationReady() bool {
	return true
	//var result
	//c.client.R().Get()

}
func (c *Client) waitForClientReady(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	checkInterval := 100 * time.Millisecond

	for time.Now().Before(deadline) {
		pid, err := c.getRiotProcess()
		if err == nil {
			// Found the process, now try to get credentials to verify it's ready
			port, authToken, err := c.getClientCredentials(pid)
			if err == nil && port != "" && authToken != "" {
				c.logger.Info("Riot client is running and ready",
					zap.Int("pid", pid),
					zap.String("port", port))
				return nil
			}
			// Process exists but not ready yet
			c.logger.Debug("Riot client process found but not fully initialized")
		}
		time.Sleep(checkInterval)
	}

	return errors.New("timeout waiting for Riot client to initialize")
}
func (c *Client) waitForReadyState(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	interval := 200 * time.Millisecond

	c.logger.Info("Verificando disponibilidade do serviço de autenticação", zap.Duration("timeout", timeout))

	for time.Now().Before(deadline) {
		resp, err := c.client.R().Get("/rso-auth/configuration/v3/ready-state")

		if err == nil && resp.StatusCode() == 200 {
			c.logger.Info("Serviço de autenticação está pronto")
			return nil
		}

		// Registra o status da tentativa
		status := "erro"
		if err != nil {
			status = err.Error()
		} else {
			status = fmt.Sprintf("status %d", resp.StatusCode())
		}
		c.logger.Debug("Aguardando serviço ficar pronto", zap.String("status", status))

		// Aguarda antes da próxima tentativa
		time.Sleep(interval)
	}

	return errors.New("timeout ao aguardar serviço de autenticação ficar pronto")
}
