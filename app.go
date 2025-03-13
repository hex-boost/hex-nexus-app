package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/go-resty/resty/v2"

	"github.com/pkg/browser"
)

// App struct
type App struct {
	ctx        context.Context
	oauthState string
	stateMutex sync.Mutex //
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		oauthState: "",
		stateMutex: sync.Mutex{},
	}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
}

// domReady is called after front-end resources have been loaded
func (a *App) domReady(ctx context.Context) {
	fmt.Println("Domready")
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

func (a *App) StartDiscordOAuth() (map[string]interface{}, error) {
	port := 45986
	strapiAuthURL := fmt.Sprintf(
		"http://localhost:1337/api/connect/discord",
	)

	// Abrir o navegador com a URL de autenticação
	if err := browser.OpenURL(strapiAuthURL); err != nil {
		return nil, fmt.Errorf("erro ao abrir o navegador: %v", err)
	}

	// Criar um channel para receber o resultado da autenticação
	resultChan := make(chan map[string]interface{}, 1)
	errChan := make(chan error, 1)

	// Iniciar o servidor HTTP para receber o callback
	srv := &http.Server{Addr: fmt.Sprintf(":%d", port)}

	http.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		code := r.URL.Query().Get("access_token")
		if code == "" {
			errChan <- fmt.Errorf("código de autorização não recebido")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Falha na autenticação: código não recebido"))
			return
		}

		// Trocar código por JWT via Strapi
		jwt, userData, err := a.authenticateWithStrapiAndProcessAvatar(code)
		if err != nil {
			errChan <- fmt.Errorf("erro na autenticação com Strapi: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Falha na autenticação com o servidor"))
			return
		}

		// Exibir página de sucesso
		w.Header().Set("Content-Type", "text/html")
		html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <title>Autenticação Concluída</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: white;
            text-align: center;
        }

        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 90%%;
        }

        h1 {
            font-size: 2rem;
            margin-bottom: 1.5rem;
        }

        .close-btn {
            background: white;
            color: #6366f1;
            border: none;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .close-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }

        .close-btn:active {
            transform: translateY(0);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Autenticação Concluída!</h1>
        <p>Sua conexão foi estabelecida com sucesso.</p>
        <p style="margin-top: 1.5rem; opacity: 0.8; font-size: 0.9rem;">Você já pode fechar esta janela</p>
    </div>
</body>
</html>
`)
		w.Write([]byte(html))

		// Enviar resultado para o channel
		resultChan <- map[string]interface{}{
			"jwt":  jwt,
			"user": userData,
		}

		// Fechar o servidor após um breve delay
		go func() {
			time.Sleep(1 * time.Second)
			srv.Shutdown(context.Background())
		}()
	})

	// Iniciar o servidor em uma goroutine
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errChan <- fmt.Errorf("erro no servidor HTTP: %v", err)
		}
	}()

	// Aguardar pelo resultado ou erro
	select {
	case result := <-resultChan:
		return result, nil
	case err := <-errChan:
		return nil, err
	case <-time.After(2 * time.Minute):
		srv.Shutdown(context.Background())
		return nil, fmt.Errorf("tempo limite de autenticação excedido")
	}
}

type DiscordUser struct {
	ID                   string          `json:"id"`
	Username             string          `json:"username"`
	Discriminator        string          `json:"discriminator"`
	GlobalName           *string         `json:"global_name,omitempty"`
	Avatar               *string         `json:"avatar,omitempty"`
	Bot                  *bool           `json:"bot,omitempty"`
	System               *bool           `json:"system,omitempty"`
	MfaEnabled           *bool           `json:"mfa_enabled,omitempty"`
	Banner               *string         `json:"banner,omitempty"`
	AccentColor          *int            `json:"accent_color,omitempty"`
	Locale               *string         `json:"locale,omitempty"`
	Verified             *bool           `json:"verified,omitempty"`
	Email                *string         `json:"email,omitempty"`
	Flags                *int            `json:"flags,omitempty"`
	PremiumType          *int            `json:"premium_type,omitempty"`
	PublicFlags          *int            `json:"public_flags,omitempty"`
	AvatarDecorationData json.RawMessage `json:"avatar_decoration_data,omitempty"`
}

func fetchUserInfo(url, accessToken string) (*DiscordUser, error) {
	client := resty.New()

	resp, err := client.R().
		SetHeader("Authorization", "Bearer "+accessToken).
		Get(fmt.Sprintf("%s/users/@me", url))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user info: %v", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("failed to fetch Discord user info: status %d", resp.StatusCode())
	}

	var user DiscordUser
	if err := json.Unmarshal(resp.Body(), &user); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}
	return &user, nil
}

func (a *App) authenticateWithStrapi(code string) (string, map[string]interface{}, error) {
	resp, err := http.Get(fmt.Sprintf("http://localhost:1337/api/auth/discord/callback?access_token=%s", code))
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	var result struct {
		JWT  string                 `json:"jwt"`
		User map[string]interface{} `json:"user"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", nil, err
	}

	return result.JWT, result.User, nil
}

