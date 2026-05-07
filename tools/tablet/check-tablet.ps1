param(
  [string]$Adb = "",
  [string]$AdbHome = "C:\infra\android-adb-home"
)

$ErrorActionPreference = "Stop"

function Resolve-AdbPath {
  param([string]$Preferred)

  $candidates = @(
    $Preferred,
    "C:\infra\adb\adb.exe",
    "C:\adb\adb.exe"
  ) | Where-Object { $_ }

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  throw "adb.exe nao encontrado. Informe -Adb ou mova o Android SDK para C:\infra\adb."
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

Write-Host "== Dispositivo =="
& $Adb devices -l

Write-Host ""
Write-Host "== Bateria =="
& $Adb shell "dumpsys battery | grep -E 'level|status|temperature|USB powered'"

Write-Host ""
Write-Host "== Armazenamento =="
& $Adb shell "df -h /sdcard | tail -1"

Write-Host ""
Write-Host "== Estrutura do tablet =="
& $Adb shell "du -sh /sdcard/AnatomiaDrive/* 2>/dev/null || ls -lah /sdcard/AnatomiaDrive"

Write-Host ""
Write-Host "== Painel =="
& $Adb shell "ls -lah /sdcard/AnatomiaTerminal && tail -20 /sdcard/AnatomiaTerminal/battery.txt 2>/dev/null || true"
