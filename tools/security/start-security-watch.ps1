Param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$BaseUrl = "http://localhost:3000",
  [int]$IntervalSeconds = 300
)

$ErrorActionPreference = "Stop"

$watchScript = Join-Path $Root "tools\security\security-watch.ps1"
if (-not (Test-Path -LiteralPath $watchScript)) {
  throw "Security watch script not found: $watchScript"
}

$omegaTmp = "C:\Omega\tmp"
New-Item -ItemType Directory -Force -Path $omegaTmp | Out-Null
$pidPath = Join-Path $omegaTmp "omega-security-watch.pid"
if (Test-Path -LiteralPath $pidPath) {
  $existingPid = (Get-Content -Path $pidPath -Raw -Encoding UTF8).Trim()
  if ($existingPid.Length -gt 0) {
    $existingProcess = Get-Process -Id ([int]$existingPid) -ErrorAction SilentlyContinue
    if ($null -ne $existingProcess) {
      Write-Host "Security watch already running: $existingPid"
      Write-Host "Status: C:\Omega\tmp\omega-security-status.txt"
      Write-Host "Log: C:\Omega\tmp\omega-security-watch.log"
      exit 0
    }
  }
}

$powershell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$watchScript`" -Root `"$Root`" -BaseUrl `"$BaseUrl`" -IntervalSeconds $IntervalSeconds"

$process = Start-Process `
  -FilePath $powershell `
  -ArgumentList $arguments `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $pidPath -Value $process.Id -Encoding UTF8
Write-Host "Started security watch process: $($process.Id)"
Write-Host "Status: C:\Omega\tmp\omega-security-status.txt"
Write-Host "Log: C:\Omega\tmp\omega-security-watch.log"
