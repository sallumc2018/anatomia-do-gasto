Param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$TaskName = "Omega Anatomia Security Watch",
  [string]$BaseUrl = "http://localhost:3000",
  [int]$IntervalSeconds = 300
)

$ErrorActionPreference = "Stop"

$watchScript = Join-Path $Root "tools\security\security-watch.ps1"
if (-not (Test-Path -LiteralPath $watchScript)) {
  throw "Security watch script not found: $watchScript"
}

$powershell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$watchScript`" -Root `"$Root`" -BaseUrl `"$BaseUrl`" -IntervalSeconds $IntervalSeconds"

$action = New-ScheduledTaskAction -Execute $powershell -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Days 30) `
  -MultipleInstances IgnoreNew `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Local read-only security watchdog for Anatomia do Gasto." `
  -Force | Out-Null

Write-Host "Registered scheduled task: $TaskName"
Write-Host "It starts at Windows logon and runs: $watchScript"
Write-Host "Status: C:\Omega\tmp\omega-security-status.txt"
Write-Host "Log: C:\Omega\tmp\omega-security-watch.log"
