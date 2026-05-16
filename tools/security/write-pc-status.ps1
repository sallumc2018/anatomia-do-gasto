Param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$OutputPath = "C:\Omega\tmp\omega-pc-status.txt",
  [string]$JsonPath = "C:\Omega\tmp\omega-pc-status.json",
  [string]$StatusRoot = "C:\Omega\tmp"
)

$ErrorActionPreference = "Stop"

function Format-Bytes([double]$Bytes) {
  if ($Bytes -ge 1TB) { return "{0:N1} TB" -f ($Bytes / 1TB) }
  if ($Bytes -ge 1GB) { return "{0:N1} GB" -f ($Bytes / 1GB) }
  if ($Bytes -ge 1MB) { return "{0:N1} MB" -f ($Bytes / 1MB) }
  return "{0:N0} B" -f $Bytes
}

function Get-GitSummary {
  try {
    $status = & git -C $Root status --short --branch 2>&1
    $head = & git -C $Root log --oneline -1 2>&1
    return @{
      ok = $LASTEXITCODE -eq 0
      status = @($status)
      head = ($head | Select-Object -First 1)
    }
  } catch {
    return @{ ok = $false; status = @($_.Exception.Message); head = "" }
  }
}

function Get-CimSafe([string]$ClassName, [string]$Filter = "") {
  try {
    if ($Filter) {
      return @(Get-CimInstance -ClassName $ClassName -Filter $Filter -ErrorAction Stop)
    }
    return @(Get-CimInstance -ClassName $ClassName -ErrorAction Stop)
  } catch {
    return @()
  }
}

$os = Get-CimSafe "Win32_OperatingSystem" | Select-Object -First 1
$computer = Get-CimSafe "Win32_ComputerSystem" | Select-Object -First 1
$cpu = Get-CimSafe "Win32_Processor" | Select-Object -First 1
$disks = Get-CimSafe "Win32_LogicalDisk" "DriveType=3" |
  Select-Object DeviceID, VolumeName, Size, FreeSpace
$topProcesses = Get-Process |
  Sort-Object CPU -Descending |
  Select-Object -First 8 Id, ProcessName, CPU, WorkingSet64
$powershellWatch = Get-CimSafe "Win32_Process" |
  Where-Object { $_.CommandLine -match "security-watch\.ps1" } |
  Select-Object ProcessId, CommandLine
$git = Get-GitSummary

$securityStatusPath = Join-Path $StatusRoot "omega-security-status.txt"
$alertPath = Join-Path $StatusRoot "omega-security-alerts"
$triggerPath = Join-Path $StatusRoot "omega-security-triggers"
$eventPath = Join-Path $StatusRoot "omega-security-events.jsonl"

$securityStatus = if (Test-Path -LiteralPath $securityStatusPath) {
  Get-Content -Path $securityStatusPath -Raw -Encoding UTF8
} else {
  "Security watch status file not found: $securityStatusPath"
}

$pendingAlerts = if (Test-Path -LiteralPath $alertPath) {
  @(Get-ChildItem -LiteralPath $alertPath -Filter "*.txt" -File).Count
} else {
  0
}
$pendingTriggers = if (Test-Path -LiteralPath $triggerPath) {
  @(Get-ChildItem -LiteralPath $triggerPath -Filter "*.txt" -File).Count
} else {
  0
}
$recentEvents = if (Test-Path -LiteralPath $eventPath) {
  @(Get-Content -Path $eventPath -Tail 8 -Encoding UTF8)
} else {
  @()
}

$snapshot = [ordered]@{
  updatedAt = (Get-Date).ToString("o")
  computer = $env:COMPUTERNAME
  user = $env:USERNAME
  root = $Root
  os = if ($os) { $os.Caption } else { "unavailable: CIM access denied" }
  uptime = if ($os) { ((Get-Date) - $os.LastBootUpTime).ToString("d\.hh\:mm\:ss") } else { "unavailable" }
  cpu = if ($cpu) { $cpu.Name } else { "unavailable: CIM access denied" }
  memoryTotal = if ($computer) { [int64]$computer.TotalPhysicalMemory } else { 0 }
  memoryFree = if ($os) { [int64]($os.FreePhysicalMemory * 1KB) } else { 0 }
  disks = $disks
  securityWatchProcesses = $powershellWatch
  pendingSecurityAlerts = $pendingAlerts
  pendingSecurityTriggers = $pendingTriggers
  recentSecurityEvents = $recentEvents
  git = $git
}

New-Item -ItemType Directory -Force -Path (Split-Path $OutputPath) | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $JsonPath) | Out-Null

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("Omega PC status") | Out-Null
$lines.Add("Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")") | Out-Null
$lines.Add("Computer: $($snapshot.computer)") | Out-Null
$lines.Add("User: $($snapshot.user)") | Out-Null
$lines.Add("Root: $Root") | Out-Null
$lines.Add("OS: $($snapshot.os)") | Out-Null
$lines.Add("Uptime: $($snapshot.uptime)") | Out-Null
$lines.Add("CPU: $($snapshot.cpu)") | Out-Null
$lines.Add("Memory: $(Format-Bytes ($snapshot.memoryFree)) free / $(Format-Bytes ($snapshot.memoryTotal)) total") | Out-Null
$lines.Add("Pending security alerts: $pendingAlerts") | Out-Null
$lines.Add("Pending security triggers: $pendingTriggers") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("== Security watch ==") | Out-Null
$lines.Add($securityStatus.Trim()) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("== Recent security events ==") | Out-Null
if ($recentEvents.Count -eq 0) {
  $lines.Add("(none)") | Out-Null
} else {
  $recentEvents | ForEach-Object { $lines.Add($_) | Out-Null }
}
$lines.Add("") | Out-Null
$lines.Add("== Disks ==") | Out-Null
foreach ($disk in $disks) {
  $used = [double]$disk.Size - [double]$disk.FreeSpace
  $pct = if ($disk.Size -gt 0) { [math]::Round(($used / $disk.Size) * 100, 1) } else { 0 }
  $lines.Add("$($disk.DeviceID) $($disk.VolumeName) - $(Format-Bytes $disk.FreeSpace) free / $(Format-Bytes $disk.Size) total ($pct% used)") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("== Git ==") | Out-Null
$lines.Add("HEAD: $($git.head)") | Out-Null
$git.status | ForEach-Object { $lines.Add($_) | Out-Null }
$lines.Add("") | Out-Null
$lines.Add("== Top CPU processes ==") | Out-Null
foreach ($process in $topProcesses) {
  $cpuText = if ($null -eq $process.CPU) { "0.0" } else { "{0:N1}" -f $process.CPU }
  $lines.Add("$($process.Id) $($process.ProcessName) CPU=$cpuText WS=$(Format-Bytes $process.WorkingSet64)") | Out-Null
}

try {
  $lines | Set-Content -Path $OutputPath -Encoding UTF8 -ErrorAction Stop
  Write-Host "PC status written: $OutputPath"
} catch {
  Write-Host "PC status text not updated: $($_.Exception.Message)"
}

try {
  $snapshot | ConvertTo-Json -Depth 5 | Set-Content -Path $JsonPath -Encoding UTF8 -ErrorAction Stop
  Write-Host "PC status JSON written: $JsonPath"
} catch {
  Write-Host "PC status JSON not updated: $($_.Exception.Message)"
}
