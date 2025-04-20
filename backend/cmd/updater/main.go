package main

import (
	"flag"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/cmd/updater/manager"
	"github.com/hex-boost/hex-nexus-app/backend/cmd/updater/ui"
	updaterUtils "github.com/hex-boost/hex-nexus-app/backend/cmd/updater/utils"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"os"
)

func main() {
	processStart := flag.String("processStart", "", "Nome do processo a ser iniciado")
	flag.Parse()

	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Erro ao carregar configuração: %v\n", err)
		os.Exit(1)
	}
	logger := utils.NewLogger("updater", cfg)
	updaterUtils := updaterUtils.New()
	updateManager := manager.NewUpdateManager(cfg, updaterUtils, logger)
	if *processStart != "" {
		updateManager.StartMainApplication(*processStart)
		return
	}

	updateWindow := ui.NewUpdaterWindow(updateManager)

	go func() {
		hasUpdate, newVersion := updateManager.CheckForUpdates()

		if hasUpdate {
			//updateWindow.SetStatus(fmt.Sprintf("Atualizando para versão %s...", newVersion))
			err := updateManager.DownloadAndInstallUpdate()
			if err != nil {
				//updateWindow.SetError(fmt.Sprintf("Erro na atualização: %v", err))
				os.Exit(1)
			}
		} else {
			//updateWindow.SetStatus("Iniciando Nexus...")
		}

		updateManager.StartMainApplication("Nexus.exe")
	}()

	updateWindow.Show()
}
