Param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$BaseUrl = "http://localhost:3000",
  [int]$IntervalSeconds = 300,
  [int]$FullCheckEvery = 12,
  [switch]$RunBuildChecks,
  [switch]$Once
)

$ErrorActionPreference = "Stop"

$OmegaTmp = "C:\Omega\tmp"
$LogPath = Join-Path $OmegaTmp "omega-security-watch.log"
$StatusPath = Join-Path $OmegaTmp "omega-security-status.txt"
$CodexStatusPath = Join-Path $OmegaTmp "omega-codex-status.txt"
$TriggerPath = Join-Path $OmegaTmp "omega-codex-trigger.txt"
$AlertDir = Join-Path $OmegaTmp "omega-security-alerts"
$TriggerDir = Join-Path $OmegaTmp "omega-security-triggers"
$StatePath = Join-Path $OmegaTmp "omega-security-watch-state.json"
$LastOutputPath = Join-Path $OmegaTmp "omega-security-last-check.txt"
$PcStatusPath = Join-Path $OmegaTmp "omega-pc-status.txt"
$PcStatusJsonPath = Join-Path $OmegaTmp "omega-pc-status.json"
$EventLogPath = Join-Path $OmegaTmp "omega-security-events.jsonl"

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

function Write-WatchLog([string]$Level, [string]$Message) {
  $line = "{0} [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level.ToUpperInvariant(), $Message
  Add-Content -Path $LogPath -Value $line -Encoding UTF8
  Write-Host $line
}

function Set-TextFileWithRetry([string]$Path, [string]$Value) {
  $tempPath = "$Path.tmp"
  for ($attempt = 1; $attempt -le 5; $attempt += 1) {
    try {
      Set-Content -Path $tempPath -Value $Value -Encoding UTF8 -ErrorAction Stop
      Move-Item -LiteralPath $tempPath -Destination $Path -Force -ErrorAction Stop
      return
    } catch {
      if ($attempt -eq 5) { throw }
      Start-Sleep -Milliseconds 200
    }
  }
}

function Set-WatchStatus([string]$Message) {
  $pendingAlerts = if (Test-Path -LiteralPath $AlertDir) {
    @(Get-ChildItem -LiteralPath $AlertDir -Filter "*.txt" -File).Count
  } else {
    0
  }

  $content = @(
    "Omega security watch",
    "Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")",
    "Root: $Root",
    "BaseUrl: $BaseUrl",
    "Status: $Message",
    "Pending alerts: $pendingAlerts",
    "Log: $LogPath",
    "Last check: $LastOutputPath",
    "PC status: $PcStatusPath"
  ) -join [Environment]::NewLine

  Set-TextFileWithRetry $StatusPath $content
  Set-TextFileWithRetry $CodexStatusPath "Security watch: $Message"
}

function Write-SecurityEvent([string]$Class, [string]$Actor, [string]$Source, [string]$Reason, [string[]]$Files) {
  $eventScript = Join-Path $PSScriptRoot "write-security-event.ps1"
  if (-not (Test-Path -LiteralPath $eventScript)) {
    return
  }

  try {
    & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" `
      -NoProfile `
      -ExecutionPolicy Bypass `
      -File $eventScript `
      -Class $Class `
      -Actor $Actor `
      -Source $Source `
      -Reason $Reason `
      -Files ($Files -join "|") `
      -EventLogPath $EventLogPath | Out-Null
  } catch {
    Write-WatchLog "warn" "Security event write failed: $($_.Exception.Message)"
  }
}

function Send-WatchTrigger([string]$Reason, [string]$Class = "THIRD_PARTY_CHANGE", [string[]]$Files = @()) {
  New-Item -ItemType Directory -Force -Path $TriggerDir | Out-Null
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $message = @(
    "SECURITY_WATCH_ALERT",
    "Time: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")",
    "Class: $Class",
    "Actor: unknown",
    "Source: watchdog",
    "Reason: $Reason",
    "Files: $($Files -join ", ")",
    "Status: $StatusPath",
    "Log: $LogPath",
    "Last check: $LastOutputPath",
    "PC status: $PcStatusPath",
    "Action requested: Codex/Claude should inspect the alert before npm install, commit, push or deploy."
  ) -join [Environment]::NewLine

  $historyPath = Join-Path $TriggerDir "$stamp-trigger.txt"
  Set-Content -Path $historyPath -Value $message -Encoding UTF8
  Set-Content -Path $TriggerPath -Value $message -Encoding UTF8
  Write-SecurityEvent $Class "unknown" "watchdog" $Reason $Files

  $alertScript = Join-Path $PSScriptRoot "send-security-alert.ps1"
  if (Test-Path -LiteralPath $alertScript) {
    try {
      & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" `
        -NoProfile `
        -ExecutionPolicy Bypass `
        -File $alertScript `
        -Reason $Reason `
        -Severity "ALERT" `
        -DetailsPath $LastOutputPath `
        -OutboxPath $AlertDir | Out-Null
    } catch {
      Write-WatchLog "warn" "Alert notification failed: $($_.Exception.Message)"
    }
  }
}

function Update-PcStatus {
  $statusScript = Join-Path $PSScriptRoot "write-pc-status.ps1"
  if (-not (Test-Path -LiteralPath $statusScript)) {
    return
  }

  try {
    & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" `
      -NoProfile `
      -ExecutionPolicy Bypass `
      -File $statusScript `
      -Root $Root `
      -OutputPath $PcStatusPath `
      -JsonPath $PcStatusJsonPath `
      -StatusRoot $OmegaTmp | Out-Null
  } catch {
    Write-WatchLog "warn" "PC status update failed: $($_.Exception.Message)"
  }
}

