param(
  [string]$Adb = "",
  [string]$LogRoot = "C:\infra\logs\tablet",
  [string]$AdbHome = "C:\infra\android-adb-home"
)

$ErrorActionPreference = "Continue"

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDir = Join-Path $LogRoot "packages"
$Backup = Join-Path $BackupDir "tablet-packages-$Stamp.txt"

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
New-Item -ItemType Directory -Force $BackupDir | Out-Null

if (Test-Path $AdbHome) {
  $env:HOME = $AdbHome
  $env:USERPROFILE = $AdbHome
  $env:ANDROID_SDK_HOME = $AdbHome
}

$Packages = @(
  "com.google.android.youtube",
  "com.google.android.apps.youtube.music",
  "com.google.android.apps.youtube.kids",
  "com.google.android.apps.assistant",
  "com.android.chrome",
  "com.google.android.calendar",
  "com.google.android.gm",
  "com.google.android.apps.tachyon",
  "com.google.android.apps.maps",
  "com.google.android.apps.books",
  "com.google.android.videos",
  "com.google.android.apps.docs",
  "com.google.android.apps.photosgo",
  "com.google.android.apps.kids.home",
  "com.google.android.apps.adm",
  "com.google.android.apps.searchlite",
  "com.google.android.apps.mediahome.launcher",
  "com.google.android.vending",
  "com.google.android.feedback",
  "com.google.android.contacts",
  "com.google.android.apps.wellbeing",
  "com.google.android.tts",
  "com.google.android.marvin.talkback",
  "com.google.android.deskclock",
  "com.android.soundrecorder",
  "com.android.calculator2",
  "com.softwinner.camera",
  "com.softwinner.qrscanner",
  "com.softwinner.awlogsettings",
  "com.softwinner.awsysteminfo",
  "com.softwinner.timerswitch",
  "com.softwinner.screenshot",
  "com.softwinner.awmanager",
  "penseavanti.com.br.app2shop_multilaser",
  "br.com.multilaser.multifeedback",
  "br.com.multilaser.lsitec.sellout",
  "br.com.multilaser.lsitec.uai",
  "bnd.com",
  "com.clock.pt1.keeptesting"
)

& $Adb shell pm list packages | Set-Content -Encoding utf8 $Backup
Write-Host "Lista de pacotes salva em $Backup"

foreach ($Package in $Packages) {
  Write-Host "Removendo para user 0: $Package"
  & $Adb shell pm uninstall --user 0 $Package
}

Write-Host "Concluido. Para restaurar um pacote: adb shell cmd package install-existing <pacote>"
