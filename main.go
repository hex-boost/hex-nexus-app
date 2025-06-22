package main

import (
	"embed"
	"github.com/hex-boost/hex-nexus-app/backend/wails"
)

//go:embed all:frontend/packages/main/dist
var assets embed.FS

//go:embed build/appicon16x16.png
var iconFS embed.FS

//go:embed backend/assets/mod-tools/mod-tools.exe
var modToolsExe embed.FS

//go:embed backend/assets/mod-tools/cslol-dll.dll
var csLolDLL embed.FS

//go:embed backend/assets/mod-tools/catalog.json
var catalog embed.FS

func main() {
	iconBytes16, _ := iconFS.ReadFile("build/appicon16x16.png")
	iconBytes256, _ := iconFS.ReadFile("build/appicon16x16.png")

	wails.RunWithRetry(assets, csLolDLL, modToolsExe, catalog, iconBytes16, iconBytes256, 2)
}
