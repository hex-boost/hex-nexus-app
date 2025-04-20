package main

import (
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

// MockUpdaterWindow implementa a interface UpdaterUI
type MockUpdaterWindow struct {
	status   string
	progress int
}

func (m *MockUpdaterWindow) SetStatus(status string) {
	m.status = status
	fmt.Println("Status:", status)
}

func (m *MockUpdaterWindow) SetProgress(percent int) {
	m.progress = percent
	fmt.Println("Progresso:", percent)
}

func (m *MockUpdaterWindow) SetError(errorMsg string) {
	m.status = errorMsg
	fmt.Println("Erro:", errorMsg)
}

func (m *MockUpdaterWindow) Show() {
	// Não faz nada no mock
}

var executablePath string

func mockExecutable() (string, error) {
	return executablePath, nil
}

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
	originalExecFn := executableFn
	executableFn = mockExecutable
	defer func() { executableFn = originalExecFn }()

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

	// 3. Criar configuração de teste
	testConfig := &config.Config{
		Version:    "1.0.24",
		BackendURL: mockServer.URL,
	}

	// 4. Criar instância do gerenciador de atualização com mock UI
	mockUI := &MockUpdaterWindow{}
	updateManager := NewUpdateManager(mockUI, testConfig)

	// 5. Testar verificação de atualizações
	hasUpdate, newVersion := updateManager.CheckForUpdates()
	if !hasUpdate {
		t.Error("Falha ao detectar atualização disponível")
	}
	if newVersion != "1.0.25" {
		t.Errorf("Versão incorreta retornada: esperava 1.0.25, obteve %s", newVersion)
	}

	// 6. Testar download e instalação
	err = updateManager.DownloadAndInstallUpdate()
	if err != nil {
		t.Errorf("Erro durante download e instalação: %v", err)
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
	latestDir, err := getLatestAppDir()
	if err != nil {
		t.Errorf("Erro obtendo diretório mais recente: %v", err)
	}

	expectedPath, _ := filepath.Abs(newVersionDir)
	actualPath, _ := filepath.Abs(latestDir)
	if actualPath != expectedPath {
		t.Errorf("getLatestAppDir retornou diretório errado: esperava %s, obteve %s", expectedPath, actualPath)
	}
}
