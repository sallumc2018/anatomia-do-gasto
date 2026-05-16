$ErrorActionPreference = "Stop"

$pidPath = "C:\Omega\tmp\omega-security-watch.pid"
if (-not (Test-Path -LiteralPath $pidPath)) {
  Write-Host "No PID file found at $pidPath"
  exit 0
}

$watchPid = (Get-Content -Path $pidPath -Raw -Encoding UTF8).Trim()
if ($watchPid.Length -eq 0) {
  Write-Host "PID file is empty."
  exit 0
}

$process = Get-Process -Id ([int]$watchPid) -ErrorAction SilentlyContinue
if ($null -eq $process) {
  Write-Host "Security watch process is not running: $watchPid"
  Remove-Item -LiteralPath $pidPath -Force
  exit 0
}

Stop-Process -Id $process.Id -Force
Remove-Item -LiteralPath $pidPath -Force
Write-Host "Stopped security watch process: $watchPid"
