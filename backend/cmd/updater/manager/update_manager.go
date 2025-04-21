package manager

import (
	"encoding/json"
	"fmt"
	updaterUtils "github.com/hex-boost/hex-nexus-app/backend/cmd/updater/utils"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"go.uber.org/zap"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/go-resty/resty/v2"
)

type UpdateStatus struct {
	Status         string  `json:"status"`
	Progress       float64 `json:"progress"`
	LatestVersion  string  `json:"latestVersion,omitempty"`
	CurrentVersion string  `json:"currentVersion"`
	Error          string  `json:"error,omitempty"`
	NeedsUpdate    bool    `json:"needsUpdate"`
}

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

//func (u *UpdateManager) SetContext(ctx *ui.Context) {
//	u.ctx = ctx
//}

func (u *UpdateManager) updateStatus(status UpdateStatus) {
	//runtime.EventsEmit(u.ctx.Context, "updater:status-change", status)
}

func (u *UpdateManager) CheckForUpdates() (bool, string) {
	status := UpdateStatus{
		Status:      "Verificando atualizações...",
		Progress:    0,
		NeedsUpdate: false,
	}
	u.updateStatus(status)

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

	status.CurrentVersion = u.currentVer
	u.updateStatus(status)

	// Verifica se há atualização
	resp, err := u.client.R().
		SetHeader("x-client-version", u.currentVer).
		Get(fmt.Sprintf("%s/api/versions/update", u.config.BackendURL))

	if err != nil {
		status.Status = "error"
		status.Error = "Erro ao conectar ao servidor"
		u.updateStatus(status)
		return false, ""
	}

	var result struct {
		NeedsUpdate bool   `json:"needsUpdate"`
		Version     string `json:"version"`
	}

	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		status.Status = "error"
		status.Error = "Erro ao processar resposta do servidor"
		u.updateStatus(status)
		return false, ""
	}

	status.NeedsUpdate = result.NeedsUpdate
	status.LatestVersion = result.Version
	//status.Status = result.NeedsUpdate ? "Atualização disponível" : "Atualizado"
	status.Progress = 10
	u.updateStatus(status)

	return result.NeedsUpdate, result.Version
}

// DownloadUpdate baixa a última versão da atualização e retorna o caminho temporário e a versão
func (u *UpdateManager) DownloadUpdate() (downloadPath string, version string, err error) {
	status := UpdateStatus{
		Status:         "Obtendo informações da atualização...",
		Progress:       10,
		CurrentVersion: u.currentVer,
		NeedsUpdate:    true,
	}
	u.updateStatus(status)

	resp, err := u.client.R().Get(fmt.Sprintf("%s/api/versions/latest", u.config.BackendURL))
	if err != nil {
		status.Status = "error"
		status.Error = "Erro ao obter informações da atualização"
		u.updateStatus(status)
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
		status.Status = "error"
		status.Error = "Erro ao processar informações da atualização"
		u.updateStatus(status)
		return "", "", err
	}

	fileURL := versionResp.LatestVersion.File.URL
	if fileURL == "" {
		status.Status = "error"
		status.Error = "URL da atualização não encontrada"
		u.updateStatus(status)
		return "", "", fmt.Errorf("URL da atualização não encontrada")
	}

	// Adicionar domínio base se necessário
	if fileURL[0] == '/' {
		fileURL = u.config.BackendURL + fileURL
	}

	// Baixar atualização
	status.Status = "Baixando atualização..."
	status.Progress = 20
	status.LatestVersion = versionResp.LatestVersion.Version
	u.updateStatus(status)

	respDownload, err := u.client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		status.Status = "error"
		status.Error = "Erro ao baixar atualização"
		u.updateStatus(status)
		return "", "", err
	}

	// Criar um arquivo temporário para o download
	tempFile, err := os.CreateTemp("", "nexus-update-*.exe")
	if err != nil {
		status.Status = "error"
		status.Error = "Erro ao criar arquivo temporário"
		u.updateStatus(status)
		return "", "", err
	}
	defer tempFile.Close()

	// Extrair e salvar binário
	binReader := respDownload.RawBody()
	defer binReader.Close()

	// Atualizar progresso durante o download
	status.Progress = 40
	u.updateStatus(status)

	if _, err = io.Copy(tempFile, binReader); err != nil {
		status.Status = "error"
		status.Error = "Erro ao salvar arquivo de atualização"
		u.updateStatus(status)
		return "", "", err
	}

	status.Status = "Download concluído"
	status.Progress = 50
	u.updateStatus(status)

	return tempFile.Name(), versionResp.LatestVersion.Version, nil
}

// InstallUpdate instala a atualização baixada no local correto
func (u *UpdateManager) InstallUpdate(downloadPath string, version string) error {
	status := UpdateStatus{
		Status:         "Instalando atualização...",
		Progress:       60,
		CurrentVersion: u.currentVer,
		LatestVersion:  version,
		NeedsUpdate:    true,
	}
	u.updateStatus(status)

	// Criar diretório de destino
	baseDir, err := updaterUtils.ExecutableFn()
	if err != nil {
		status.Status = "error"
		status.Error = "Erro ao determinar diretório de instalação"
		u.updateStatus(status)
		return err
	}
	// fix
	baseDir = filepath.Dir(baseDir)
	newAppDir := filepath.Join(baseDir, "app-"+version)

	if err := os.MkdirAll(newAppDir, 0755); err != nil {
		status.Status = "error"
		status.Error = "Erro ao criar diretório de instalação"
		u.updateStatus(status)
		return err
	}

	// Salvar o novo executável
	targetPath := filepath.Join(newAppDir, "Nexus.exe")

	status.Progress = 75
	u.updateStatus(status)

	// Copiar do arquivo temporário para o destino
	source, err := os.Open(downloadPath)
	if err != nil {
		status.Status = "error"
		status.Error = "Erro ao acessar arquivo de atualização"
		u.updateStatus(status)
		return err
	}
	defer source.Close()

	outFile, err := os.Create(targetPath)
	if err != nil {
		status.Status = "error"
		status.Error = "Erro ao criar arquivo de destino"
		u.updateStatus(status)
		return err
	}
	defer outFile.Close()

	if _, err = io.Copy(outFile, source); err != nil {
		status.Status = "error"
		status.Error = "Erro ao copiar atualização"
		u.updateStatus(status)
		return err
	}

	// Limpar o arquivo temporário
	os.Remove(downloadPath)

	status.Status = "complete"
	status.Progress = 100
	u.updateStatus(status)

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
	status := UpdateStatus{
		Status:         "Iniciando aplicação...",
		Progress:       100,
		CurrentVersion: u.currentVer,
		NeedsUpdate:    false,
	}
	u.updateStatus(status)

	appDir, err := u.updaterUtils.GetLatestAppDir()
	if err != nil {
		u.logger.Error("Erro ao determinar diretório do aplicativo: %v", zap.Error(err))
		os.Exit(1)
	}

	appPath := filepath.Join(appDir, exeName+".exe")
	cmd := exec.Command(appPath)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		u.logger.Error("Erro ao iniciar o aplicativo: %v", zap.Error(err))
		os.Exit(1)
	}

	os.Exit(0)
}
