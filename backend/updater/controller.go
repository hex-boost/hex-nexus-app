package updater

import (
	"time"
)

type UpdateController struct {
	updater      *Updater
	apiURL       string
	lastCheck    time.Time
	checkEnabled bool
}

//
//func (c *UpdateController) CheckForUpdates() (*VersionInfo, error) {
//	if !c.checkEnabled {
//		return nil, nil
//	}
//	if time.Since(c.lastCheck) < time.Hour {
//		return nil, nil
//	}
//	c.lastCheck = time.Now()
//	app.App().Log().Wails().Infoln("Verificando atualizações...")
//	versionInfo, err := c.updater.CheckForUpdates()
//	if err != nil {
//		app.App().Log().Wails().Errorf("Erro ao verificar atualizações: %v", err)
//		return nil, err
//	}
//	if versionInfo != nil && versionInfo.Version != c.updater.GetCurrentVersion() {
//		app.App().Log().Wails().Infof("Nova versão disponível: %s (atual: %s)",
//			versionInfo.Version, c.updater.GetCurrentVersion())
//		return versionInfo, nil
//	}
//	app.App().Log().Wails().Infoln("Nenhuma atualização disponível")
//	return nil, nil
//}
//
//func (c *UpdateController) ApplyUpdate(versionInfo *VersionInfo) error {
//	if versionInfo == nil {
//		return fmt.Errorf("informações de versão não fornecidas")
//	}
//	app.App().Log().Wails().Infof("Iniciando atualização para versão %s", versionInfo.Version)
//	err := c.updater.Update(versionInfo)
//	if err != nil {
//		app.App().Log().Wails().Errorf("Falha na atualização: %v", err)
//		return err
//	}
//	app.App().Log().Wails().Infoln("Atualização aplicada com sucesso. Reinicializando...")
//	return nil
//}
//
//func (c *UpdateController) GetUpdateStatus() map[string]interface{} {
//	return map[string]interface{}{
//		"currentVersion": c.updater.GetCurrentVersion(),
//		"lastCheck":      c.lastCheck,
//		"enabled":        c.checkEnabled,
//	}
//}
//
//func (c *UpdateController) SetCheckEnabled(enabled bool) {
//	c.checkEnabled = enabled
//}
