package systemtray

import (
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/manager"
	"github.com/wailsapp/wails/v3/pkg/application"
	"log"
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
		log.Println("[SystemTray] Exit Nexus clicked")

		isNexusAccount := s.monitor.IsNexusAccount()
		log.Printf("[SystemTray] IsNexusAccount check result: %v", isNexusAccount)

		if isNexusAccount {
			log.Println("[SystemTray] Nexus account detected, showing confirmation dialog")
			log.Printf("[SystemTray] Window visibility before Show(): %v", s.window.IsVisible())

			s.window.Show()
			log.Printf("[SystemTray] Window visibility after Show(): %v", s.window.IsVisible())

			s.window.Focus()
			log.Println("[SystemTray] Window Focus() called")

			log.Println("[SystemTray] Emitting nexus:confirm-close event")
			s.window.EmitEvent("nexus:confirm-close")
			log.Println("[SystemTray] nexus:confirm-close event emitted")
		} else {
			log.Println("[SystemTray] Not a Nexus account, proceeding with direct quit")

			log.Println("[SystemTray] Setting ForceClose flag to true")
			s.manager.SetForceClose(true)

			forceCloseValue := s.manager.ShouldForceClose()
			log.Printf("[SystemTray] ForceClose flag after setting: %v", forceCloseValue)

			log.Println("[SystemTray] Calling app.Quit()")
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
