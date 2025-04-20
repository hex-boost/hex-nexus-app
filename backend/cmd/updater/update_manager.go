package main

import (
	"encoding/json"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-resty/resty/v2"
)

type UpdaterUI interface {
	SetStatus(status string)
	SetProgress(percent int)
	SetError(errorMsg string)
	Show()
}
type UpdateManager struct {
	ui         UpdaterUI
	client     *resty.Client
	currentVer string
	config     *config.Config
}

func NewUpdateManager(ui UpdaterUI, config *config.Config) *UpdateManager {
	return &UpdateManager{
		config: config,
		ui:     ui,
		client: resty.New(),
	}
}
func (u *UpdateManager) CheckForUpdates() (bool, string) {
	u.ui.SetStatus("Verificando atualizações...")

	// Obter a versão atual do diretório da aplicação
	appDir, err := getLatestAppDir()
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
		u.ui.SetStatus("Erro ao conectar ao servidor")
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

// Variável para encapsular os.Executable e permitir testes
var executableFn = func() (string, error) {
	return os.Executable()
}

func (u *UpdateManager) DownloadAndInstallUpdate() error {
	resp, err := u.client.R().Get(fmt.Sprintf("%s/api/versions/latest", u.config.BackendURL))
	if err != nil {
		return err
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
		return err
	}

	fileURL := versionResp.LatestVersion.File.URL
	if fileURL == "" {
		return fmt.Errorf("URL da atualização não encontrada")
	}

	// Adicionar domínio base se necessário
	if fileURL[0] == '/' {
		fileURL = u.config.BackendURL + fileURL
	}

	// Baixar atualização
	u.ui.SetStatus("Baixando atualização...")
	u.ui.SetProgress(0)

	respDownload, err := u.client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		return err
	}

	// Criar diretório de destino
	baseDir, err := executableFn()
	if err != nil {
		return err
	}
	// fix
	baseDir = filepath.Dir(baseDir)
	newAppDir := filepath.Join(baseDir, "app-"+versionResp.LatestVersion.Version)

	if err := os.MkdirAll(newAppDir, 0755); err != nil {
		return err
	}

	// Salvar o novo executável
	targetPath := filepath.Join(newAppDir, "Nexus.exe")

	u.ui.SetStatus("Instalando atualização...")
	u.ui.SetProgress(50)

	// Extrair e salvar binário
	binReader := respDownload.RawBody()
	defer binReader.Close()

	// Opção 1: Aplicar diretamente se for um executável completo
	// err = selfupdate.Apply(binReader, selfupdate.Options{TargetPath: targetPath})

	// Opção 2: Extrair arquivos se for um pacote
	outFile, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	if _, err = io.Copy(outFile, binReader); err != nil {
		return err
	}

	u.ui.SetProgress(100)
	u.ui.SetStatus("Atualização concluída!")

	return nil
}
