param(
  [string]$Adb = "C:\adb\adb.exe"
)

$ErrorActionPreference = "Continue"

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = "C:\tmp\tablet-packages-$Stamp.txt"

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
