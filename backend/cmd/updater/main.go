package main

import (
	"flag"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/cmd/updater/manager"
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

	//updateWindow := manager.NewUpdaterWindow(updateManager)
	//updateManager.SetContext(updateWindow)
	//
	//// O fluxo de atualização será controlado pelo frontend
	//// que começa verificando atualizações automaticamente
	//
	//updateWindow.Show()
}
