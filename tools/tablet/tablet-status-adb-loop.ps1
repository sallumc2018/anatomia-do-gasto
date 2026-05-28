Param(
  [string]$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$Adb = "",
  [string]$AdbHome = "C:\Omega\tmp\android-adb-home",
  [string]$PcStatusRoot = "C:\Omega\tmp\anatomia-pc-status",
  [int]$IntervalSeconds = 15,
  [int]$RunTimeoutSeconds = 45,
  [string]$LogPath = "C:\Omega\tmp\omega-tablet-adb-sync-loop.log"
)

$ErrorActionPreference = "Continue"

function Write-LoopLog {
  param([string]$Message)
  New-Item -ItemType Directory -Force -Path (Split-Path $LogPath) | Out-Null
  Add-Content -Path $LogPath -Encoding UTF8 -Value "$(Get-Date -Format "yyyy-MM-dd HH:mm:ss") $Message"
}

$script = Join-Path $Repo "tools\tablet\update-tablet-status.ps1"
if (-not (Test-Path -LiteralPath $script)) {
  throw "Tablet ADB update script not found: $script"
}

$powershell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
Write-LoopLog "adb sync loop started; interval=${IntervalSeconds}s timeout=${RunTimeoutSeconds}s repo=$Repo"

while ($true) {
  $started = Get-Date
  $arguments = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$script`"",
    "-Repo", "`"$Repo`"",
    "-AdbHome", "`"$AdbHome`"",
    "-PcStatusRoot", "`"$PcStatusRoot`""
  )
  if (-not [string]::IsNullOrWhiteSpace($Adb)) {
    $arguments += @("-Adb", "`"$Adb`"")
  }

  $stdout = "C:\Omega\tmp\omega-tablet-adb-sync-child.out"
  $stderr = "C:\Omega\tmp\omega-tablet-adb-sync-child.err"
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
