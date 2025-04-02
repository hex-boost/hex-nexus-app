package wails

import (
	"github.com/hex-boost/hex-nexus-app/backend/updater"
	"github.com/wailsapp/wails/v3/pkg/application"
	"log"
)

func startup(loadingWindow *application.WebviewWindow, updaterService *updater.Updater) {

	err := updaterService.UpdateWithProgress(loadingWindow)

	if err != nil {
		log.Printf("Erro na atualização: %v", err)
	}

	// Cria um logger para o módulo de atualização
	//log := utils.NewFileLogger("updater")
	//
	//updaterService := updater.NewUpdater()
	//
	//if updaterService.CurrentVersion == "development" {
	//	log.Info("Execução em modo de desenvolvimento, ignorando verificação de atualização")
	//	return
	//}
	//
	//log.Info("Verificando atualizações. Versão atual: " + updaterService.CurrentVersion)
	//
	//response, err := updaterService.CheckForUpdates()
	//if err != nil {
	//	log.Errorf("Erro ao verificar atualizações: %v", err)
	//	app.App().Log().Wails().Infoln(err)
	//	// Registra o erro mas não interrompe a execução
	//	return
	//}
	//
	//if response != nil {
	//	log.Infof("Resposta do servidor: precisa atualizar=%v, versão disponível=%s",
	//		response.NeedsUpdate, response.Version)
	//
	//	if response.NeedsUpdate {
	//		log.Info("Iniciando processo de atualização para a versão " + response.Version)
	//
	//		err := updaterService.Update()
	//		if err != nil {
	//			log.Errorf("Falha na atualização: %v", err)
	//			// Registra o erro mas não causa pânico, permitindo que o aplicativo continue
	//			return
	//		}
	//
	//		log.Info("Atualização concluída com sucesso. Reiniciando aplicativo.")
	//		mainApp.Quit()
	//	} else {
	//		log.Info("O aplicativo está atualizado.")
	//	}
	//} else {
	//	log.Warn("Resposta vazia do servidor de atualização")
	//}
}
