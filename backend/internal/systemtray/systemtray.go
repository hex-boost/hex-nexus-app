package systemtray

import (
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/manager"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type SystemTray struct {
	app     *application.App
	window  *application.WebviewWindow
	icon    []byte
	monitor *account.Monitor
	manager *manager.Manager
}

func New(window *application.WebviewWindow, icon []byte, monitor *account.Monitor, manager *manager.Manager) *SystemTray {
	return &SystemTray{
		app:     application.Get(),
		window:  window,
		icon:    icon,
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
		if s.monitor.IsNexusAccount() {
			s.window.Show()
			s.window.Focus()
			s.window.EmitEvent("nexus:confirm-close")
		} else {
			s.manager.SetForceClose(true)
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
