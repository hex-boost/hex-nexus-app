package updater

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/fynelabs/selfupdate"
	"github.com/go-resty/resty/v2"
)

// Version é definido durante a compilação usando ldflags
var Version = "development"

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
	// Criar cliente resty
	client := resty.New().
		SetTimeout(10 * time.Second)
	var result Response
	resp, err := client.R().
		SetHeader("x-client-version", u.CurrentVersion).
		SetResult(&result).
		Get(os.Getenv("BACKEND_URL") + "/api/versions/update")

	if err != nil {
		return nil, err
	}

	if resp.IsError() {
		return nil, fmt.Errorf("API retornou status: %d", resp.StatusCode())
	}

	return &result, nil
}

type VersionResponse struct {
	LatestVersion struct {
		ID          int     `json:"id"` // Alterado de string para int
		DocumentID  string  `json:"documentId"`
		Version     string  `json:"version"`
		CreatedAt   string  `json:"createdAt"`
		UpdatedAt   string  `json:"updatedAt"`
		PublishedAt string  `json:"publishedAt"`
		Locale      *string `json:"locale"`
		File        struct {
			ID               int     `json:"id"` // Alterado de string para int
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
	// Backup do executável atual
	execPath, err := os.Executable()
	if err != nil {
		return err
	}

	backupPath := filepath.Join(u.BackupDirectory, fmt.Sprintf("backup-%s", u.CurrentVersion))
	if err := u.backupCurrentBinary(execPath, backupPath); err != nil {
		return err
	}

	// Obter metadados da versão mais recente
	var response VersionResponse
	client := resty.New()
	resp, err := client.R().
		SetResult(&response).SetAuthToken("Bearer " + os.Getenv("STRAPI_API_TOKEN")).
		Get(os.Getenv("BACKEND_URL") + "/api/versions/latest")

	if err != nil {
		return err
	}
	if resp.IsError() {
		return fmt.Errorf("API retornou status: %d", resp.StatusCode())

	}

	// Obter URL do arquivo binário
	fileURL := response.LatestVersion.File.URL

	// Se a URL for relativa, combinar com o BACKEND_URL
	if !strings.HasPrefix(fileURL, "http") {
		fileURL = os.Getenv("BACKEND_URL") + fileURL
	}

	// Baixar o arquivo binário
	resp, err = client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)

	if err != nil {
		return err
	}

	// Converter o corpo da resposta em um io.Reader
	binReader := resp.RawBody()
	defer binReader.Close()

	// Aplicar a atualização
	err = selfupdate.Apply(binReader, selfupdate.Options{})
	if err != nil {
		// Tenta restaurar a versão anterior em caso de falha
		u.rollbackUpdate(backupPath)
		return err
	}

	return nil
}
func (u *Updater) backupCurrentBinary(execPath, backupPath string) error {
	src, err := os.Open(execPath)
	if err != nil {
		return err
	}
	defer src.Close()

	dst, err := os.OpenFile(backupPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		return err
	}
	defer dst.Close()

	_, err = io.Copy(dst, src)
	return err
}

func (u *Updater) rollbackUpdate(backupPath string) error {
	_, err := os.Executable()
	if err != nil {
		return err
	}

	backupFile, err := os.Open(backupPath)
	if err != nil {
		return fmt.Errorf("falha ao abrir arquivo de backup: %w", err)
	}
	defer backupFile.Close()

	err = selfupdate.Apply(backupFile, selfupdate.Options{})
	if err != nil {
		return fmt.Errorf("falha no rollback: %w", err)
	}

	return nil
}

func (u *Updater) ListAvailableVersions() ([]string, error) {
	files, err := os.ReadDir(u.BackupDirectory)
	if err != nil {
		return nil, err
	}

	var versions []string
	for _, file := range files {
		if !file.IsDir() && filepath.Ext(file.Name()) == "" {
			versions = append(versions, file.Name())
		}
	}

	return versions, nil
}
