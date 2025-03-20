package app

import (
	"github.com/hex-boost/hex-nexus-app/backend/utils"
)

const (
	LogPrefixLeague   = "LOL"
	LogPrefixRiot     = "RIOT"
	LogPrefixWails    = "WLS"
	LogPrefixWeb      = "WEB"
	LogPrefixServices = "SEV"
)

type log struct {
	league   *utils.Logger
	riot     *utils.Logger
	wails    *utils.Logger
	web      *utils.Logger
	services *utils.Logger
}

func NewLogger() *log {
	return &log{
		league:   utils.NewLogger(LogPrefixLeague),
		riot:     utils.NewLogger(LogPrefixRiot),
		wails:    utils.NewLogger(LogPrefixWails),
		web:      utils.NewLogger(LogPrefixWeb),
		services: utils.NewLogger(LogPrefixServices),
	}
}

func (l *log) League() *utils.Logger {
	return l.league
}

func (l *log) Riot() *utils.Logger {
	return l.riot
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
