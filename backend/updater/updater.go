package updater

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/fynelabs/selfupdate"
	"github.com/go-resty/resty/v2"
)

var (
	Version    = "1.0.2"
	BackendURL = "https://nexus-back.up.railway.app"
	APIToken   = "e5bd04e90e05b51937ba00e4a43ae8fe91e722db62b4d616ee7bd692dbdc28f603595c207716c8e662392d3b83b67b1057bf002701edb5edadd0f2061ae7ad83e43e67d0b64aff715b7289af290c22d846400756ac63f23c069e73a4bd4eb81738ed6c8862d0aec0c67e80c29a3027fdf60d174066244ef532b25a5d3509020e"
)

type Updater struct {
	CurrentVersion  string
	BackupDirectory string
}

func NewUpdater() *Updater {
	return &Updater{
		CurrentVersion: Version,
	}
}

func (u *Updater) GetCurrentVersion() string {
	return u.CurrentVersion
}

type Response struct {
	NeedsUpdate bool   `json:"needsUpdate"`
	Version     string `json:"version"`
}

func (u *Updater) CheckForUpdates() (*Response, error) {
	client := resty.New().
		SetTimeout(10 * time.Second)
	var result Response
	strapiURL := fmt.Sprintf("%s/api/versions/update", BackendURL)
	resp, err := client.R().
		SetHeader("x-client-version", u.CurrentVersion).
		SetAuthToken("Bearer " + APIToken).
		SetResult(&result).
		Get(strapiURL)
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, fmt.Errorf("API returned status: %d for %s", resp.StatusCode(), strapiURL)
	}
	return &result, nil
}
func (u *Updater) LogBuildInfo(filepath string) error {
	info := fmt.Sprintf("Versão: %s\nBackendURL: %s\nAPIToken: %s\nData de verificação: %s\n",
		Version, BackendURL, APIToken, time.Now().Format(time.RFC3339))

	return os.WriteFile(filepath, []byte(info), 0644)
}
func (u *Updater) UpdateAndRestart() error {
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("erro ao obter caminho do executável: %w", err)
	}

	// Resolver symlinks se existirem
	realPath, err := filepath.EvalSymlinks(execPath)
	if err != nil {
		return fmt.Errorf("erro ao resolver symlink: %w", err)
	}

	// Fazer backup do binário atual
	backupPath := realPath + ".bak"
	if err := os.Rename(realPath, backupPath); err != nil {
		return fmt.Errorf("erro ao criar backup: %w", err)
	}

	// Fazer a atualização
	if err := u.Update(); err != nil {
		// Restaurar backup em caso de falha
		os.Rename(backupPath, realPath)
		return fmt.Errorf("erro na atualização: %w", err)
	}

	// Reiniciar a aplicação
	return u.restartApplication(os.Args)
}

func (u *Updater) restartApplication(args []string) error {
	execPath, err := os.Executable()
	if err != nil {
		return err
	}

	// Preparar comando para reiniciar
	cmd := exec.Command(execPath, args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP}

	// Iniciar nova instância e sair do processo atual
	if err := cmd.Start(); err != nil {
		return err
	}

	os.Exit(0)
	return nil // Nunca executado, apens para compilação
}

type VersionResponse struct {
	LatestVersion struct {
		ID          int     `json:"id"`
		DocumentID  string  `json:"documentId"`
		Version     string  `json:"version"`
		CreatedAt   string  `json:"createdAt"`
		UpdatedAt   string  `json:"updatedAt"`
		PublishedAt string  `json:"publishedAt"`
		Locale      *string `json:"locale"`
		File        struct {
			ID               int     `json:"id"`
			DocumentID       string  `json:"documentId"`
			Name             string  `json:"name"`
			AlternativeText  *string `json:"alternativeText"`
			Caption          *string `json:"caption"`
			Width            *int    `json:"width"`
			Height           *int    `json:"height"`
			Formats          *string `json:"formats"`
			Hash             string  `json:"hash"`
			Ext              string  `json:"ext"`
			Mime             string  `json:"mime"`
			Size             float64 `json:"size"`
			URL              string  `json:"url"`
			PreviewURL       *string `json:"previewUrl"`
			Provider         string  `json:"provider"`
			ProviderMetadata *string `json:"provider_metadata"`
			FolderPath       string  `json:"folderPath"`
			CreatedAt        string  `json:"createdAt"`
			UpdatedAt        string  `json:"updatedAt"`
			PublishedAt      string  `json:"publishedAt"`
			Locale           *string `json:"locale"`
		} `json:"file"`
	} `json:"latestVersion"`
}

func (u *Updater) Update() error {
	_, err := os.Executable()
	strapiLatestVersionURL := fmt.Sprintf("%s/api/versions/latest", BackendURL)
	if err != nil {
		return err
	}
	var response VersionResponse
	client := resty.New()
	resp, err := client.R().
		SetResult(&response).SetAuthToken("Bearer " + APIToken).
		Get(strapiLatestVersionURL)
	if err != nil {
		return err
	}
	if resp.IsError() {
		return fmt.Errorf("API returned status: %d", resp.StatusCode())
	}
	fileURL := response.LatestVersion.File.URL
	if fileURL == "" {
		return fmt.Errorf("no file URL found in response")
	}
	if !strings.HasPrefix(fileURL, "http") {
		fileURL = BackendURL + fileURL
	}
	resp, err = client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		return err
	}
	binReader := resp.RawBody()
	defer func(binReader io.ReadCloser) {
		err := binReader.Close()
		if err != nil {
		}
	}(binReader)
	err = selfupdate.Apply(binReader, selfupdate.Options{})
	if err != nil {
		return err
	}
	return nil
}
