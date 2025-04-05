package main

import (
	"embed"
	"github.com/hex-boost/hex-nexus-app/backend/wails"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon16x16.png
var iconFS embed.FS

func main() {
	iconBytes16, _ := iconFS.ReadFile("build/appicon16x16.png")
	iconBytes256, _ := iconFS.ReadFile("build/appicon16x16.png")
	wails.Run(assets, iconBytes16, iconBytes256)
}
