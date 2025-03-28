package updater

import (
	"crypto/ed25519"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/fynelabs/selfupdate"
)

// Version é definido durante a compilação usando ldflags
var Version = "development"

type Updater struct {
	CurrentVersion  string
	BackupDirectory string
	PublicKeyHex    string // Chave pública para verificação
}

type VersionInfo struct {
	Version     string `json:"version"`
	URL         string `json:"url"`
	ReleaseDate string `json:"releaseDate"`
	Required    bool   `json:"required"` // Se a atualização é obrigatória
	Signature   string `json:"signature"`
}

func NewUpdater() *Updater {
	backupDir := filepath.Join(os.TempDir(), "nexus-backups")
	os.MkdirAll(backupDir, 0755)

	return &Updater{
		CurrentVersion:  Version,
		BackupDirectory: backupDir,
		PublicKeyHex:    os.Getenv("UPDATE_PUBLIC_KEY"), // Definido nas variáveis de ambiente
	}
}

func (u *Updater) GetCurrentVersion() string {
	return u.CurrentVersion
}

func (u *Updater) CheckForUpdates(apiURL string) (*VersionInfo, error) {
	// Criar requisição para a API
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	// Adicionar headers necessários
	req.Header.Set("Authorization", "Bearer "+os.Getenv("UPDATE_API_KEY"))
	req.Header.Set("X-Client-Version", u.CurrentVersion)
	req.Header.Set("X-Client-OS", runtime.GOOS)
	req.Header.Set("X-Client-Arch", runtime.GOARCH)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API retornou status: %d", resp.StatusCode)
	}

	var response struct {
		NeedsUpdate bool        `json:"needsUpdate"`
		VersionInfo VersionInfo `json:",inline"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}

	if !response.NeedsUpdate {
		return nil, nil
	}

	return &response.VersionInfo, nil
}
func (u *Updater) Update(versionInfo *VersionInfo) error {
	// Backup do executável atual
	execPath, err := os.Executable()
	if err != nil {
		return err
	}

	backupPath := filepath.Join(u.BackupDirectory, fmt.Sprintf("backup-%s", u.CurrentVersion))
	if err := u.backupCurrentBinary(execPath, backupPath); err != nil {
		return err
	}

	// Download da nova versão
	resp, err := http.Get(versionInfo.URL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Verifica assinatura digital
	if err := u.verifySignature(resp.Body, versionInfo.Signature); err != nil {
		return fmt.Errorf("verificação de assinatura falhou: %w", err)
	}

	// Reinicia o download já que já consumimos o body para verificação 1
	resp, err = http.Get(versionInfo.URL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Aplica a atualização
	err = selfupdate.Apply(resp.Body, selfupdate.Options{})
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

func (u *Updater) verifySignature(binary io.Reader, signatureHex string) error {
	// Lê todo o binário
	binaryData, err := io.ReadAll(binary)
	if err != nil {
		return err
	}

	// Decodifica a assinatura e chave pública
	signature, err := hex.DecodeString(signatureHex)
	if err != nil {
		return err
	}

	publicKey, err := hex.DecodeString(u.PublicKeyHex)
	if err != nil {
		return err
	}

	// Verifica a assinatura
	if !ed25519.Verify(publicKey, binaryData, signature) {
		return errors.New("assinatura inválida - este binário pode ter sido adulterado")
	}

	return nil
}

func (u *Updater) rollbackUpdate(backupPath string) error {
	_, err := os.Executable()
	if err != nil {
		return err
	}

	// Abrir arquivo de backup
	backupFile, err := os.Open(backupPath)
	if err != nil {
		return fmt.Errorf("falha ao abrir arquivo de backup: %w", err)
	}
	defer backupFile.Close()

	// Usar a função Apply do selfupdate para restaurar o backup
	err = selfupdate.Apply(backupFile, selfupdate.Options{})
	if err != nil {
		return fmt.Errorf("falha no rollback: %w", err)
	}

	return nil
}

func (u *Updater) ListAvailableVersions() ([]string, error) {
	// Lista as versões de backup disponíveis
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
