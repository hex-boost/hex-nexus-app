package systemtray

import (
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/manager"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/zap"
)

type SystemTray struct {
	app     *application.App
	window  *application.WebviewWindow
	icon    []byte
	monitor *account.Monitor
	manager *manager.Manager
	logger  *logger.Logger
}

func New(window *application.WebviewWindow, icon []byte, monitor *account.Monitor, manager *manager.Manager, logger *logger.Logger) *SystemTray {
	return &SystemTray{
		app:     application.Get(),
		window:  window,
		icon:    icon,
		logger:  logger,
		monitor: monitor,
		manager: manager,
	}
}

func (s *SystemTray) Setup() *application.SystemTray {
	systray := s.app.NewSystemTray()
	menu := application.NewMenu()
	menu.Add("Nexus").SetBitmap(s.icon).SetEnabled(false)
	menu.AddSeparator()
	sairItem := menu.Add("Exit Nexus")
	sairItem.OnClick(func(ctx *application.Context) {
		s.logger.Info("[SystemTray] Exit Nexus clicked")

		isNexusAccount := s.monitor.IsNexusAccount()
		s.logger.Info("[SystemTray] IsNexusAccount check result", zap.Bool("isNexusAccount", isNexusAccount))

		if isNexusAccount {
			s.logger.Info("[SystemTray] Nexus account detected, showing confirmation dialog")
			s.logger.Info("[SystemTray] Window visibility before Show()", zap.Bool("isVisible", s.window.IsVisible()))

			s.window.Show()
			s.logger.Info("[SystemTray] Window visibility after Show()", zap.Bool("isVisible", s.window.IsVisible()))

			s.window.Focus()
			s.logger.Info("[SystemTray] Window Focus() called")

			s.logger.Info("[SystemTray] Emitting nexus:confirm-close event")
			s.window.EmitEvent("nexus:confirm-close")
			s.logger.Info("[SystemTray] nexus:confirm-close event emitted")
		} else {
			s.logger.Info("[SystemTray] Not a Nexus account, proceeding with direct quit")

			s.logger.Info("[SystemTray] Setting ForceClose flag to true")
			s.manager.SetForceClose(true)

			forceCloseValue := s.manager.ShouldForceClose()
			s.logger.Info("[SystemTray] ForceClose flag after setting", zap.Bool("forceClose", forceCloseValue))

			s.logger.Info("[SystemTray] Calling app.Quit()")
			s.app.Quit()
		}
	})
	systray.SetLabel("Nexus")
	systray.SetIcon(s.icon)
	systray.OnClick(func() {
		if !s.window.IsVisible() {
			s.window.Show()
			s.window.Focus()
		}
	})
	systray.SetDarkModeIcon(s.icon)
	systray.SetMenu(menu)
	return systray
}