func (a *App) HandleDiscordCallback(callback func(token string, err error)) {
	srv := &http.Server{Addr: ":45986"}

	http.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		// Validar state token
		receivedState := r.URL.Query().Get("state")
		storedState := a.getAndClearState()

		if receivedState != storedState || storedState == "" {
			callback("", fmt.Errorf("invalid state token"))
			return
		}
		code := r.URL.Query().Get("access_token")

		// Trocar código por JWT via Strapi
		token, _, err := a.authenticateWithStrapi(code)

		w.Header().Set("Content-Type", "text/html")
		html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <title>Autenticação Concluída</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #6366f1 0%%, #a855f7 100%%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: white;
            text-align: center;
        }

        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 90%%;
        }

        h1 {
            font-size: 2rem;
            margin-bottom: 1.5rem;
        }

        .close-btn {
            background: white;
            color: #6366f1;
            border: none;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .close-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }

        .close-btn:active {
            transform: translateY(0);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Autenticação Concluída!</h1>
        <p>Sua conexão foi estabelecida com sucesso.</p>
        <button class="close-btn" onclick="window.close()">Fechar Janela</button>
        <p style="margin-top: 1.5rem; opacity: 0.8; font-size: 0.9rem;">Esta janela fechará automaticamente em alguns segundos...</p>
    </div>
</body>
</html>
`)

		w.Write([]byte(html))

		go func() {
			time.Sleep(2 * time.Second)
			srv.Shutdown(context.Background())
		}()

		callback(token, err)
	})

	go srv.ListenAndServe()
}

type User struct {
	Id          int         `json:"id"`
	DocumentId  string      `json:"documentId"`
	Username    string      `json:"username"`
	Email       string      `json:"email"`
	Provider    string      `json:"provider"`
	Confirmed   bool        `json:"confirmed"`
	Blocked     bool        `json:"blocked"`
	Hwid        interface{} `json:"hwid"`
	Discord     interface{} `json:"discord"`
	CreatedAt   time.Time   `json:"createdAt"`
	UpdatedAt   time.Time   `json:"updatedAt"`
	PublishedAt time.Time   `json:"publishedAt"`
}

func (a *App) authenticateWithStrapiAndProcessAvatar(code string) (string, *User, error) {
	// Chamar endpoint do Strapi para autenticação
	resp, err := http.Get(fmt.Sprintf("http://localhost:1337/api/auth/discord/callback?access_token=%s", code))
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	var result struct {
		JWT  string `json:"jwt"`
		User User   `json:"user"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", nil, err
	}

	// Processar e fazer upload do avatar do Discord
	if err := a.uploadDiscordAvatar(code, result.JWT, result.User.Id); err != nil {
		fmt.Printf("Erro ao processar avatar: %v\n", err)
	}

	return result.JWT, &result.User, nil
}

