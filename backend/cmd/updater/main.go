package main

import (
	"flag"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/hex-boost/hex-nexus-app/backend/cmd/updater/ui"
)

func main() {
	processStart := flag.String("processStart", "", "Nome do processo a ser iniciado")
	flag.Parse()

	if *processStart != "" {
		startMainApplication(*processStart)
		return
	}

	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Erro ao carregar configuração: %v\n", err)
		os.Exit(1)
	}
	updateWindow := ui.NewUpdaterWindow()
	updateManager := NewUpdateManager(updateWindow, cfg)

	// Inicia a verificação de atualizações
	go func() {
		hasUpdate, newVersion := updateManager.CheckForUpdates()

		if hasUpdate {
			updateWindow.SetStatus(fmt.Sprintf("Atualizando para versão %s...", newVersion))
			err := updateManager.DownloadAndInstallUpdate()
			if err != nil {
				updateWindow.SetError(fmt.Sprintf("Erro na atualização: %v", err))
				os.Exit(1)
			}
		} else {
			updateWindow.SetStatus("Iniciando Nexus...")
		}

		startMainApplication("Nexus.exe")
	}()

	updateWindow.Show()
}

func startMainApplication(exeName string) {
	appDir, err := getLatestAppDir()
	if err != nil {
		fmt.Printf("Erro ao determinar diretório do aplicativo: %v\n", err)
		os.Exit(1)
	}

	appPath := filepath.Join(appDir, exeName)
	cmd := exec.Command(appPath)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		fmt.Printf("Erro ao iniciar o aplicativo: %v\n", err)
		os.Exit(1)
	}

	os.Exit(0)
}

func getLatestAppDir() (string, error) {
	baseDir, err := executableFn()
	if err != nil {
		return "", err
	}
	baseDir = filepath.Dir(baseDir)

	// Procura o diretório app-x.y.z mais recente
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return "", err
	}

	type Version struct {
		path                string
		major, minor, patch int
	}

	var versions []Version

	// Encontra todos os diretórios app-x.y.z e analisa suas versões
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		name := entry.Name()
		if !strings.HasPrefix(name, "app-") {
			continue
		}

		versionStr := strings.TrimPrefix(name, "app-")
		parts := strings.Split(versionStr, ".")

		if len(parts) != 3 {
			continue
		}

		major, err1 := strconv.Atoi(parts[0])
		minor, err2 := strconv.Atoi(parts[1])
		patch, err3 := strconv.Atoi(parts[2])

		if err1 != nil || err2 != nil || err3 != nil {
			continue
		}

		versions = append(versions, Version{
			path:  filepath.Join(baseDir, name),
			major: major,
			minor: minor,
			patch: patch,
		})
	}

	if len(versions) == 0 {
		// Fallback: se não encontrar diretórios versionados, retorna o diretório base
		return baseDir, nil
	}

	// Ordena as versões para encontrar a mais recente (maior número de versão)
	sort.Slice(versions, func(i, j int) bool {
		if versions[i].major != versions[j].major {
			return versions[i].major > versions[j].major
		}
		if versions[i].minor != versions[j].minor {
			return versions[i].minor > versions[j].minor
		}
		return versions[i].patch > versions[j].patch
	})

	// Retorna o caminho da versão mais alta
	return versions[0].path, nil
}
