Param(
  [int]$HeartbeatSeconds = 60,
  [string]$StatusPath = "C:\Omega\tmp\omega-keep-awake-status.txt"
)

$ErrorActionPreference = "Stop"

$signature = @"
using System;
using System.Runtime.InteropServices;

public static class OmegaPower {
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern uint SetThreadExecutionState(uint esFlags);
}
"@

Add-Type -TypeDefinition $signature -ErrorAction Stop | Out-Null

$ES_CONTINUOUS = [uint32]2147483648
$ES_SYSTEM_REQUIRED = [uint32]0x00000001
$flags = $ES_CONTINUOUS -bor $ES_SYSTEM_REQUIRED

New-Item -ItemType Directory -Force -Path (Split-Path $StatusPath) | Out-Null

try {
  while ($true) {
    [void][OmegaPower]::SetThreadExecutionState($flags)
    @(
      "Omega keep-awake",
      "Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")",
      "Status: active - system sleep is being prevented while this process runs.",
      "PID: $PID"
    ) | Set-Content -Path $StatusPath -Encoding UTF8
    Start-Sleep -Seconds $HeartbeatSeconds
  }
} finally {
  [void][OmegaPower]::SetThreadExecutionState($ES_CONTINUOUS)
}
