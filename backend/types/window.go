package types

import (
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

type WebviewWindower interface {
	OnWindowEvent(eventType events.WindowEventType, callback func(event *application.WindowEvent)) func()
	Reload()
	Show() application.Window
	Focus()
	Hide() application.Window
	RegisterHook(eventType events.WindowEventType, callback func(event *application.WindowEvent)) func()
}
