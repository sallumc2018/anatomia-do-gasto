$os      = Get-CimInstance Win32_OperatingSystem | Select-Object -First 1
$cpu     = (Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 1 -ErrorAction SilentlyContinue).CounterSamples[0].CookedValue
$uptime  = (Get-Date) - $os.LastBootUpTime
$memUsed = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1MB, 1)
$memTot  = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
$disk    = Get-PSDrive C
$freePct = [math]::Round($disk.Free / ($disk.Used + $disk.Free) * 100)

Write-Host ""
Write-Host "=== PC Status $(Get-Date -Format 'HH:mm:ss') ===" -ForegroundColor Cyan
Write-Host "Uptime  : $([int]$uptime.TotalDays)d $($uptime.Hours)h $($uptime.Minutes)m"
Write-Host "CPU     : $([math]::Round($cpu, 1))%"
Write-Host "RAM     : $memUsed / $memTot GB"
Write-Host "Disco C : $([math]::Round($disk.Free/1GB, 1)) GB livre ($freePct%)"
Write-Host "Alertas : $(@(Get-ChildItem 'C:\Omega\tmp\omega-security-alerts' -Filter '*.txt' -File -ErrorAction SilentlyContinue).Count) pendente(s)"
Write-Host ""
