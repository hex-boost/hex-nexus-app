!addplugindir ".\Plugins"
Unicode True

; Get version from command line or use a default
!ifndef VERSION
  !define PRODUCT_VERSION "1.0.0"  ; Fallback version
!else
  !define PRODUCT_VERSION "${VERSION}"
!endif
; Application settings
!define PRODUCT_NAME "Nexus"
!define PRODUCT_PUBLISHER "Hex Inc."
!define PRODUCT_WEB_SITE " https://elojobhex.com/"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\updater.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

VIProductVersion "${PRODUCT_VERSION}.0"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileDescription" "${PRODUCT_NAME} Installer"
VIAddVersionKey "FileVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "LegalCopyright" "© ${PRODUCT_PUBLISHER}"

; Compression settings
SetCompressor /SOLID lzma

; Installer icon
!define MUI_ICON "icon.ico"

; Include necessary headers first
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"
!include ".\Plugins\nsProcess.nsh"

; Replace the UI pages section with just the installation page
!define MUI_INSTFILESPAGE_COLORS "FFFFFF 000000" ; Optional: customize colors (text/background)
!define MUI_INSTFILESPAGE_PROGRESSBAR "colored"  ; Use colored progress bar
!insertmacro MUI_PAGE_INSTFILES  ; Only include installation page

; Uninstallation pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Supported languages
!insertmacro MUI_LANGUAGE "English"

; Main settings
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "${PRODUCT_NAME}-Setup-${PRODUCT_VERSION}.exe"
; Installation directory in AppData/Local
InstallDir "$LOCALAPPDATA\${PRODUCT_NAME}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

Function .onInit
  ; Check Windows version
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_ICONSTOP|MB_OK "This application requires Windows 10 or higher."
    Abort
  ${EndIf}

  ; Check if program is already installed
  ReadRegStr $R0 HKLM "${PRODUCT_UNINST_KEY}" "UninstallString"
  StrCmp $R0 "" done

  done:
    ${nsProcess::Unload}

FunctionEnd

; Main section (required)
Section "Core Files" SecCore
  SectionIn RO
  SetOutPath "$INSTDIR"

  ; Copy updater to main directory
  File "..\..\..\bin\updater.exe"
  File /nonfatal "MicrosoftEdgeWebview2Setup.exe"
  File "icon.ico"
  CreateDirectory "$INSTDIR\app-${PRODUCT_VERSION}"
  SetOutPath "$INSTDIR\app-${PRODUCT_VERSION}"
  File "${ARG_WAILS_AMD64_BINARY}"

  ; Return to main directory for rest of installation
  SetOutPath "$INSTDIR"

  ; Install WebView2 if needed
  ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${If} $0 == ""
    ReadRegStr $0 HKLM "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${EndIf}

  ${If} $0 == ""
    ; WebView2 not installed
    IfFileExists "$INSTDIR\MicrosoftEdgeWebview2Setup.exe" 0 webview_not_found
      DetailPrint "Installing Microsoft Edge WebView2 Runtime..."
      ExecWait '"$INSTDIR\MicrosoftEdgeWebview2Setup.exe" /install /silent' $1
      ${If} $1 != 0
        DetailPrint "WebView2 installation may have failed with code: $1 (non-critical)"
      ${Else}
        DetailPrint "WebView2 installation completed successfully"
      ${EndIf}
      Goto webview_done
    webview_not_found:
      DetailPrint "Microsoft Edge WebView2 Setup not found, skipping installation"
    webview_done:
  ${Else}
    DetailPrint "Microsoft Edge WebView2 Runtime is already installed (version: $0)"
  ${EndIf}

  ; Registry entries - point to updater, not main app
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\updater.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\updater.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "NoModify" "1"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "NoRepair" "1"

  ; Save application size for Control Panel display
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "EstimatedSize" "$0"

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Create Start Menu folder and shortcut with just "Nexus" as the folder name
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\updater.exe" "" "$INSTDIR\icon.ico" 0

  ; Create Desktop shortcut
  CreateShortcut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\updater.exe" "" "$INSTDIR\icon.ico" 0

  ; Enable auto-start with Windows
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}" '"$INSTDIR\updater.exe" --minimized'

  ; Auto-launch the application when installation completes
  Exec '"$INSTDIR\updater.exe"'
SectionEnd

; Uninstallation section
Section "Uninstall"
  ; Remove updater and other files
  Delete "$INSTDIR\updater.exe"
  Delete "$INSTDIR\WebView2Loader.dll"
  Delete "$INSTDIR\MicrosoftEdgeWebview2Setup.exe"
  Delete "$INSTDIR\icon.ico"
  RMDir /r "$INSTDIR\app-*"
  Delete "$INSTDIR\*.log"
  RMDir /r "$INSTDIR\logs"
  Delete "$INSTDIR\uninstall.exe"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${PRODUCT_NAME}"

  ; Remove registry entries
  DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}"

  ; Remove program directory
  RMDir "$INSTDIR"

  ; Show completion message
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) has been successfully uninstalled from your computer."
  ${nsProcess::Unload}
SectionEnd
