package updaterUtils

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"go.uber.org/zap"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/command"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
)

type UpdaterUtils struct {
	logger *logger.Logger
	cmd    *command.Command
}

var ExecutableFn = func() (string, error) {
	return os.Executable()
}

func New(logger *logger.Logger) *UpdaterUtils {
	return &UpdaterUtils{
		logger: logger,
		cmd:    command.New(),
	}
}

func (u *UpdaterUtils) GetLatestAppDir() (string, error) {
	baseDir, err := ExecutableFn()
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

// InstallWebView2 installs WebView2 Runtime
func (u *UpdaterUtils) InstallWebView2() error {
	// Get the executable directory
	exePath, err := os.Executable()
	if err != nil {
		u.logger.Error("Failed to get executable path", zap.Error(err))
		return err
	}

	execDir := filepath.Dir(exePath)
	webviewPath := filepath.Join(execDir, "MicrosoftEdgeWebview2Setup.exe")

	// Check if installer exists
	if _, err := os.Stat(webviewPath); os.IsNotExist(err) {
		u.logger.Error("WebView2 installer not found", zap.String("path", webviewPath))
		return fmt.Errorf("WebView2 installer not found at %s", webviewPath)
	}

	u.logger.Info("Installing WebView2 Runtime...", zap.String("path", webviewPath))

	// Run the installer
	cmd, err := u.cmd.Start(webviewPath)
	if err != nil {
		u.logger.Error("Failed to start WebView2 installer", zap.Error(err))
		return err
	}

	// Wait for installation to complete with a timeout
	done := make(chan error, 1)
	go func() {
		done <- cmd.Wait()
	}()

	// 5 minute timeout for installation
	select {
	case err = <-done:
		if err != nil {
			u.logger.Error("WebView2 installation failed", zap.Error(err))
			return err
		}
		u.logger.Info("WebView2 installation completed successfully")
	case <-time.After(5 * time.Minute):
		u.logger.Warn("WebView2 installation timed out, but might still be running")
		// We don't kill the process as it might still be installing
	}

	return nil
}
