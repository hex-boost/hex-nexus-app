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
}

func NewUpdateManager(config *config.Config, utils *updaterUtils.UpdaterUtils, logger *utils.Logger) *UpdateManager {
	return &UpdateManager{
		config:       config,
		updaterUtils: utils,
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
	//u.ui.SetStatus("Baixando atualização...")
	//u.ui.SetProgress(0)

	respDownload, err := u.client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		return err
	}

	// Criar diretório de destino
	baseDir, err := updaterUtils.ExecutableFn()
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

	//u.ui.SetStatus("Instalando atualização...")
	//u.ui.SetProgress(50)

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

	//u.ui.SetProgress(100)
	//u.ui.SetStatus("Atualização concluída!")

	return nil
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
