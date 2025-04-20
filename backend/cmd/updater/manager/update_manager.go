package manager

import (
	"encoding/json"
	"fmt"
	updaterUtils "github.com/hex-boost/hex-nexus-app/backend/cmd/updater/utils"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/go-resty/resty/v2"
)

type UpdateManager struct {
	client       *resty.Client
	currentVer   string
	updaterUtils *updaterUtils.UpdaterUtils
	config       *config.Config
	logger       *utils.Logger
}

func NewUpdateManager(config *config.Config, utils *updaterUtils.UpdaterUtils, logger *utils.Logger) *UpdateManager {
	return &UpdateManager{
		config:       config,
		updaterUtils: utils,
		logger:       logger,
		client:       resty.New(),
	}
}
func (u *UpdateManager) CheckForUpdates() (bool, string) {
	//u.ui.SetStatus("Verificando atualizações...")

	// Obter a versão atual do diretório da aplicação
	appDir, err := u.updaterUtils.GetLatestAppDir()
	if err == nil {
		dirName := filepath.Base(appDir)
		if strings.HasPrefix(dirName, "app-") {
			u.currentVer = strings.TrimPrefix(dirName, "app-")
		} else {
			// Fallback para a versão do config
			u.currentVer = u.config.Version
		}
	} else {
		u.currentVer = u.config.Version
	}

	// Verifica se há atualização
	resp, err := u.client.R().
		SetHeader("x-client-version", u.currentVer).
		Get(fmt.Sprintf("%s/api/versions/update", u.config.BackendURL))

	if err != nil {
		//u.ui.SetStatus("Erro ao conectar ao servidor")
		return false, ""
	}

	var result struct {
		NeedsUpdate bool   `json:"needsUpdate"`
		Version     string `json:"version"`
	}

	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return false, ""
	}

	return result.NeedsUpdate, result.Version
}

// DownloadUpdate baixa a última versão da atualização e retorna o caminho temporário e a versão
func (u *UpdateManager) DownloadUpdate() (downloadPath string, version string, err error) {
	resp, err := u.client.R().Get(fmt.Sprintf("%s/api/versions/latest", u.config.BackendURL))
	if err != nil {
		return "", "", err
	}

	var versionResp struct {
		LatestVersion struct {
			Version string `json:"version"`
			File    struct {
				URL string `json:"url"`
			} `json:"file"`
		} `json:"latestVersion"`
	}

	if err := json.Unmarshal(resp.Body(), &versionResp); err != nil {
		return "", "", err
	}

	fileURL := versionResp.LatestVersion.File.URL
	if fileURL == "" {
		return "", "", fmt.Errorf("URL da atualização não encontrada")
	}

	// Adicionar domínio base se necessário
	if fileURL[0] == '/' {
		fileURL = u.config.BackendURL + fileURL
	}

	// Baixar atualização
	//u.ui.SetStatus("Baixando atualização...")
	//u.ui.SetProgress(0)

	respDownload, err := u.client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		return "", "", err
	}

	// Criar um arquivo temporário para o download
	tempFile, err := os.CreateTemp("", "nexus-update-*.exe")
	if err != nil {
		return "", "", err
	}
	defer tempFile.Close()

	// Extrair e salvar binário
	binReader := respDownload.RawBody()
	defer binReader.Close()

	if _, err = io.Copy(tempFile, binReader); err != nil {
		return "", "", err
	}

	return tempFile.Name(), versionResp.LatestVersion.Version, nil
}

// InstallUpdate instala a atualização baixada no local correto
func (u *UpdateManager) InstallUpdate(downloadPath string, version string) error {
	// Criar diretório de destino
	baseDir, err := updaterUtils.ExecutableFn()
	if err != nil {
		return err
	}
	// fix
	baseDir = filepath.Dir(baseDir)
	newAppDir := filepath.Join(baseDir, "app-"+version)

	if err := os.MkdirAll(newAppDir, 0755); err != nil {
		return err
	}

	// Salvar o novo executável
	targetPath := filepath.Join(newAppDir, "Nexus.exe")

	//u.ui.SetStatus("Instalando atualização...")
	//u.ui.SetProgress(50)

	// Copiar do arquivo temporário para o destino
	source, err := os.Open(downloadPath)
	if err != nil {
		return err
	}
	defer source.Close()

	outFile, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	if _, err = io.Copy(outFile, source); err != nil {
		return err
	}

	// Limpar o arquivo temporário
	os.Remove(downloadPath)

	//u.ui.SetProgress(100)
	//u.ui.SetStatus("Atualização concluída!")

	return nil
}

func (u *UpdateManager) DownloadAndInstallUpdate() error {
	downloadPath, version, err := u.DownloadUpdate()
	if err != nil {
		return err
	}

	return u.InstallUpdate(downloadPath, version)
}
func (u *UpdateManager) StartMainApplication(exeName string) {
	appDir, err := u.updaterUtils.GetLatestAppDir()
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
