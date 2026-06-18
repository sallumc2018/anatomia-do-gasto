Param(
  [string]$Repo = "C:\Omega\02_Repos\anatomia-do-gasto",
  [int]$IntervalSeconds = 30,
  [int]$RunTimeoutSeconds = 75,
  [string]$LogPath = "C:\Omega\tmp\omega-tablet-sync-loop.log"
)

$ErrorActionPreference = "Continue"

function Write-LoopLog {
  param([string]$Message)
  New-Item -ItemType Directory -Force -Path (Split-Path $LogPath) | Out-Null
  Add-Content -Path $LogPath -Encoding UTF8 -Value "$(Get-Date -Format "yyyy-MM-dd HH:mm:ss") $Message"
}

$script = Join-Path $Repo "tools\tablet\update-tablet-status-ssh.ps1"
if (-not (Test-Path -LiteralPath $script)) {
  throw "Tablet update script not found: $script"
}

$powershell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
Write-LoopLog "sync loop started; interval=${IntervalSeconds}s timeout=${RunTimeoutSeconds}s"

while ($true) {
  $started = Get-Date
  $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -Repo `"$Repo`""
  $stdout = "C:\Omega\tmp\omega-tablet-sync-child.out"
  $stderr = "C:\Omega\tmp\omega-tablet-sync-child.err"
  Remove-Item -LiteralPath $stdout, $stderr -Force -ErrorAction SilentlyContinue
  $process = Start-Process -FilePath $powershell -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
  Write-LoopLog "cycle started pid=$($process.Id)"

  if (-not $process.WaitForExit($RunTimeoutSeconds * 1000)) {
    Write-LoopLog "cycle timeout pid=$($process.Id); stopping process"
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  } else {
    Write-LoopLog "cycle finished pid=$($process.Id) exit=$($process.ExitCode)"
    $errText = if (Test-Path -LiteralPath $stderr) { (Get-Content -Path $stderr -Raw -Encoding UTF8).Trim() } else { "" }
    if ($process.ExitCode -ne 0 -and $errText.Length -gt 0) {
      Write-LoopLog "cycle stderr: $errText"
    }
  }

  $elapsed = [int]((Get-Date) - $started).TotalSeconds
  $sleepFor = [Math]::Max(1, $IntervalSeconds - $elapsed)
  Start-Sleep -Seconds $sleepFor
}