func (a *App) uploadDiscordAvatar(access_token string, userJwt string, id int) error {
	discordUser, err := fetchUserInfo("https://discord.com/api", access_token)
	if err != nil {
		return err
	}
	avatarUrl := fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%v.png", discordUser.ID, discordUser.Avatar)

	// Extrair o ID e o avatar hash do usuário Discord

	imgResp, err := http.Get(avatarUrl)
	if err != nil {
		return fmt.Errorf("erro ao baixar avatar: %v", err)
	}
	defer imgResp.Body.Close()

	if imgResp.StatusCode != http.StatusOK {
		return fmt.Errorf("falha ao obter imagem: %d", imgResp.StatusCode)
	}

	// Ler os dados da imagem
	imgData, err := io.ReadAll(imgResp.Body)
	if err != nil {
		return fmt.Errorf("erro ao ler dados da imagem: %v", err)
	}

	// Determinar o tipo de conteúdo
	contentType := imgResp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "image/png" // Padrão para Discord
	}
	extension := strings.Split(contentType, "/")[1]
	if extension == "" {
		extension = "png"
	}

	// Criar um buffer para o corpo multipart
	var requestBody bytes.Buffer
	multipartWriter := multipart.NewWriter(&requestBody)

	// Adicionar o arquivo ao corpo multipart
	part, err := multipartWriter.CreateFormFile("files", fmt.Sprintf("avatar-%s.%s", discordUser.ID, extension))
	if err != nil {
		return fmt.Errorf("erro ao criar multipart: %v", err)
	}
	if _, err = part.Write(imgData); err != nil {
		return fmt.Errorf("erro ao escrever dados da imagem: %v", err)
	}
	multipartWriter.Close()

	// Fazer o upload para o Strapi
	uploadReq, err := http.NewRequest("POST", "http://localhost:1337/upload", &requestBody)
	if err != nil {
		return fmt.Errorf("erro ao criar requisição de upload: %v", err)
	}

	uploadReq.Header.Set("Content-Type", multipartWriter.FormDataContentType())
	uploadReq.Header.Set("Authorization", "Bearer "+userJwt)

	client := &http.Client{}
	uploadResp, err := client.Do(uploadReq)
	if err != nil {
		return fmt.Errorf("erro ao enviar requisição de upload: %v", err)
	}
	defer uploadResp.Body.Close()

	if uploadResp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(uploadResp.Body)
		return fmt.Errorf("falha no upload: %d - %s", uploadResp.StatusCode, string(bodyBytes))
	}

	// Ler a resposta do upload
	var uploadResult []map[string]interface{}
	if err := json.NewDecoder(uploadResp.Body).Decode(&uploadResult); err != nil {
		return fmt.Errorf("erro ao decodificar resposta de upload: %v", err)
	}

	if len(uploadResult) == 0 {
		return fmt.Errorf("resposta de upload vazia")
	}

	// Atualizar o avatar do usuário
	avatarId, ok := uploadResult[0]["id"].(float64)
	if !ok {
		return fmt.Errorf("id do avatar não encontrado na resposta")
	}

	// Montando o corpo para atualização do usuário
	updateData := map[string]interface{}{
		"avatar": avatarId,
	}
	updateBody, err := json.Marshal(updateData)
	if err != nil {
		return fmt.Errorf("erro ao serializar dados de atualização: %v", err)
	}

	// Enviando a requisição para atualizar o usuário
	updateURL := fmt.Sprintf("http://localhost:1337/users/%d?populate=avatar", id)
	updateReq, err := http.NewRequest("PUT", updateURL, bytes.NewBuffer(updateBody))
	if err != nil {
		return fmt.Errorf("erro ao criar requisição de atualização: %v", err)
	}

	updateReq.Header.Set("Content-Type", "application/json")
	updateReq.Header.Set("Authorization", "Bearer "+userJwt)

	updateResp, err := client.Do(updateReq)
	if err != nil {
		return fmt.Errorf("erro ao enviar requisição de atualização: %v", err)
	}
	defer updateResp.Body.Close()

	if updateResp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(updateResp.Body)
		return fmt.Errorf("falha na atualização do usuário: %d - %s", updateResp.StatusCode, string(bodyBytes))
	}

	// Ler e atualizar dados do usuário
	var updatedUser map[string]interface{}
	if err := json.NewDecoder(updateResp.Body).Decode(&updatedUser); err != nil {
		return fmt.Errorf("erro ao decodificar resposta de atualização: %v", err)
	}

	return nil
}

// Função auxiliar para obter valores de string de mapas
func getStringValue(data map[string]interface{}, key string) (string, bool) {
	if val, ok := data[key]; ok {
		if strVal, ok := val.(string); ok {
			return strVal, true
		}
	}
	return "", false
}

func (a *App) generateAndStoreState() string {
	a.stateMutex.Lock()
	defer a.stateMutex.Unlock()

	b := make([]byte, 16)
	rand.Read(b)
	a.oauthState = hex.EncodeToString(b)
	return a.oauthState
}

// Obter e limpar o state (usado no callback)
func (a *App) getAndClearState() string {
	a.stateMutex.Lock()
	defer a.stateMutex.Unlock()

	state := a.oauthState
	a.oauthState = "" // Limpa após o uso
	return state
}
