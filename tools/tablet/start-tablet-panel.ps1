param(
  [string]$Adb = "C:\adb\adb.exe"
)

$ErrorActionPreference = "Continue"

& $Adb devices -l
& $Adb shell "mkdir -p /sdcard/AnatomiaTerminal"
& $Adb shell "dumpsys battery | grep -E 'level|status|temperature|USB powered' > /sdcard/AnatomiaTerminal/battery.txt && date '+%Y-%m-%d %H:%M:%S' > /sdcard/AnatomiaTerminal/battery-updated.txt"

# Keep the tablet useful as a visible output terminal while connected to USB.
& $Adb shell "svc power stayon usb"
& $Adb shell "settings put system screen_off_timeout 2147483647"

# Launch Termux; ~/.bashrc starts the status panel.
& $Adb shell "monkey -p com.termux 1"

Write-Host "Painel solicitado no tablet. Se a tela estiver bloqueada, desbloqueie uma vez."
