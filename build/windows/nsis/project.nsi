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

; Improving installation experience
!define MUI_ABORTWARNING

; MUI2 modules
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"

; Installer pages - removed directory selection page
!insertmacro MUI_PAGE_WELCOME
!define MUI_COMPONENTSPAGE_SMALLDESC
!insertmacro MUI_PAGE_COMPONENTS
!define MUI_STARTMENUPAGE_REGISTRY_ROOT "HKLM"
!define MUI_STARTMENUPAGE_REGISTRY_KEY "${PRODUCT_UNINST_KEY}"
!define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "StartMenuFolder"
Var StartMenuFolder
!insertmacro MUI_PAGE_STARTMENU "Application" $StartMenuFolder
!insertmacro MUI_PAGE_INSTFILES

; Custom finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\updater.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Start ${PRODUCT_NAME} after installation"
!define MUI_FINISHPAGE_LINK "Visit ${PRODUCT_NAME} website"
!define MUI_FINISHPAGE_LINK_LOCATION "${PRODUCT_WEB_SITE}"
!insertmacro MUI_PAGE_FINISH

; Uninstallation pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Supported languages
!insertmacro MUI_LANGUAGE "English"

; Main settings
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "${PRODUCT_NAME}-Setup-${PRODUCT_VERSION}.exe"
; Changed installation directory to AppData/Local instead of Program Files
InstallDir "$LOCALAPPDATA\${PRODUCT_NAME}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show
!include ".\Plugins\nsProcess.nsh"

Function .onInit
  ; Check Windows version
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_ICONSTOP|MB_OK "This application requires Windows 10 or higher."
    Abort
  ${EndIf}

  ; Removed admin privileges check as it's not needed for AppData installation

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

  ; Start Menu shortcuts - always create them
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
  CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
  CreateShortcut "$SMPROGRAMS\$StartMenuFolder\${PRODUCT_NAME}.lnk" "$INSTDIR\updater.exe" "" "$INSTDIR\icon.ico" 0
  !insertmacro MUI_STARTMENU_WRITE_END

  ; Desktop shortcut - always create
  CreateShortcut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\updater.exe" "" "$INSTDIR\icon.ico" 0
SectionEnd

; Auto-start with Windows section (optional)
Section /o "Start with Windows" SecStartup
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}" '"$INSTDIR\updater.exe" --minimized'
SectionEnd

; Section descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCore} "Essential files for ${PRODUCT_NAME}. Required for the application to work."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecStartup} "Starts ${PRODUCT_NAME} automatically when Windows starts."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; Uninstallation section
Section "Uninstall"
  ; Start Menu folder reference
  !insertmacro MUI_STARTMENU_GETFOLDER Application $StartMenuFolder

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
  RMDir /r "$SMPROGRAMS\$StartMenuFolder"

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