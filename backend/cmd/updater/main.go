package main

import (
	"embed"
	"flag"
	"fmt"
	"os"

	"github.com/hex-boost/hex-nexus-app/backend/internal/updater"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"

	updaterUtils "github.com/hex-boost/hex-nexus-app/backend/cmd/updater/utils"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"go.uber.org/zap"
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
	newLogger := logger.New("updater", cfg)
	newUpdaterUtils := updaterUtils.New(newLogger)
	updateManager := updater.NewUpdateManager(cfg, newUpdaterUtils, newLogger)
	if *processStart != "" {
		processToStart := *processStart
		if processToStart == "" {
			processToStart = "Nexus" // Replace with your default process name
		}

		err := updateManager.StartMainApplication(processToStart)
		if err != nil {
			newLogger.Error("Erro ao iniciar o processo principal:", zap.String("process", processToStart), zap.Error(err))
			return
		}
		return
	}
	if !newUpdaterUtils.CheckWebView2Installation() {
		newLogger.Info("WebView2 not detected, installing...")
		err := newUpdaterUtils.InstallWebView2()
		if err != nil {
			newLogger.Error("Failed to install WebView2", zap.Error(err))
			panic("WebView2 installation failed")
		} else {
			newLogger.Info("WebView2 installation completed")
		}
	} else {
		newLogger.Info("WebView2 is already installed")
	}

	// Check if another instance is already running
	if updateManager.IsAnotherInstanceRunning() {
		newLogger.Info("Outra instância já está em execução. Iniciando aplicação diretamente.")
		err := updateManager.StartMainApplication("Nexus") // Replace with your default process name
		if err != nil {
			newLogger.Error("Erro ao iniciar o processo principal:", zap.Error(err))
		}
		return
	}

	// Normal first instance flow - proceed with update window
	updateWindow := updater.NewUpdaterWindow(assets, updateManager)
	err = updateWindow.App.Run()
	if err != nil {
		newLogger.Error("Erro ao iniciar o aplicativo:", zap.Error(err))
		os.Exit(1)
	}
}
