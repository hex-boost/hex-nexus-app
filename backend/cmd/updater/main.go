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
	updateManager := manager.NewUpdateManager(cfg, updaterUtils, logger)

	if *processStart != "" {
		err := updateManager.StartMainApplication(*processStart)
		if err != nil {
			logger.Error("Erro ao iniciar o processo principal:", zap.String("process", *processStart), zap.Error(err))
			return
		}
		return
	}

	updateWindow := manager.NewUpdaterWindow(assets, updateManager)
	err = updateWindow.App.Run()
	if err != nil {
		logger.Error("Erro ao iniciar o aplicativo:", zap.Error(err))
		os.Exit(1)
	}
}
