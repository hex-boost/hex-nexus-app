package wails

import (
	"context"
	"github.com/hex-boost/hex-nexus-app/backend/app"
	"github.com/hex-boost/hex-nexus-app/backend/updater"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

var updateController *updater.UpdateController

func startup(ctx context.Context) {
	app.App().SetCtx(ctx).Log().Wails().Infoln("WAILS START UP")
	updateController = updater.NewUpdateController()

}
func checkAndApplyUpdates(ctx context.Context) {
	// Aguarda para não impactar o carregamento inicial
	time.Sleep(3 * time.Second)

	app.App().Log().Wails().Infoln("Verificando atualizações automáticas...")
	versionInfo, err := updateController.CheckForUpdates()
	if err != nil {
		app.App().Log().Wails().Errorf("Erro ao verificar atualizações: %v", err)
		return
	}

	if versionInfo != nil {
		app.App().Log().Wails().Infof("Nova versão %s encontrada. Iniciando atualização automática...", versionInfo.Version)

		// Notifica usuário que uma atualização está sendo aplicada
		//app.App().Runtime().EventsEmit(ctx, "update:inProgress", map[string]interface{}{
		//	"version": versionInfo.Version,
		//	"message": "Atualizando automaticamente para a nova versão...",
		//})
		//
		//// Aplica a atualização
		//err := updateController.ApplyUpdate(versionInfo)
		//if err != nil {
		//	app.App().Log().Wails().Errorf("Falha ao aplicar atualização automática: %v", err)
		//	app.App().Runtime().EventsEmit(ctx, "update:failed", map[string]string{
		//		"error": err.Error(),
		//	})
		//	return
		//}

		// Reinicia o aplicativo após atualização bem-sucedida
		restartApplication()
	} else {
		app.App().Log().Wails().Infoln("Nenhuma atualização disponível")
	}
}
func restartApplication() {
	app.App().Log().Wails().Infoln("Reiniciando aplicação após atualização...")

	execPath, err := os.Executable()
	if err != nil {
		app.App().Log().Wails().Errorf("Erro ao obter caminho do executável: %v", err)
		return
	}

	// Cria um processo separado para reiniciar o aplicativo
	cmd := exec.Command(execPath)
	cmd.Dir = filepath.Dir(execPath)

	// Inicia o novo processo desvinculado do atual
	err = cmd.Start()
	if err != nil {
		app.App().Log().Wails().Errorf("Erro ao reiniciar aplicação: %v", err)
		return
	}

	// Encerra o processo atual
	os.Exit(0)
}
func startPeriodicUpdateChecks(ctx context.Context) {
	ticker := time.NewTicker(4 * time.Hour) // Verifica a cada 4 horas
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			go checkAndApplyUpdates(ctx)
		case <-ctx.Done():
			return
		}
	}
}
func domReady(ctx context.Context) {
	app.App().SetCtx(ctx).Log().Wails().Infoln("WAILS DOM READY")
	go checkAndApplyUpdates(ctx)

	go startPeriodicUpdateChecks(ctx)
}

func beforeClose(ctx context.Context) (prevent bool) {
	app.App().SetCtx(ctx).Log().Wails().Infoln("WAILS BEFORE CLOSE")
	return false
}

func shutdown(ctx context.Context) {
	app.App().SetCtx(ctx).Log().Wails().Infoln("WAILS SHUTDOWN")
}

func suspend() {
	app.App().Log().Wails().Infoln("WAILS SUSPEND")
}

func resume() {
	app.App().Log().Wails().Infoln("WAILS RESUME")
}
