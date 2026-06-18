Param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$BaseUrl = "http://localhost:3000",
  [int]$IntervalSeconds = 300
)

$ErrorActionPreference = "Stop"

$startupDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
$startupFile = Join-Path $startupDir "omega-anatomia-security-watch.cmd"
$startScript = Join-Path $Root "tools\security\start-security-watch.ps1"

if (-not (Test-Path -LiteralPath $startScript)) {
  throw "Start script not found: $startScript"
}

New-Item -ItemType Directory -Force -Path $startupDir | Out-Null

$content = @(
  "@echo off",
  "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$startScript`" -Root `"$Root`" -BaseUrl `"$BaseUrl`" -IntervalSeconds $IntervalSeconds"
) -join "`r`n"

Set-Content -Path $startupFile -Value $content -Encoding ASCII

Write-Host "Created startup launcher: $startupFile"
Write-Host "It will start the security watch at the next Windows login."
Write-Host "Status: C:\Omega\tmp\omega-security-status.txt"
Write-Host "Log: C:\Omega\tmp\omega-security-watch.log"
