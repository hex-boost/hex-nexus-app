package main

import (
	"embed"
	"github.com/hex-boost/hex-nexus-app/backend/wails"
)

//go:embed all:frontend/dist
var assets embed.FS

// a
func main() {
	wails.Run(assets)
}
