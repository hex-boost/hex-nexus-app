package client

import (
	"fmt"

	"github.com/go-resty/resty/v2"
	"go.uber.org/zap"
)

type HTTPClient struct {
	*BaseClient
}

// NewHTTPClient creates a standard HTTP client
func NewHTTPClient(base *BaseClient) *HTTPClient {
	return &HTTPClient{
		BaseClient: base,
	}
}

// Get performs a GET request with typed result
func (a *HTTPClient) Get(endpoint string, result interface{}) (*resty.Response, error) {
	resp, err := a.Client.R().SetResult(result).Get(endpoint)
	if err != nil {
		a.Logger.Error("API request failed", zap.String("endpoint", endpoint), zap.Error(err))
		return resp, err
	}

	if resp.IsError() {
		a.Logger.Error("API returned error",
			zap.String("endpoint", endpoint),
			zap.Int("status", resp.StatusCode()),
			zap.String("response", resp.String()))
		return resp, fmt.Errorf("API error: %d - %s", resp.StatusCode(), resp.String())
	}

	return resp, nil
}

// Post performs a POST request with typed result
func (a *HTTPClient) Post(endpoint string, body interface{}, result interface{}) (*resty.Response, error) {
	resp, err := a.Client.R().SetBody(body).SetResult(result).Post(endpoint)
	if err != nil {
		a.Logger.Error("API request failed", zap.String("endpoint", endpoint), zap.Error(err))
		return resp, err
	}

	if resp.IsError() {
		a.Logger.Error("API returned error",
			zap.String("endpoint", endpoint),
			zap.Int("status", resp.StatusCode()),
			zap.String("response", resp.String()))
		return resp, fmt.Errorf("API error: %d - %s", resp.StatusCode(), resp.String())
	}

	return resp, nil
}

// Put performs a PUT request with typed result
func (a *HTTPClient) Put(endpoint string, body interface{}, result interface{}) (*resty.Response, error) {
	resp, err := a.Client.R().SetBody(body).SetResult(result).Put(endpoint)
	if err != nil {
		a.Logger.Error("API request failed", zap.String("endpoint", endpoint), zap.Error(err))
		return resp, err
	}

	if resp.IsError() {
		a.Logger.Error("API returned error",
			zap.String("endpoint", endpoint),
			zap.Int("status", resp.StatusCode()),
			zap.String("response", resp.String()))
		return resp, fmt.Errorf("API error: %d - %s", resp.StatusCode(), resp.String())
	}

	return resp, nil
}

// Delete performs a DELETE request with typed result
func (a *HTTPClient) Delete(endpoint string, result interface{}) (*resty.Response, error) {
	resp, err := a.Client.R().SetResult(result).Delete(endpoint)
	if err != nil {
		a.Logger.Error("API request failed", zap.String("endpoint", endpoint), zap.Error(err))
		return resp, err
	}

	if resp.IsError() {
		a.Logger.Error("API returned error",
			zap.String("endpoint", endpoint),
			zap.Int("status", resp.StatusCode()),
			zap.String("response", resp.String()))
		return resp, fmt.Errorf("API error: %d - %s", resp.StatusCode(), resp.String())
	}

	return resp, nil
}
