package config

import (
	"encoding/json"
	"os"
	"time"

	"github.com/joho/godotenv"
)

var (
	Version    = "dev"
	BackendURL = "http://127.0.0.1:1337"
)

type Config struct {
	Version string `json:"version"`
	// API URLs
	BackendURL     string `json:"backendUrl"`
	RiotAPIBaseURL string `json:"riotApiBaseUrl"`

	// Timeouts and intervals
	RequestTimeout       time.Duration `json:"requestTimeout"`
	PollingInterval      time.Duration `json:"pollingInterval"`
	MonitorCheckInterval time.Duration `json:"monitorCheckInterval"`

	// Feature flags
	DebugMode   bool   `json:"debugMode"`
	Environment string `json:"environment"`

	// Credentials
	ClientID string `json:"clientId"`

	// Paths
	LogsDirectory string `json:"logsDirectory"`
	DataDirectory string `json:"dataDirectory"`

	// System settings
	CaptchaServerPort string `json:"captchaServerPort"`

	// Logging
	LogLevel string `json:"logLevel"`
}

func LoadConfig() (*Config, error) {
	// Load .env file if exists
	err := godotenv.Load()
	if err != nil {
		return nil, err
	}

	// Default configuration
	config := &Config{
		Version:           getEnv("VERSION", Version),
		BackendURL:        getEnv("API_URL", BackendURL),
		RiotAPIBaseURL:    getEnv("RIOT_API_URL", "https://127.0.0.1"),
		RequestTimeout:    getDurationEnv("REQUEST_TIMEOUT", 10*time.Second),
		DebugMode:         getBoolEnv("DEBUG_MODE", false),
		Environment:       getEnv("ENVIRONMENT", "development"),
		LogsDirectory:     getEnv("LOGS_DIR", "./logs"),
		DataDirectory:     getEnv("DATA_DIR", "./data"),
		CaptchaServerPort: getEnv("CAPTCHA_SERVER_PORT", "6969"),
		LogLevel:          getEnv("LOG_LEVEL", "info"),
	}

	// Try to load from config file if specified
	configFile := getEnv("CONFIG_FILE", "")
	if configFile != "" {
		if err := loadFromFile(configFile, config); err != nil {
			return nil, err
		}
	}

	return config, nil
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getBoolEnv(key string, defaultValue bool) bool {
	if value, exists := os.LookupEnv(key); exists {
		return value == "true" || value == "1"
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value, exists := os.LookupEnv(key); exists {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func loadFromFile(file string, config *Config) error {
	data, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, config)
}
