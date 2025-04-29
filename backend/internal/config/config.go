package config

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
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
}

func LoadConfig() (*Config, error) {
	// Load .env file if exists
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file")
	}
	var isDebug bool
	if Debug == "true" {
		isDebug = true
	} else {
		isDebug = false
	}

	config := &Config{
		ModToolsPath:   getEnv("MOD_TOOLS_PATH", ""),
		Version:        getEnv("VERSION", Version),
		RefreshApiKey:  getEnv("REFRESH_API_KEY", RefreshApiKey),
		BackendURL:     getEnv("API_URL", BackendURL),
		Debug:          getBoolEnv("DEBUG", isDebug),
		LogsDirectory:  getEnv("LOGS_DIR", "./logs"),
		LeagueAuthType: getEnv("LOGS_DIR", LeagueAuthType),
		LogLevel:       getEnv("LOG_LEVEL", LogLevel),
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
