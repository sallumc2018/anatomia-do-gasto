param(
  [string]$Adb = "",
  [string]$AdbHome = "C:\infra\android-adb-home",
  [string]$Url = "http://192.168.15.6:8765"
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

New-Item -ItemType Directory -Force $AdbHome | Out-Null
$env:HOME = $AdbHome
$env:USERPROFILE = $AdbHome
$env:ANDROID_SDK_HOME = $AdbHome
$env:ANDROID_USER_HOME = $AdbHome

& $Adb devices -l | Out-Null
& $Adb shell "am start -a android.intent.action.VIEW -d $Url org.mozilla.fennec_fdroid"
& $Adb shell "dumpsys activity activities | grep -E 'ResumedActivity|mCurrentFocus|org.mozilla.fennec_fdroid|com.termux'" 
