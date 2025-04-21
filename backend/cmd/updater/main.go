package main

import (
	"embed"
	"flag"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/cmd/updater/manager"
	updaterUtils "github.com/hex-boost/hex-nexus-app/backend/cmd/updater/utils"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"go.uber.org/zap"
	"os"
)

//go:embed all:dist
var assets embed.FS

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
	utils := utils.NewUtils()
	updateManager := manager.NewUpdateManager(cfg, updaterUtils, logger, utils)
	if *processStart != "" {
		processToStart := *processStart
		if processToStart == "" {
			processToStart = "Nexus" // Replace with your default process name
		}

		err := updateManager.StartMainApplication(processToStart)
		if err != nil {
			logger.Error("Erro ao iniciar o processo principal:", zap.String("process", processToStart), zap.Error(err))
			return
		}
		return
	}

	// Check if another instance is already running
	if updateManager.IsAnotherInstanceRunning() {
		logger.Info("Outra instância já está em execução. Iniciando aplicação diretamente.")
		err := updateManager.StartMainApplication("Nexus") // Replace with your default process name
		if err != nil {
			logger.Error("Erro ao iniciar o processo principal:", zap.Error(err))
		}
		return
	}

	// Normal first instance flow - proceed with update window
	updateWindow := manager.NewUpdaterWindow(assets, updateManager)
	err = updateWindow.App.Run()
	if err != nil {
		logger.Error("Erro ao iniciar o aplicativo:", zap.Error(err))
		os.Exit(1)
	}
}
