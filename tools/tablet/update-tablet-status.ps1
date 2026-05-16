param(
  [string]$Repo = "C:\Omega\02_Repos\anatomia-do-gasto",
  [string]$Adb = "",
  [string]$AdbHome = "C:\Omega\03_Ferramentas\infra\android-adb-home",
  [string]$PcStatusRoot = (Join-Path $Repo ".local\state")
)

$ErrorActionPreference = "Stop"

function Resolve-AdbPath {
  param([string]$Preferred)

  $candidates = @(
    $Preferred,
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

function Set-AdbHome {
  param([string]$Path)

  New-Item -ItemType Directory -Force $Path | Out-Null
  $env:HOME = $Path
  $env:USERPROFILE = $Path
  $env:ANDROID_SDK_HOME = $Path
  $env:ANDROID_USER_HOME = $Path
}

$Adb = Resolve-AdbPath -Preferred $Adb
Set-AdbHome -Path $AdbHome

$pcStatusTxt = Join-Path $PcStatusRoot "omega-pc-status.txt"
$pcStatusJson = Join-Path $PcStatusRoot "omega-pc-status.json"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Repo "tools\security\write-pc-status.ps1") -Root $Repo -OutputPath $pcStatusTxt -JsonPath $pcStatusJson

& $Adb start-server | Out-Null
& $Adb shell "mkdir -p /sdcard/AnatomiaTerminal/security /sdcard/AnatomiaTerminal/pc"
& $Adb shell "dumpsys battery | grep -E 'level|status|temperature|USB powered' > /sdcard/AnatomiaTerminal/battery.txt && date '+%Y-%m-%d %H:%M:%S' > /sdcard/AnatomiaTerminal/battery-updated.txt"

$files = @(
  @{ Local = "C:\Omega\tmp\omega-security-status.txt"; Remote = "/sdcard/AnatomiaTerminal/security/security-status.txt" },
  @{ Local = "C:\Omega\tmp\omega-security-last-check.txt"; Remote = "/sdcard/AnatomiaTerminal/security/security-last-check.txt" },
  @{ Local = "C:\Omega\tmp\omega-security-watch.log"; Remote = "/sdcard/AnatomiaTerminal/security/security-watch.log" },
  @{ Local = "C:\Omega\tmp\omega-security-events.jsonl"; Remote = "/sdcard/AnatomiaTerminal/security/security-events.jsonl" },
  @{ Local = $pcStatusTxt; Remote = "/sdcard/AnatomiaTerminal/pc/pc-status.txt" },
  @{ Local = $pcStatusJson; Remote = "/sdcard/AnatomiaTerminal/pc/pc-status.json" }
)

foreach ($file in $files) {
  if (Test-Path -LiteralPath $file.Local) {
    & $Adb push $file.Local $file.Remote | Out-Null
  }
}

if (Test-Path -LiteralPath "C:\Omega\tmp\omega-security-alerts") {
  & $Adb push "C:\Omega\tmp\omega-security-alerts" "/sdcard/AnatomiaTerminal/security/" | Out-Null
}

if (Test-Path -LiteralPath "C:\Omega\tmp\omega-security-triggers") {
  & $Adb push "C:\Omega\tmp\omega-security-triggers" "/sdcard/AnatomiaTerminal/security/" | Out-Null
}

& $Adb shell "ls -lah /sdcard/AnatomiaTerminal /sdcard/AnatomiaTerminal/security /sdcard/AnatomiaTerminal/pc"
