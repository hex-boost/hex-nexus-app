package config

import (
	"encoding/json"
	"fmt"
	"github.com/joho/godotenv"
	"log"
	"os"
)

var (
	Version        = "dev"
	LogLevel       = "info"
	BackendURL     = "http://127.0.0.1:1337"
	RefreshApiKey  = ""
	LeagueAuthType = "local"
	Debug          = ""
)

type Config struct {
	Version        string `json:"version"`
	RefreshApiKey  string `json:"refresh_api_key"`
	LeagueAuthType string `json:"auth_type"`
	BackendURL     string `json:"backendUrl"`
	Debug          bool   `json:"debug"`
	ModToolsPath   string `json:"modToolsPath"`

	LogsDirectory string `json:"logsDirectory"`

	LogLevel string `json:"logLevel"`
	Loki     struct {
		Enabled  bool   `json:"enabled"`
		Endpoint string `json:"endpoint"`
	} `json:"loki"`

	Tempo struct {
		Enabled  bool   `json:"enabled"`
		Endpoint string `json:"endpoint"`
	} `json:"tempo"`

	Prometheus struct {
		Enabled  bool   `json:"enabled"`
		Endpoint string `json:"endpoint"` // For remote_write if needed
	} `json:"prometheus"`
}

func LoadConfig() (*Config, error) {
	// Load .env file if exists
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file")
	}
	var isDebug bool
	Debug = getEnv("DEBUG", "false")
	if Debug == "true" {
		isDebug = true
	} else {
		isDebug = false
	}

	config := &Config{
		Version:        getEnv("VERSION", Version),
		RefreshApiKey:  getEnv("REFRESH_API_KEY", RefreshApiKey),
		LeagueAuthType: getEnv("LOGS_DIR", LeagueAuthType),
		BackendURL:     getEnv("API_URL", BackendURL),
		Debug:          getBoolEnv("DEBUG", isDebug),
		ModToolsPath:   getEnv("MOD_TOOLS_PATH", ""),
		LogsDirectory:  getEnv("LOGS_DIR", "./logs"),
		LogLevel:       getEnv("LOG_LEVEL", LogLevel),
		Loki: struct {
			Enabled  bool   `json:"enabled"`
			Endpoint string `json:"endpoint"`
		}(struct {
			Enabled  bool
			Endpoint string
		}{
			Enabled:  getEnv("LOKI_ENABLED", "true") == "true",
			Endpoint: getEnv("LOKI_ENDPOINT", "https://loki-production-893b.up.railway.app"),
		}),
		Tempo: struct {
			Enabled  bool   `json:"enabled"`
			Endpoint string `json:"endpoint"`
		}(struct {
			Enabled  bool
			Endpoint string
		}{
			Enabled:  getEnv("TEMPO_ENABLED", "true") == "true",
			Endpoint: getEnv("TEMPO_ENDPOINT", "https://tempo-production-a6ee.up.railway.app"),
		}),
		Prometheus: struct {
			Enabled  bool   `json:"enabled"`
			Endpoint string `json:"endpoint"`
		}(struct {
			Enabled  bool
			Endpoint string
		}{
			Enabled:  getEnv("PROMETHEUS_ENABLED", "true") == "true",
			Endpoint: getEnv("PROMETHEUS_ENDPOINT", "https://prometheus-production-e845.up.railway.app"),
		}),
	}

	// Try to load from config file if specified
	configFile := getEnv("CONFIG_FILE", "")
	if configFile != "" {
		if err := loadFromFile(configFile, config); err != nil {
			return nil, err
		}
	}
	if config == nil {
		fmt.Println("Nil config file being returned")
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

func loadFromFile(file string, config *Config) error {
	data, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, config)
}
