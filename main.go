package main

import (
	"embed"
	"github.com/hex-boost/hex-nexus-app/backend/wails"
)

var assets embed.FS

var iconFS embed.FS

func main() {
	iconBytes, _ := iconFS.ReadFile("build/appicon16x16.png")
	wails.Startup()
	wails.Run(assets, iconBytes)
}
