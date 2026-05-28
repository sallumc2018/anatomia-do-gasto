param(
  [string]$Adb = "",
  [string]$AdbHome = "C:\Omega\03_Ferramentas\infra\android-adb-home"
)

$ErrorActionPreference = "Continue"

function Resolve-AdbPath {
  param([string]$Preferred)

  $candidates = @(
    $Preferred,
    "C:\Omega\Sistema\Ferramentas_WSL_e_Binarios\infra\adb\adb.exe",
    "C:\Omega\03_Ferramentas\infra\adb\adb.exe",
    "C:\Omega\03_Ferramentas\adb_root_legacy\adb.exe"
  ) | Where-Object { $_ }

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  throw "adb.exe nao encontrado. Informe -Adb ou mova o Android SDK para C:\Omega\03_Ferramentas\infra\adb."
}

$Adb = Resolve-AdbPath -Preferred $Adb

if (Test-Path $AdbHome) {
  New-Item -ItemType Directory -Force $AdbHome | Out-Null
  $env:HOME = $AdbHome
  $env:USERPROFILE = $AdbHome
  $env:ANDROID_SDK_HOME = $AdbHome
  $env:ANDROID_USER_HOME = $AdbHome
}

& $Adb kill-server | Out-Null
& $Adb devices -l
& $Adb shell "mkdir -p /sdcard/AnatomiaTerminal"
& $Adb shell "dumpsys battery | grep -E 'level|status|temperature|USB powered' > /sdcard/AnatomiaTerminal/battery.txt && date '+%Y-%m-%d %H:%M:%S' > /sdcard/AnatomiaTerminal/battery-updated.txt"

# Mirror current PC/watchdog status before opening the visible panel.
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$statusScript = Join-Path $repo "tools\tablet\update-tablet-status.ps1"
if (Test-Path -LiteralPath $statusScript) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $statusScript -Repo $repo -Adb $Adb -AdbHome $AdbHome
}

# Keep the tablet useful as a visible output terminal while connected to USB.
& $Adb shell "svc power stayon usb"
& $Adb shell "settings put system screen_off_timeout 2147483647"

# Launch Termux; ~/.bashrc starts the status panel.
& $Adb shell "monkey -p com.termux 1"

Write-Host "Painel solicitado no tablet. Se a tela estiver bloqueada, desbloqueie uma vez."
