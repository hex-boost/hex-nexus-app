package app

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/hex-boost/hex-nexus-app/backend"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/pkg/browser"
	"html/template"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func renderTemplate(w http.ResponseWriter, tmplName string) error {
	// The path in the embedded filesystem includes the relative path
	tmplPath := filepath.Join("templates", tmplName)

	tmpl, err := template.ParseFS(backend.TemplatesFS, tmplPath)
	if err != nil {
		return err
	}
	return tmpl.Execute(w, nil)
}
func (a *app) StartDiscordOAuth() (map[string]interface{}, error) {
	port := 45986
	strapiAuthURL := fmt.Sprintf(
		os.Getenv("BACKEND_URL") + "/api/connect/discord",
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
			w.Header().Set("Content-Type", "text/html")
			if err := renderTemplate(w, "discord_auth_error.html"); err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte("Erro ao renderizar página de sucesso"))
				return
			}
			return
		}

		// Trocar código por JWT via Strapi
		jwt, userData, err := a.authenticateWithStrapiAndProcessAvatar(code)
		if err != nil {
			errChan <- fmt.Errorf("erro na autenticação com Strapi: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			if err := renderTemplate(w, "discord_auth_error.html"); err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte("Erro ao renderizar página de sucesso"))
				return
			}
			return
		}

		// Exibir página de sucesso
		w.Header().Set("Content-Type", "text/html")
		if err := renderTemplate(w, "discord_auth_success.html"); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Erro ao renderizar página de sucesso"))
			return
		}

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

func fetchUserInfo(url, accessToken string) (*types.DiscordUser, error) {
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

	var user types.DiscordUser
	if err := json.Unmarshal(resp.Body(), &user); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}
	return &user, nil
}

func (a *app) authenticateWithStrapi(code string) (string, map[string]interface{}, error) {
	resp, err := http.Get(fmt.Sprintf(os.Getenv("BACKEND_URL")+"/api/auth/discord/callback?access_token=%s", code))
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

func (a *app) HandleDiscordCallback(callback func(token string, err error)) {
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
		if err := renderTemplate(w, "discord_auth_success.html"); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Erro ao renderizar página de sucesso"))
			return
		}
		go func() {
			time.Sleep(2 * time.Second)
			srv.Shutdown(context.Background())
		}()

		callback(token, err)
	})

	go srv.ListenAndServe()
}

func (a *app) authenticateWithStrapiAndProcessAvatar(code string) (string, *types.User, error) {
	// Chamar endpoint do Strapi para autenticação
	resp, err := http.Get(fmt.Sprintf("http://localhost:1337/api/auth/discord/callback?access_token=%s", code))
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	var result struct {
		JWT  string     `json:"jwt"`
		User types.User `json:"user"`
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

func (a *app) uploadDiscordAvatar(accessToken string, userJwt string, id int) error {
	discordUser, err := fetchUserInfo("https://discord.com/api", accessToken)
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

func (a *app) generateAndStoreState() string {
	a.stateMutex.Lock()
	defer a.stateMutex.Unlock()

	b := make([]byte, 16)
	rand.Read(b)
	a.oauthState = hex.EncodeToString(b)
	return a.oauthState
}

// Obter e limpar o state (usado no callback)
func (a *app) getAndClearState() string {
	a.stateMutex.Lock()
	defer a.stateMutex.Unlock()

	state := a.oauthState
	a.oauthState = "" // Limpa após o uso
	return state
}
