Param(
  [string]$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$Adb = "",
  [string]$AdbHome = "C:\Omega\tmp\android-adb-home",
  [string]$PcStatusRoot = "C:\Omega\tmp\anatomia-pc-status",
  [int]$IntervalSeconds = 15,
  [int]$RunTimeoutSeconds = 45
)

$ErrorActionPreference = "Stop"

function Resolve-AdbPath {
  param([string]$Preferred)

  $candidates = @(
    $Preferred,
    "C:\Omega\Sistema\Ferramentas_WSL_e_Binarios\infra\adb\adb.exe",
    "C:\Omega\03_Ferramentas\infra\adb\adb.exe",
    "C:\Omega\03_Ferramentas\adb_root_legacy\adb.exe"
  ) | Where-Object { $_ }

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  throw "adb.exe nao encontrado. Informe -Adb ou configure a infraestrutura local do tablet."
}

$Adb = Resolve-AdbPath -Preferred $Adb
$omegaTmp = "C:\Omega\tmp"
New-Item -ItemType Directory -Force -Path $omegaTmp | Out-Null

$pidPath = Join-Path $omegaTmp "omega-tablet-adb-sync-loop.pid"
if (Test-Path -LiteralPath $pidPath) {
  $existingPid = (Get-Content -Path $pidPath -Raw -Encoding UTF8).Trim()
  if ($existingPid.Length -gt 0) {
    $existingProcess = Get-Process -Id ([int]$existingPid) -ErrorAction SilentlyContinue
    if ($null -ne $existingProcess) {
      Write-Host "Tablet ADB sync loop already running: $existingPid"
      Write-Host "Log: C:\Omega\tmp\omega-tablet-adb-sync-loop.log"
      exit 0
    }
  }
}

$loopScript = Join-Path $Repo "tools\tablet\tablet-status-adb-loop.ps1"
if (-not (Test-Path -LiteralPath $loopScript)) {
  throw "Tablet ADB sync loop script not found: $loopScript"
}

$powershell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments = @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-File", "`"$loopScript`"",
  "-Repo", "`"$Repo`"",
  "-Adb", "`"$Adb`"",
  "-AdbHome", "`"$AdbHome`"",
  "-PcStatusRoot", "`"$PcStatusRoot`"",
  "-IntervalSeconds", $IntervalSeconds,
  "-RunTimeoutSeconds", $RunTimeoutSeconds
)

$process = Start-Process `
  -FilePath $powershell `
  -ArgumentList $arguments `
  -WindowStyle Hidden `
  -PassThru

$tmpPidPath = "$pidPath.tmp"
Set-Content -Path $tmpPidPath -Value $process.Id -Encoding UTF8 -Force
Move-Item -LiteralPath $tmpPidPath -Destination $pidPath -Force
Write-Host "Started tablet ADB sync loop process: $($process.Id)"
Write-Host "Log: C:\Omega\tmp\omega-tablet-adb-sync-loop.log"
