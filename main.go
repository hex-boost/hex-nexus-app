package main

import (
	"embed"
	"fmt"
	"github.com/hex-boost/hex-nexus-app/backend/wails"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon16x16.png
var iconFS embed.FS

func main() {
	iconBytes, _ := iconFS.ReadFile("build/appicon16x16.png")
	fmt.Println("a")
	wails.Run(assets, iconBytes)
}
