package manager

import (
	"fmt"
	updaterUtils "github.com/hex-boost/hex-nexus-app/backend/cmd/updater/utils"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/testutils"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	loggerUtils "github.com/hex-boost/hex-nexus-app/backend/utils"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

var executablePath string

func mockExecutable() (string, error) {
	return executablePath, nil
}

// withEnvironment define temporariamente variáveis de ambiente para testes

// TestUpdateProcess testa o fluxo completo de atualização
func TestUpdateProcess(t *testing.T) {
	// 1. Configurar ambiente de teste
	testDir := t.TempDir()

	// Criar estrutura correta de diretórios
	// Primeiro, criamos um diretório que simula o diretório de instalação base
	baseDir := filepath.Join(testDir, "nexus")
	err := os.MkdirAll(baseDir, 0755)
	if err != nil {
		t.Fatalf("Erro criando diretório base: %v", err)
	}

	// Criar diretório para versão antiga (1.0.24)
	oldVersionDir := filepath.Join(baseDir, "app-1.0.24")
	err = os.MkdirAll(oldVersionDir, 0755)
	if err != nil {
		t.Fatalf("Erro criando diretório da versão antiga: %v", err)
	}

	// Criar o executável do updater (simulando onde o updater está sendo executado)
	updaterPath := filepath.Join(baseDir, "updater.exe")
	err = os.WriteFile(updaterPath, []byte("updater falso"), 0755)
	if err != nil {
		t.Fatalf("Erro criando executável do updater: %v", err)
	}

	// Criar um arquivo executável falso para a aplicação
	oldExePath := filepath.Join(oldVersionDir, "Nexus.exe")
	err = os.WriteFile(oldExePath, []byte("executável falso 1.0.24"), 0755)
	if err != nil {
		t.Fatalf("Erro criando executável falso: %v", err)
	}

	// Configurar o mock para retornar o caminho do updater, não da aplicação
	// Isso simula o updater sendo executado do diretório base
	executablePath = updaterPath
	originalExecFn := updaterUtils.ExecutableFn
	updaterUtils.ExecutableFn = mockExecutable
	defer func() { updaterUtils.ExecutableFn = originalExecFn }()

	// 2. Criar servidor HTTP mock para simular o backend
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/versions/update":
			clientVersion := r.Header.Get("x-client-version")

			if clientVersion == "1.0.24" {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"needsUpdate": true, "version": "1.0.25"}`))
			} else {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"needsUpdate": false, "version": "1.0.25"}`))
			}

		case "/api/versions/latest":
			w.WriteHeader(http.StatusOK)
			downloadURL := fmt.Sprintf("/download/nexus.exe")
			responseJSON := fmt.Sprintf(`{"latestVersion": {"version": "1.0.25", "file": {"url": "%s"}}}`, downloadURL)
			w.Write([]byte(responseJSON))

		case "/download/nexus.exe":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("executável falso 1.0.25"))

		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer mockServer.Close()

	testutils.WithEnvironment(map[string]string{
		"VERSION": "1.0.24",
		"API_URL": mockServer.URL,
	}, func() {
		testConfig, err := config.LoadConfig()
		if err != nil {
			t.Fatalf("Erro carregando config: %v", err)
		}

		// Agora testConfig terá os valores que você definiu
		logger := loggerUtils.NewLogger("test", testConfig)
		utils := utils.NewUtils()
		updaterUtils := updaterUtils.New(logger, utils)
		updateManager := NewUpdateManager(testConfig, updaterUtils, logger, utils)
		hasUpdate, newVersion := updateManager.CheckForUpdates()
		if !hasUpdate {
			t.Error("Falha ao detectar atualização disponível")
		}
		if newVersion != "1.0.25" {
			t.Errorf("Versão incorreta retornada: esperava 1.0.25, obteve %s", newVersion)
		}

		downloadPath, version, err := updateManager.DownloadUpdate()
		if err != nil {
			t.Errorf("Erro durante download: %v", err)
			return
		}

		// Install the downloaded update
		err = updateManager.InstallUpdate(downloadPath, version)
		if err != nil {
			t.Errorf("Erro durante instalação: %v", err)
		}

		// 7. Verificar se o diretório da nova versão foi criado
		newVersionDir := filepath.Join(baseDir, "app-1.0.25")

		// Dar tempo para a operação de arquivo completar
		time.Sleep(100 * time.Millisecond)

		// Verificar se o diretório existe
		if _, err := os.Stat(newVersionDir); os.IsNotExist(err) {
			t.Error("Diretório da nova versão não foi criado")
		}

		// 8. Verificar se o novo executável foi baixado corretamente
		newExePath := filepath.Join(newVersionDir, "Nexus.exe")
		if _, err := os.Stat(newExePath); os.IsNotExist(err) {
			t.Error("Novo executável não foi criado")
		}

		// Verificar conteúdo do arquivo
		content, err := os.ReadFile(newExePath)
		if err != nil {
			t.Errorf("Erro lendo novo executável: %v", err)
		}
		if string(content) != "executável falso 1.0.25" {
			t.Error("Conteúdo do novo executável está incorreto")
		}

		// 9. Testar getLatestAppDir
		latestDir, err := updaterUtils.GetLatestAppDir()
		if err != nil {
			t.Errorf("Erro obtendo diretório mais recente: %v", err)
		}

		expectedPath, _ := filepath.Abs(newVersionDir)
		actualPath, _ := filepath.Abs(latestDir)
		if actualPath != expectedPath {
			t.Errorf("getLatestAppDir retornou diretório errado: esperava %s, obteve %s", expectedPath, actualPath)
		}
	})

	// 4. Criar instância do gerenciador de atualização com mock UI
}