function Test-LocalhostReady {
  if ($BaseUrl.Trim().Length -eq 0) {
    return $false
  }

  try {
    $response = Invoke-WebRequest -Uri $BaseUrl -Method Head -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    return ([int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 500)
  } catch {
    return $false
  }
}

function Get-WatchSnapshot {
  $snapshot = [ordered]@{}

  foreach ($relativePath in $watchedFiles) {
    $path = Join-Path $Root $relativePath
    if (Test-Path -LiteralPath $path) {
      $snapshot[$relativePath] = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
    } else {
      $snapshot[$relativePath] = "<missing>"
    }
  }

  return $snapshot
}

function Read-PreviousSnapshot {
  if (-not (Test-Path -LiteralPath $StatePath)) {
    return $null
  }

  try {
    return Get-Content -Path $StatePath -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    Write-WatchLog "warn" "State file unreadable; it will be recreated."
    return $null
  }
}

function Save-Snapshot($Snapshot) {
  $state = [ordered]@{
    updatedAt = (Get-Date).ToString("o")
    root = $Root
    watchedFiles = $Snapshot
  }

  $state | ConvertTo-Json -Depth 4 | Set-Content -Path $StatePath -Encoding UTF8
}

function Compare-Snapshot($Previous, $Current) {
  $changes = New-Object System.Collections.Generic.List[string]

  if ($null -eq $Previous -or $null -eq $Previous.watchedFiles) {
    return $changes
  }

  foreach ($relativePath in $watchedFiles) {
    $oldValue = $Previous.watchedFiles.$relativePath
    $newValue = $Current[$relativePath]

    if ($oldValue -ne $newValue) {
      $changes.Add($relativePath) | Out-Null
    }
  }

  return $changes
}

function Invoke-SiteAudit([bool]$RunFullBuild, [bool]$UseBaseUrl) {
  $script = Join-Path $PSScriptRoot "check-site-local.ps1"
  Write-WatchLog "info" "Running check-site-local.ps1; fullBuild=$RunFullBuild baseUrl=$UseBaseUrl"

  $stdoutPath = Join-Path $OmegaTmp "omega-security-check-stdout.txt"
  $stderrPath = Join-Path $OmegaTmp "omega-security-check-stderr.txt"
  Remove-Item -LiteralPath $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue

  $arguments = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$script`"",
    "-Root", "`"$Root`""
  )

  if (-not $RunFullBuild) {
    $arguments += "-SkipBuild"
  }

  if ($UseBaseUrl) {
    $arguments += @("-BaseUrl", "`"$BaseUrl`"")
  }

  $process = Start-Process `
    -FilePath "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" `
    -ArgumentList $arguments `
    -NoNewWindow `
    -Wait `
    -PassThru `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath

  $output = New-Object System.Collections.Generic.List[string]
  if (Test-Path -LiteralPath $stdoutPath) {
    Get-Content -Path $stdoutPath -Encoding UTF8 | ForEach-Object { $output.Add($_) | Out-Null }
  }
  if (Test-Path -LiteralPath $stderrPath) {
    Get-Content -Path $stderrPath -Encoding UTF8 | ForEach-Object { $output.Add($_) | Out-Null }
  }

  $output | Set-Content -Path $LastOutputPath -Encoding UTF8
  $output | ForEach-Object { Write-Host $_ }

  return $process.ExitCode
}

function Invoke-WatchIteration([int]$Iteration) {
  Update-PcStatus

  $previous = Read-PreviousSnapshot
  $current = Get-WatchSnapshot
  $changes = Compare-Snapshot $previous $current
  Save-Snapshot $current

  if ($changes.Count -gt 0) {
    $changedText = ($changes -join ", ")
    Write-WatchLog "warn" "Watched file change detected: $changedText"
    Send-WatchTrigger "Watched security/project file changed: $changedText" "THIRD_PARTY_CHANGE" @($changes)
  }

  $localhostReady = Test-LocalhostReady
  $runFullBuild = $RunBuildChecks -and ($Iteration -eq 1 -or (($Iteration - 1) % $FullCheckEvery -eq 0))
  $exitCode = Invoke-SiteAudit $runFullBuild $localhostReady

  if ($exitCode -ne 0) {
    $reason = "Local security audit failed with exit code $exitCode"
    Write-WatchLog "error" $reason
    Set-WatchStatus "ALERT - $reason"
    Send-WatchTrigger $reason "SYSTEM_EVENT" @()
    return
  }

  if ($localhostReady) {
    Set-WatchStatus "OK - audit passed; localhost routes checked."
  } else {
    Set-WatchStatus "OK - audit passed; localhost is not responding, route checks skipped."
  }

  Write-WatchLog "info" "Audit passed."
}

New-Item -ItemType Directory -Force -Path (Split-Path $LogPath) | Out-Null
Set-WatchStatus "starting"
Write-WatchLog "info" "Security watch starting. Root=$Root IntervalSeconds=$IntervalSeconds RunBuildChecks=$RunBuildChecks Once=$Once"

$iteration = 1
while ($true) {
  try {
    Invoke-WatchIteration $iteration
  } catch {
    $reason = "Security watch crashed: $($_.Exception.Message)"
    Write-WatchLog "error" $reason
    Set-WatchStatus "ALERT - $reason"
    Send-WatchTrigger $reason "SYSTEM_EVENT" @()
  }

  if ($Once) {
    break
  }

  $iteration += 1
  Start-Sleep -Seconds $IntervalSeconds
}

Write-WatchLog "info" "Security watch stopped."
