package app

import (
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
)

const (
	LogPrefixLeague   = "LOL"
	LogPrefixRepo     = "REPO"
	LogPrefixDiscord  = "DISC"
	LogPrefixStripe   = "STRIPE"
	LogPrefixRiot     = "RIOT"
	LogPrefixWails    = "WLS"
	LogPrefixWeb      = "WEB"
	LogPrefixServices = "SEV"
	LogPrefixProtocol = "PROTOCOL"
)

type log struct {
	league   *utils.Logger
	discord  *utils.Logger
	riot     *utils.Logger
	wails    *utils.Logger
	web      *utils.Logger
	repo     *utils.Logger
	services *utils.Logger
	stripe   *utils.Logger
	protocol *utils.Logger
}

func NewLogger(cfg *config.Config) *log {
	return &log{
		discord:  utils.NewLogger(LogPrefixDiscord, cfg),
		repo:     utils.NewLogger(LogPrefixRepo, cfg),
		league:   utils.NewLogger(LogPrefixLeague, cfg),
		riot:     utils.NewLogger(LogPrefixRiot, cfg),
		wails:    utils.NewLogger(LogPrefixWails, cfg),
		stripe:   utils.NewLogger(LogPrefixStripe, cfg),
		web:      utils.NewLogger(LogPrefixWeb, cfg),
		services: utils.NewLogger(LogPrefixServices, cfg),
		protocol: utils.NewLogger(LogPrefixProtocol, cfg),
	}
}

func (l *log) Discord() *utils.Logger {
	return l.discord
}
func (l *log) League() *utils.Logger {
	return l.league
}

func (l *log) Stripe() *utils.Logger {
	return l.stripe
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

func (l *log) Protocol() *utils.Logger {
	return l.protocol
}
func (l *log) Web() *utils.Logger {
	return l.web
}

func (l *log) Services() *utils.Logger {
	return l.services
}
