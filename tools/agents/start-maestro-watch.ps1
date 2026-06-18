param(
  [string]$SourceLabel = "Antigravity/Gemini",
  [int]$IntervalSeconds = 5,
  [string]$MirrorPath = "C:\Omega\tmp\omega-worktree-watch.json"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$script = Join-Path $root "tools\agents\watch-worktree.py"

Start-Process -FilePath "python" `
  -ArgumentList @($script, "--baseline", "--interval", "$IntervalSeconds", "--source-label", $SourceLabel, "--mirror-path", $MirrorPath) `
  -WorkingDirectory $root `
  -WindowStyle Hidden

Write-Host "Maestro Watch iniciado em segundo plano."
Write-Host "Status: python tools\agents\watch-worktree.py --status"
Write-Host "Espelho do tablet: $MirrorPath"
Write-Host "Log local: .local\memory\agent-runs\worktree-watch.jsonl"
