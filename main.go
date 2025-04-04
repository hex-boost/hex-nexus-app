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
	iconBytes, _ := iconFS.ReadFile("build/appicon16x16.png")
	wails.Run(assets, iconBytes)
}
