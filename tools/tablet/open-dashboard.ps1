param(
  [string]$Adb = "",
  [string]$AdbHome = "C:\Omega\03_Ferramentas\infra\android-adb-home",
  [string]$Url = "http://192.168.15.6:8765"
)

$ErrorActionPreference = "Stop"

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

if ($Url -notmatch '^https?://[A-Za-z0-9._~:/?#\[\]@!$&''()*+,;=%-]+$') {
  throw "URL invalida para abrir no tablet: $Url"
}

New-Item -ItemType Directory -Force $AdbHome | Out-Null
$env:HOME = $AdbHome
$env:USERPROFILE = $AdbHome
$env:ANDROID_SDK_HOME = $AdbHome
$env:ANDROID_USER_HOME = $AdbHome

& $Adb devices -l | Out-Null
& $Adb shell "am start -a android.intent.action.VIEW -d $Url org.mozilla.fennec_fdroid"
& $Adb shell "dumpsys activity activities | grep -E 'ResumedActivity|mCurrentFocus|org.mozilla.fennec_fdroid|com.termux'" 
