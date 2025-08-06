package app

import (
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
)

const (
	LogPrefixLeague   = "LOL"
	LogPrefixRepo     = "REPO"
	LogPrefixDiscord  = "DISC"
	LogPrefixStripe   = "STRIPE"
	LogPrefixRiot     = "RIOT"
	LogPrefixWails    = "WLS"
	LogPrefixWailsInternal    = "WLS-INTERNAL"
	LogPrefixWeb      = "WEB"
	LogPrefixServices = "SEV"
	LogPrefixProtocol = "PROTOCOL"
)

type log struct {
	league   *logger.Logger
	discord  *logger.Logger
	riot     *logger.Logger
	wails    *logger.Logger
	wailsInternal    *logger.Logger
	web      *logger.Logger
	repo     *logger.Logger
	services *logger.Logger
	stripe   *logger.Logger
	protocol *logger.Logger
}

func NewLogger(cfg *config.Config) *log {
	return &log{
		discord:  logger.New(LogPrefixDiscord, cfg),
		repo:     logger.New(LogPrefixRepo, cfg),
		league:   logger.New(LogPrefixLeague, cfg),
		riot:     logger.New(LogPrefixRiot, cfg),
		wails:    logger.New(LogPrefixWails, cfg),
		stripe:   logger.New(LogPrefixStripe, cfg),
		web:      logger.New(LogPrefixWeb, cfg),
		services: logger.New(LogPrefixServices, cfg),
		protocol: logger.New(LogPrefixProtocol, cfg),
		wailsInternal: logger.New(LogPrefixWailsInternal, cfg),
	}
}

func (l *log) Discord() *logger.Logger {
	return l.discord
}

func (l *log) League() *logger.Logger {
	return l.league
}

func (l *log) Stripe() *logger.Logger {
	return l.stripe
}

func (l *log) Repo() *logger.Logger {
	return l.repo
}

func (l *log) Riot() *logger.Logger {
	return l.riot
}

func (l *log) Wails() *logger.Logger {
	return l.wails
}

func (l *log) WailsInternal() *logger.Logger {
	return l.wailsInternal
}
func (l *log) Protocol() *logger.Logger {
	return l.protocol
}

func (l *log) Web() *logger.Logger {
	return l.web
}

func (l *log) Services() *logger.Logger {
	return l.services
}
