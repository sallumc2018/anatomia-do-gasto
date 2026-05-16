Param(
  [string]$Repo = "C:\Omega\02_Repos\anatomia-do-gasto",
  [int]$IntervalSeconds = 30,
  [int]$RunTimeoutSeconds = 75
)

$ErrorActionPreference = "Stop"

$omegaTmp = "C:\Omega\tmp"
New-Item -ItemType Directory -Force -Path $omegaTmp | Out-Null

$pidPath = Join-Path $omegaTmp "omega-tablet-sync-loop.pid"
if (Test-Path -LiteralPath $pidPath) {
  $existingPid = (Get-Content -Path $pidPath -Raw -Encoding UTF8).Trim()
  if ($existingPid.Length -gt 0) {
    $existingProcess = Get-Process -Id ([int]$existingPid) -ErrorAction SilentlyContinue
    if ($null -ne $existingProcess) {
      Write-Host "Tablet sync loop already running: $existingPid"
      Write-Host "Log: C:\Omega\tmp\omega-tablet-sync-loop.log"
      exit 0
    }
  }
}

$loopScript = Join-Path $Repo "tools\tablet\tablet-status-sync-loop.ps1"
if (-not (Test-Path -LiteralPath $loopScript)) {
  throw "Tablet sync loop script not found: $loopScript"
}

$powershell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$loopScript`" -Repo `"$Repo`" -IntervalSeconds $IntervalSeconds -RunTimeoutSeconds $RunTimeoutSeconds"

$process = Start-Process `
  -FilePath $powershell `
  -ArgumentList $arguments `
  -WindowStyle Hidden `
  -PassThru

$tmpPidPath = "$pidPath.tmp"
Set-Content -Path $tmpPidPath -Value $process.Id -Encoding UTF8 -Force
Move-Item -LiteralPath $tmpPidPath -Destination $pidPath -Force
Write-Host "Started tablet sync loop process: $($process.Id)"
Write-Host "Log: C:\Omega\tmp\omega-tablet-sync-loop.log"
