Param(
  [string]$Class = "SYSTEM_EVENT",
  [string]$Actor = "system",
  [string]$Source = "local",
  [string]$Reason = "",
  [string[]]$Files = @(),
  [string]$EventLogPath = "C:\Omega\tmp\omega-security-events.jsonl"
)

$ErrorActionPreference = "Stop"

$allowed = @(
  "OWN_CHANGE",
  "AGENT_CHANGE",
  "WATCHDOG_CHANGE",
  "THIRD_PARTY_CHANGE",
  "SYSTEM_EVENT",
  "EXTERNAL_ALERT"
)

if ($allowed -notcontains $Class) {
  throw "Classe de evento invalida: $Class"
}

$normalizedFiles = @()
foreach ($file in @($Files)) {
  if ($file -like "*|*") {
    $normalizedFiles += ($file -split "\|" | Where-Object { $_.Trim().Length -gt 0 })
  } elseif ($file.Trim().Length -gt 0) {
    $normalizedFiles += $file
  }
}

$event = [ordered]@{
  id = [guid]::NewGuid().ToString()
  time = (Get-Date).ToString("o")
  class = $Class
  actor = $Actor
  source = $Source
  reason = $Reason
  files = @($normalizedFiles)
  computer = $env:COMPUTERNAME
  user = $env:USERNAME
}

New-Item -ItemType Directory -Force -Path (Split-Path $EventLogPath) | Out-Null
($event | ConvertTo-Json -Depth 5 -Compress) | Add-Content -Path $EventLogPath -Encoding UTF8
Write-Host "Security event written: $($event.id) $Class $Reason"
