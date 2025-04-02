package updater

import (
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/wailsapp/wails/v3/pkg/application"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

const UpdaterHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Nexus Updater</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #181818;
            color: #ffffff;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }
        .container {
            text-align: center;
            width: 80%;
        }
        .logo {
            margin-bottom: 20px;
        }
        .logo img {
            width: 120px;
            height: 120px;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .version-info {
            margin: 20px 0;
        }
        .progress-container {
            width: 100%;
            background-color: #2d2d2d;
            border-radius: 10px;
            padding: 3px;
            margin: 20px 0;
        }
        .progress-bar {
            height: 15px;
            background-color: #4e8df5;
            border-radius: 8px;
            width: 0%;
            transition: width 0.3s;
        }
        .status {
            margin-top: 10px;
            font-size: 14px;
            color: #acacac;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="https://nexus-back.up.railway.app/uploads/appicon128x128_780a0a5dcd.png" alt="Nexus Logo">
        </div>
        <h1>Nexus Update</h1>
        <div class="version-info">
            <p>Versão atual: <span id="currentVersion"></span></p>
            <p>Nova versão: <span id="newVersion"></span></p>
        </div>
        <div class="progress-container">
            <div class="progress-bar" id="progressBar"></div>
        </div>
        <div class="status" id="status">Verificando atualizações...</div>
    </div>

    <script>
        window.updateProgress = function(percent) {
            document.getElementById('progressBar').style.width = percent + '%';
        };
        
        window.updateStatus = function(status) {
            document.getElementById('status').innerText = status;
        };
        
        window.setVersionInfo = function(current, newVersion) {
            document.getElementById('currentVersion').innerText = current;
            document.getElementById('newVersion').innerText = newVersion;
        };
    </script>
</body>
</html>
`

func (u *Updater) ShowUpdateWindow(window *application.WebviewWindow) (*application.WebviewWindow, error) {
	// Verificar se há atualizações disponíveis
	response, err := u.CheckForUpdates()
	if err != nil {
		return nil, err
	}

	if !response.NeedsUpdate {
		return nil, nil // Não há atualizações disponíveis
	}
	window.Show()
	return window, nil
}

func (u *Updater) UpdateWithProgress(loadingWindow *application.WebviewWindow) error {
	// Exibir janela de atualização
	updateWindow, err := u.ShowUpdateWindow(loadingWindow)
	if err != nil {
		return err
	}
	if updateWindow == nil {
		return nil // Não há atualizações
	}

	// Caminho do executável atual
	execPath, err := os.Executable()
	if err != nil {
		updateWindow.ExecJS(`updateStatus("Erro ao localizar executável: ` + err.Error() + `")`)
		time.Sleep(3 * time.Second)
		return err
	}

	updateWindow.ExecJS(`updateStatus("Baixando nova versão...")`)
	updateWindow.ExecJS(`updateProgress(20)`)

	// Baixa a nova versão para um arquivo temporário
	tempFile, err := u.downloadNewVersionWithProgress(updateWindow)
	if err != nil {
		updateWindow.ExecJS(`updateStatus("Erro ao baixar atualização: ` + err.Error() + `")`)
		time.Sleep(3 * time.Second)
		return err
	}

	updateWindow.ExecJS(`updateStatus("Preparando para reiniciar...")`)
	updateWindow.ExecJS(`updateProgress(90)`)

	// Cria um arquivo de script para realizar a atualização
	restartScript := u.createRestartScript(execPath, tempFile)

	updateWindow.ExecJS(`updateStatus("Aplicando atualização e reiniciando...")`)
	updateWindow.ExecJS(`updateProgress(100)`)

	// Pequena pausa para que o usuário veja a mensagem final

	// Executa o script de reinicialização em um processo separado com a janela oculta
	cmd := exec.Command(restartScript)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow: true,
	}
	if err := cmd.Start(); err != nil {
		updateWindow.ExecJS(`updateStatus("Erro ao iniciar atualização: ` + err.Error() + `")`)
		time.Sleep(3 * time.Second)
		return err
	}
	// Encerra a aplicação atual para permitir a substituição do binário
	os.Exit(0)

	return nil
}

func (u *Updater) downloadNewVersionWithProgress(updateWindow *application.WebviewWindow) (string, error) {
	strapiLatestVersionURL := fmt.Sprintf("%s/api/versions/latest", BackendURL)

	var response VersionResponse
	client := resty.New()
	resp, err := client.R().
		SetResult(&response).SetAuthToken("Bearer " + APIToken).
		Get(strapiLatestVersionURL)
	if err != nil {
		return "", err
	}
	if resp.IsError() {
		return "", fmt.Errorf("API returned status: %d", resp.StatusCode())
	}

	updateWindow.ExecJS(`updateProgress(30)`)

	fileURL := response.LatestVersion.File.URL
	if fileURL == "" {
		return "", fmt.Errorf("no file URL found in response")
	}
	if !strings.HasPrefix(fileURL, "http") {
		fileURL = BackendURL + fileURL
	}

	// Cria um arquivo temporário para a nova versão
	tempFile := filepath.Join(os.TempDir(), "new_version"+filepath.Ext(os.Args[0]))

	updateWindow.ExecJS(`updateStatus("Baixando arquivo de atualização...")`)
	updateWindow.ExecJS(`updateProgress(40)`)

	// Baixa o arquivo para o temporário
	resp, err = client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		return "", err
	}

	updateWindow.ExecJS(`updateProgress(60)`)

	binReader := resp.RawBody()
	defer binReader.Close()

	outFile, err := os.OpenFile(tempFile, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		return "", err
	}
	defer outFile.Close()

	updateWindow.ExecJS(`updateStatus("Gravando arquivo de atualização...")`)
	updateWindow.ExecJS(`updateProgress(75)`)

	_, err = io.Copy(outFile, binReader)
	if err != nil {
		return "", err
	}

	updateWindow.ExecJS(`updateProgress(85)`)

	return tempFile, nil
}
