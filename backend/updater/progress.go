package updater

import (
	"fmt"
	"github.com/go-resty/resty/v2"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"time"
)

func (u *Updater) UpdateWithProgress() error {
	execPath, err := os.Executable()
	if err != nil {
		return err
	}
	tempFile, err := u.downloadNewVersionWithProgress()
	restartScript := u.createRestartScript(execPath, tempFile)
	cmd := exec.Command(restartScript)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow: true,
	}
	if err := cmd.Start(); err != nil {
		time.Sleep(3 * time.Second)
		return err
	}
	os.Exit(0)
	return nil
}

func (u *Updater) createRestartScript(execPath, tempFile string) string {
	var script string
	var scriptExt string
	if runtime.GOOS == "windows" {
		scriptExt = ".bat"
		script = fmt.Sprintf(`@echo off
		timeout /t 1 /nobreak > NUL
		copy /y "%s" "%s"
		start "" "%s"
		del "%s"
		`, tempFile, execPath, execPath, "%~f0")
	} else {
		scriptExt = ".sh"
		script = fmt.Sprintf(`#!/bin/sh
			sleep 1
			cp "%s" "%s"
			chmod +x "%s"
			"%s" &
			rm -- "$0"
			`, tempFile, execPath, execPath, execPath)
	}
	scriptPath := filepath.Join(os.TempDir(), "restart"+scriptExt)
	err := os.WriteFile(scriptPath, []byte(script), 0755)
	if err != nil {
		return ""
	}
	return scriptPath
}

func (u *Updater) downloadNewVersionWithProgress() (string, error) {
	strapiLatestVersionURL := fmt.Sprintf("%s/api/versions/latest", BackendURL)
	var response VersionResponse
	client := resty.New()
	resp, err := client.R().
		SetResult(&response).SetAuthToken("Bearer " + APIToken).
		Get(strapiLatestVersionURL)
	if err != nil {
		return "", err
	}
	if resp.IsError() {
		return "", fmt.Errorf("API returned status: %d", resp.StatusCode())
	}
	fileURL := response.LatestVersion.File.URL
	if fileURL == "" {
		return "", fmt.Errorf("no file URL found in response")
	}
	if !strings.HasPrefix(fileURL, "http") {
		fileURL = BackendURL + fileURL
	}
	tempFile := filepath.Join(os.TempDir(), "new_version"+filepath.Ext(os.Args[0]))
	resp, err = client.R().
		SetDoNotParseResponse(true).
		Get(fileURL)
	if err != nil {
		return "", err
	}
	binReader := resp.RawBody()
	defer binReader.Close()
	outFile, err := os.OpenFile(tempFile, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		return "", err
	}
	defer outFile.Close()
	_, err = io.Copy(outFile, binReader)
	if err != nil {
		return "", err
	}
	return tempFile, nil
}
