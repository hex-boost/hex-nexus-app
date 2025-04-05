!addplugindir ".\Plugins"
; Unicode is recommended for better compatibility with special characters
Unicode True


!define SIGNTOOL "signtool.exe"
!define SIGNCMD '${SIGNTOOL} sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /a'

# Before creating the installer
!system '${SIGNCMD} "${ARG_WAILS_AMD64_BINARY}"'

# After creating the installer
!finalize '${SIGNCMD} "${OUTFILE}"'
!uninstfinalize

; Application settings
!define PRODUCT_NAME "Nexus"
!define PRODUCT_VERSION "1.0.12"
!define PRODUCT_PUBLISHER "Hex Inc."
!define PRODUCT_WEB_SITE "https://hexinc.com"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\Nexus.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

VIProductVersion "${PRODUCT_VERSION}.0"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileDescription" "${PRODUCT_NAME} Installer"
VIAddVersionKey "FileVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "LegalCopyright" "© ${PRODUCT_PUBLISHER}"

; Compression settings (LZMA is better for final size)
SetCompressor /SOLID lzma

; Installer icon
!define MUI_ICON "icon.ico"

; Custom background image (optional)
; !define MUI_WELCOMEFINISHPAGE_BITMAP "welcome.bmp"
; !define MUI_UNWELCOMEFINISHPAGE_BITMAP "welcome.bmp"

; Improving installation experience
!define MUI_ABORTWARNING

; MUI2 modules
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"

; Installer pages
!insertmacro MUI_PAGE_WELCOME
; !insertmacro MUI_PAGE_LICENSE "license.txt"
!define MUI_COMPONENTSPAGE_SMALLDESC
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!define MUI_STARTMENUPAGE_REGISTRY_ROOT "HKLM"
!define MUI_STARTMENUPAGE_REGISTRY_KEY "${PRODUCT_UNINST_KEY}"
!define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "StartMenuFolder"
Var StartMenuFolder
!insertmacro MUI_PAGE_STARTMENU "Application" $StartMenuFolder
!insertmacro MUI_PAGE_INSTFILES

; Custom finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\Nexus.exe"
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
; !insertmacro MUI_LANGUAGE "PortugueseBR"

; Main settings
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "${PRODUCT_NAME}-Setup-${PRODUCT_VERSION}.exe"
InstallDir "$PROGRAMFILES64\${PRODUCT_NAME}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show
!include ".\Plugins\nsProcess.nsh"

Function .onInit
  ; Verificar versão do Windows
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_ICONSTOP|MB_OK "This application requires Windows 10 or higher."
    Abort
  ${EndIf}

  ; Verificar privilégios de administrador
  UserInfo::GetAccountType
  Pop $0
  ${If} $0 != "admin"
    MessageBox MB_ICONSTOP|MB_OK "Administrator privileges are required to install this application."
    Abort
  ${EndIf}

  ; Verificar se o programa já está instalado
  ReadRegStr $R0 HKLM "${PRODUCT_UNINST_KEY}" "UninstallString"
  StrCmp $R0 "" done

  done:
    ${nsProcess::Unload}
FunctionEnd

; Main section (required)
Section "Core Files" SecCore
  SectionIn RO
  SetOutPath "$INSTDIR"

  ; Copy main file
  File "${ARG_WAILS_AMD64_BINARY}"
  File /nonfatal "MicrosoftEdgeWebview2Setup.exe"

  ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
    ${If} $0 == ""
      ReadRegStr $0 HKLM "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
    ${EndIf}

    ${If} $0 == ""
      ; WebView2 não está instalado, tentar instalá-lo
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
  ; Registry files
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\Nexus.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\Nexus.exe"
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

  ; Create Start Menu folder and shortcuts
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
  CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
  CreateShortcut "$SMPROGRAMS\$StartMenuFolder\${PRODUCT_NAME}.lnk" "$INSTDIR\Nexus.exe"
  !insertmacro MUI_STARTMENU_WRITE_END
SectionEnd

; Desktop shortcuts section (optional)
Section "Desktop Shortcut" SecDesktop
  CreateShortcut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\Nexus.exe"
SectionEnd

; Auto-start with Windows section (optional)
Section /o "Start with Windows" SecStartup
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}" '"$INSTDIR\Nexus.exe" --minimized'
SectionEnd

; WebView2 Runtime installation section



; Section descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCore} "Essential files for ${PRODUCT_NAME}. Required for the application to work."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "Adds a shortcut for ${PRODUCT_NAME} to the desktop."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecStartup} "Starts ${PRODUCT_NAME} automatically when Windows starts."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; Uninstallation section
Section "Uninstall"
  ; Start Menu folder reference
  !insertmacro MUI_STARTMENU_GETFOLDER Application $StartMenuFolder

  ; Remove program files
  Delete "$INSTDIR\Nexus.exe"
  Delete "$INSTDIR\WebView2Loader.dll"
  Delete "$INSTDIR\MicrosoftEdgeWebview2Setup.exe"
  Delete "$INSTDIR\uninstall.exe"

  ; Remove directories
  RMDir /r "$INSTDIR\assets"
  RMDir /r "$INSTDIR\docs"

  ; Remove shortcuts
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\$StartMenuFolder"

  ; Remove registry entries
  DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}"

  ; Remove program directory (if empty)
  RMDir "$INSTDIR"

  ; Show completion message
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) has been successfully uninstalled from your computer."
SectionEnd