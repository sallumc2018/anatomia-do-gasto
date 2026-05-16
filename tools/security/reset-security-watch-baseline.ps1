Param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$StatePath = "C:\Omega\tmp\omega-security-watch-state.json",
  [string]$Actor = "Codex",
  [string]$Reason = "Authorized baseline reset"
)

$ErrorActionPreference = "Stop"

$watchedFiles = @(
  "apps\web\package.json",
  "apps\web\package-lock.json",
  "apps\web\next.config.ts",
  "apps\web\lib\data.ts",
  "apps\web\app\api\dados\[...slug]\route.ts",
  "tools\security\check-npm-supply-chain.ps1",
  "tools\security\check-site-local.ps1",
  "tools\security\send-security-alert.ps1",
  "tools\security\write-pc-status.ps1",
  "tools\security\reset-security-watch-baseline.ps1",
  "tools\security\write-security-event.ps1"
)

$snapshot = [ordered]@{}
foreach ($relativePath in $watchedFiles) {
  $path = Join-Path $Root $relativePath
  if (Test-Path -LiteralPath $path) {
    $snapshot[$relativePath] = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
  } else {
    $snapshot[$relativePath] = "<missing>"
  }
}

$state = [ordered]@{
  updatedAt = (Get-Date).ToString("o")
  root = $Root
  watchedFiles = $snapshot
}

New-Item -ItemType Directory -Force -Path (Split-Path $StatePath) | Out-Null
$state | ConvertTo-Json -Depth 4 | Set-Content -Path $StatePath -Encoding UTF8

$eventScript = Join-Path $PSScriptRoot "write-security-event.ps1"
if (Test-Path -LiteralPath $eventScript) {
  & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" `
    -NoProfile `
    -ExecutionPolicy Bypass `
    -File $eventScript `
    -Class "AGENT_CHANGE" `
    -Actor $Actor `
    -Source "baseline" `
    -Reason $Reason `
    -Files ($watchedFiles -join "|") `
    -EventLogPath (Join-Path (Split-Path $StatePath) "omega-security-events.jsonl") | Out-Null
}

Write-Host "Security watch baseline reset: $StatePath"
