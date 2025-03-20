package app

import (
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"os"
)

const (
	LogPrefixWails    = "WLS"
	LogPrefixWeb      = "WEB"
	LogPrefixServices = "SEV"
)

type log struct {
	wails    *utils.Logger
	web      *utils.Logger
	services *utils.Logger
}

func NewConsoleLogger() *log {
	return &log{
		wails:    utils.NewConsoleLogger(LogPrefixWails),
		web:      utils.NewConsoleLogger(LogPrefixWeb),
		services: utils.NewConsoleLogger(LogPrefixServices),
	}
}

func NewFileLogger(logPath string) *log {
	logFile, err := os.OpenFile(
		logPath,
		os.O_CREATE|os.O_WRONLY|os.O_APPEND,
		0666,
	)
	if err != nil {
		utils.Utils().Panic("failed to open log file: " + err.Error())
	}
	return &log{
		wails:    utils.NewFileLogger(LogPrefixWails, logFile),
		web:      utils.NewFileLogger(LogPrefixWeb, logFile),
		services: utils.NewFileLogger(LogPrefixServices, logFile),
	}
}

func (l *log) Wails() *utils.Logger {
	return l.wails
}
func (l *log) Web() *utils.Logger {
	return l.web
}

func (l *log) Services() *utils.Logger {
	return l.services
}
