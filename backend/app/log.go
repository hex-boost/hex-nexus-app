package app

import (
	"github.com/hex-boost/hex-nexus-app/backend/utils"
)

const (
	LogPrefixLeague   = "LOL"
	LogPrefixRepo     = "REPO"
	LogPrefixDiscord  = "DISC"
	LogPrefixRiot     = "RIOT"
	LogPrefixWails    = "WLS"
	LogPrefixWeb      = "WEB"
	LogPrefixServices = "SEV"
)

type log struct {
	league   *utils.Logger
	discord  *utils.Logger
	riot     *utils.Logger
	wails    *utils.Logger
	web      *utils.Logger
	repo     *utils.Logger
	services *utils.Logger
}

func NewLogger() *log {
	return &log{
		discord:  utils.NewLogger(LogPrefixDiscord),
		repo:     utils.NewLogger(LogPrefixRepo),
		league:   utils.NewLogger(LogPrefixLeague),
		riot:     utils.NewLogger(LogPrefixRiot),
		wails:    utils.NewLogger(LogPrefixWails),
		web:      utils.NewLogger(LogPrefixWeb),
		services: utils.NewLogger(LogPrefixServices),
	}
}

func (l *log) Discord() *utils.Logger {
	return l.discord
}
func (l *log) League() *utils.Logger {
	return l.league
}
func (l *log) Repo() *utils.Logger {
	return l.repo
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
