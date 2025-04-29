package main

import (
	"embed"
	"fmt"
	"log"
	"strings"
	"time"

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

func RunWithRetry(assets, csLolDLL, modToolsExe, catalog embed.FS, icon16 []byte, icon256 []byte, maxRetries int) {
	retryCount := 0

	for retryCount <= maxRetries {
		func() {
			// Use defer-recover to catch panics
			defer func() {
				if r := recover(); r != nil {
					errorMsg := fmt.Sprint(r)

					// Check if this is the specific WebView2 error we're looking for
					if strings.Contains(errorMsg, "[WebView2 Error] The parameter is incorrect") {
						retryCount++
						if retryCount <= maxRetries {
							log.Printf("WebView2 initialization error detected. Retrying (%d/%d) after delay...\n",
								retryCount, maxRetries)
							time.Sleep(2 * time.Second) // Add a delay before retrying
						} else {
							log.Printf("Failed to start application after %d attempts. Giving up.\n", maxRetries)
							panic(fmt.Sprintf("Failed to start after %d retries: %v", maxRetries, errorMsg))
						}
					} else {
						// For other panics, just re-panic
						panic(r)
					}
				}
			}()

			// Call the original Run function
			wails.Run(assets, csLolDLL, modToolsExe, catalog, icon16, icon256)

			// If Run completes without panic, break out of the retry loop
			retryCount = maxRetries + 1
		}()
	}
}
func main() {
	iconBytes16, _ := iconFS.ReadFile("build/appicon16x16.png")
	iconBytes256, _ := iconFS.ReadFile("build/appicon16x16.png")

	RunWithRetry(assets, csLolDLL, modToolsExe, catalog, iconBytes16, iconBytes256, 2)
}
