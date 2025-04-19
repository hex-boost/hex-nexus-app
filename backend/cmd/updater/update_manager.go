package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend/cmd/updater/ui"
)

const BackendURL = "https://nexus-back.up.railway.app"

type UpdateManager struct {
	ui         *ui.UpdaterWindow
	client     *resty.Client
	currentVer string
}

func NewUpdateManager(ui *ui.UpdaterWindow) *UpdateManager {
	return &UpdateManager{
		ui:     ui,
		client: resty.New(),
	}
}

func (u *UpdateManager) CheckForUpdates() (bool, string) {
	u.ui.SetStatus("Verificando atualizações...")

	// Obtém versão atual
	currentVer, err := u.getCurrentVersion()
	if err != nil {
		u.ui.SetStatus("Erro ao verificar versão atual")
		return false, ""
	}
	u.currentVer = currentVer

	// Verifica se há atualização
	resp, err := u.client.R().
		SetHeader("x-client-version", currentVer).
		Get(fmt.Sprintf("%s/api/versions/update", BackendURL))

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

func (u *UpdateManager) DownloadAndInstallUpdate() error {
	// Obter informações da versão mais recente
	resp, err := u.client.R().Get(fmt.Sprintf("%s/api/versions/latest", BackendURL))
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
		fileURL = BackendURL + fileURL
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
	baseDir, err := os.Executable()
	if err != nil {
		return err
	}
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

	// Atualizar versão atual
	u.ui.SetProgress(100)
	u.ui.SetStatus("Atualização concluída!")

	return nil
}

func (u *UpdateManager) getCurrentVersion() (string, error) {
	// Tentar ler de um arquivo version.txt
	execPath, err := os.Executable()
	if err != nil {
		return "unknown", err
	}

	baseDir := filepath.Dir(execPath)
	versionFile := filepath.Join(baseDir, "version.txt")

	content, err := os.ReadFile(versionFile)
	if err == nil {
		return string(content), nil
	}

	// Fallback para versão embutida
	return "1.0.0", nil
}
