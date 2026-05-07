param(
  [string]$Repo = "C:\projetos\anatomia-do-gasto",
  [string]$Work = "C:\tmp\anatomia-tablet",
  [string]$Zip = "C:\tmp\anatomia-do-gasto-publico.zip",
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
  $env:HOME = $AdbHome
  $env:USERPROFILE = $AdbHome
  $env:ANDROID_SDK_HOME = $AdbHome
}

New-Item -ItemType Directory -Force "$Work\projeto\data" | Out-Null
Remove-Item -Recurse -Force "$Work\projeto" -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$Work\projeto\data" | Out-Null

Copy-Item "$Repo\README.md" "$Work\projeto\"
Copy-Item "$Repo\AI_MASTER_PROMPT.md" "$Work\projeto\"
Copy-Item "$Repo\CODEX.md" "$Work\projeto\"
Copy-Item "$Repo\CLAUDE.md" "$Work\projeto\"
Copy-Item "$Repo\docs" "$Work\projeto\docs" -Recurse -Force
Copy-Item "$Repo\data\manifests" "$Work\projeto\data\manifests" -Recurse -Force
Copy-Item "$Repo\data\public" "$Work\projeto\data\public" -Recurse -Force

Compress-Archive -Path "$Work\projeto" -DestinationPath $Zip -Force

& $Adb shell "mkdir -p /sdcard/AnatomiaDrive/projeto /sdcard/AnatomiaDrive/backups /sdcard/AnatomiaDrive/inbox /sdcard/AnatomiaDrive/logs/status /sdcard/AnatomiaTerminal"
& $Adb shell "dumpsys battery | grep -E 'level|status|temperature|USB powered' > /sdcard/AnatomiaTerminal/battery.txt && date '+%Y-%m-%d %H:%M:%S' > /sdcard/AnatomiaTerminal/battery-updated.txt"

& $Adb push "$Work\projeto" "/sdcard/AnatomiaDrive/"
& $Adb push $Zip "/sdcard/AnatomiaDrive/backups/anatomia-do-gasto-publico.zip"

& $Adb shell "du -sh /sdcard/AnatomiaDrive/*; find /sdcard/AnatomiaDrive -maxdepth 3 -type f | head -50"
