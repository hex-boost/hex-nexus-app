// backend/assets/assets.go
package assets

import (
	"embed"
)

//go:embed all:../../frontend/dist
var frontendAssets embed.FS

//go:embed ../../build/appicon16x16.png
var iconAsset []byte

// GetFrontendAssets returns the embedded frontend files
func GetFrontendAssets() embed.FS {
	return frontendAssets
}

// GetIcon16 returns the 16x16 application icon
func GetIcon16() []byte {
	return iconAsset
}

// GetIcon256 returns the 256x256 application icon (using same asset in this example)
func GetIcon256() []byte {
	return iconAsset
}
