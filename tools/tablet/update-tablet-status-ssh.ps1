param(
  [string]$Repo = "C:\Omega\02_Repos\anatomia-do-gasto",
  [string]$ConfigPath = "C:\Omega\03_Ferramentas\infra\omega-tablet-ssh.json",
  [string]$PcStatusRoot = (Join-Path $Repo ".local\state")
)

$ErrorActionPreference = "Stop"

function Format-Bytes([double]$Bytes) {
  if ($Bytes -ge 1TB) { return "{0:N1} TB" -f ($Bytes / 1TB) }
  if ($Bytes -ge 1GB) { return "{0:N1} GB" -f ($Bytes / 1GB) }
  if ($Bytes -ge 1MB) { return "{0:N1} MB" -f ($Bytes / 1MB) }
  return "{0:N0} B" -f $Bytes
}

function Write-TermuxTextFile([string]$Path, [string[]]$Lines) {
  $utf8NoBom = New-Object Text.UTF8Encoding $false
  [IO.File]::WriteAllText($Path, (($Lines -join "`n") + "`n"), $utf8NoBom)
}

function Read-SharedTextFile([string]$Path) {
  for ($attempt = 1; $attempt -le 5; $attempt += 1) {
    try {
      $stream = [IO.File]::Open($Path, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
      try {
        $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::UTF8, $true)
        try {
          return $reader.ReadToEnd()
        } finally {
          $reader.Dispose()
        }
      } finally {
        $stream.Dispose()
      }
    } catch {
      if ($attempt -eq 5) { throw }
      Start-Sleep -Milliseconds 150
    }
  }
}

function Escape-ShSingleQuoted([string]$Value) {
  if ($null -eq $Value) { return "" }
  return $Value.Replace("'", "'\''")
}

function New-Text([int[]]$CodePoints) {
  return ($CodePoints | ForEach-Object { [char]$_ }) -join ""
}

function Get-CpuPercent {
  $counters = @(
    "\Processor(_Total)\% Processor Time",
    "\Processador(_Total)\% tempo de processador"
  )

  foreach ($counter in $counters) {
    try {
      $sample = Get-Counter -Counter $counter -SampleInterval 1 -MaxSamples 1 -ErrorAction Stop
      return [math]::Round($sample.CounterSamples[0].CookedValue, 1)
    } catch {
      continue
    }
  }

  return $null
}

function ConvertTo-UnixTime([datetime]$DateTime) {
  return ([DateTimeOffset]$DateTime).ToUnixTimeSeconds()
}

function Get-MemorySnapshot {
  try {
    Add-Type -AssemblyName Microsoft.VisualBasic -ErrorAction Stop | Out-Null
    $computerInfo = New-Object Microsoft.VisualBasic.Devices.ComputerInfo
    $total = [double]$computerInfo.TotalPhysicalMemory
    $free = [double]$computerInfo.AvailablePhysicalMemory
    return @{
      total = $total
      free = $free
      used = [math]::Max([double]0, $total - $free)
    }
  } catch {
  }

  try {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop | Select-Object -First 1
    $computer = Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction Stop | Select-Object -First 1
    if ($os -and $computer) {
      $total = [double]$computer.TotalPhysicalMemory
      $free = [double]($os.FreePhysicalMemory * 1KB)
      return @{
        total = $total
        free = $free
        used = [math]::Max([double]0, $total - $free)
      }
    }
  } catch {
  }

  return @{
    total = 0
    free = 0
    used = 0
  }
}

function Get-GitMonitorSnapshot([string]$Root) {
  $snapshot = @{
    branch = "indisponivel"
    changes = "?"
    ahead = "?"
    behind = "?"
  }

  try {
    $branch = (& git -C $Root branch --show-current 2>$null | Select-Object -First 1)
    if (-not [string]::IsNullOrWhiteSpace($branch)) {
      $snapshot.branch = $branch.Trim()
    }
  } catch {
  }

  try {
    $changes = @(& git -C $Root status --porcelain=v1 2>$null)
    $snapshot.changes = [string]$changes.Count
  } catch {
  }

  try {
    $upstream = (& git -C $Root rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>$null | Select-Object -First 1)
    if (-not [string]::IsNullOrWhiteSpace($upstream)) {
      $counts = (& git -C $Root rev-list --left-right --count "HEAD...@{u}" 2>$null | Select-Object -First 1)
      if ($counts -match "^\s*(\d+)\s+(\d+)\s*$") {
        $snapshot.ahead = $Matches[1]
        $snapshot.behind = $Matches[2]
      }
    }
  } catch {
  }

  return $snapshot
}

function Test-WebAnalyticsConfigured([string]$Root) {
  $layoutPath = Join-Path $Root "apps\web\app\layout.tsx"
  $packagePath = Join-Path $Root "apps\web\package.json"
  if (-not (Test-Path -LiteralPath $layoutPath) -or -not (Test-Path -LiteralPath $packagePath)) {
    return $false
  }

  $layout = Read-SharedTextFile $layoutPath
  $package = Read-SharedTextFile $packagePath
  return ($layout -match "<Analytics\s*/>" -and $package -match '"@vercel/analytics"')
}

function Test-HttpStatus([string]$Url) {
  try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
    $statusCode = [int]$response.StatusCode
    if ($statusCode -ge 200 -and $statusCode -lt 400) { return "Online" }
    return "HTTP $statusCode"
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $code = [int]$_.Exception.Response.StatusCode
      if ($code -ge 200 -and $code -lt 500) { return "Online" }
      return "HTTP $code"
    }
    return "Offline"
  }
}

function Get-DeploymentStatus([string]$SiteStatus) {
  if ($SiteStatus -eq "Online") { return (New-Text @(80,114,111,100,117,231,227,111,32,111,110,108,105,110,101)) }
  return "Verificar"
}

function Get-DiskStatus([string]$DriveName = "C") {
  try {
    $drive = Get-PSDrive -Name $DriveName -ErrorAction Stop
    $total = [double]$drive.Used + [double]$drive.Free
    $freePct = if ($total -gt 0) { [math]::Round(([double]$drive.Free / $total) * 100, 0) } else { 0 }
    return "$(Format-Bytes $drive.Free) livre ($freePct%)"
  } catch {
    return "Indisponivel"
  }
}

function Get-UptimeStatus {
  try {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop | Select-Object -First 1
    $up = (Get-Date) - $os.LastBootUpTime
    if ($up.TotalDays -ge 1) { return "$([int]$up.TotalDays)d $($up.Hours)h" }
    return "$($up.Hours)h $($up.Minutes)m"
  } catch {
    return "Indisponivel"
  }
}

function Get-PowerStatus {
  try {
    $battery = Get-CimInstance -ClassName Win32_Battery -ErrorAction Stop | Select-Object -First 1
    if ($battery) {
      $charge = if ($null -ne $battery.EstimatedChargeRemaining) { $battery.EstimatedChargeRemaining } else { 0 }
      if ($battery.BatteryStatus -eq 1) { return "Bateria $charge%" }
      if ($charge -lt 99) { return "Carregando $charge%" }
      return "Tomada $charge%"
    }
  } catch {
  }
  return "Tomada"
}

function Test-TcpPort([string]$HostName, [int]$Port) {
  try {
    $client = New-Object Net.Sockets.TcpClient
    try {
      $async = $client.BeginConnect($HostName, $Port, $null, $null)
      if (-not $async.AsyncWaitHandle.WaitOne(1500, $false)) { return "Offline" }
      $client.EndConnect($async)
      return "Online"
    } finally {
      $client.Close()
    }
  } catch {
    return "Offline"
  }
}

function Test-SslExpiry([string]$Hostname) {
  try {
    $tcp = New-Object Net.Sockets.TcpClient
    $async = $tcp.BeginConnect($Hostname, 443, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne(3000, $false)) {
      $tcp.Close(); return "indisponivel"
    }
    $tcp.EndConnect($async)
    $cb = [Net.Security.RemoteCertificateValidationCallback]{ $true }
    $ssl = New-Object Net.Security.SslStream($tcp.GetStream(), $false, $cb)
    $ssl.AuthenticateAsClient($Hostname)
    $cert = New-Object Security.Cryptography.X509Certificates.X509Certificate2 $ssl.RemoteCertificate
    $ssl.Dispose()
    $tcp.Dispose()
    $daysLeft = [int]($cert.NotAfter - (Get-Date)).TotalDays
    if ($daysLeft -lt 0) { return "Expirado" }
    if ($daysLeft -le 14) { return "ALERTA: $daysLeft dias" }
    return "Ok ($daysLeft dias)"
  } catch {
    return "Indisponivel"
  }
}

function Get-DefenderStatus {
  try {
    $s = Get-MpComputerStatus -ErrorAction Stop
    if ($s.AntivirusEnabled -and $s.RealTimeProtectionEnabled) { return "Ativo" }
    return "Verificar"
  } catch {
    return "Indisponivel"
  }
}

function Get-FirewallStatus {
  try {
    $out = (& netsh advfirewall show privateprofile 2>&1) -join " "
    if ($out -match "BlockInbound") { return "Ativo" }
    return "Verificar"
  } catch {
    return "Indisponivel"
  }
}

function Get-WslStatus {
  try {
    $oldEnc = [Console]::OutputEncoding
    [Console]::OutputEncoding = [Text.Encoding]::Unicode
    $lines = @(& wsl --list --running 2>&1)
    [Console]::OutputEncoding = $oldEnc
    $lines = @($lines | Where-Object { $_ -and $_.ToString().Trim() })
    $noRunning = @($lines | Where-Object { $_ -match "N.o h.|There are no|No running" })
    if ($noRunning.Count -gt 0 -or $lines.Count -eq 0) { return "Inativo" }
    $distros = @($lines | Where-Object {
      $l = $_.ToString().Trim()
      $l -and $l -notmatch "Windows Subsystem|Subsistema|distrib|execu|^Nome$|^Name$"
    } | ForEach-Object { $_.ToString().Trim() -replace '\s+\(.*\)$', '' })
    if ($distros.Count -gt 0) { return "Ativo: $($distros -join ', ')" }
    return "Ativo"
  } catch {
    return "Indisponivel"
  }
}

function Test-OngDns([string]$Hostname) {
  try {
    $records = Resolve-DnsName $Hostname -ErrorAction Stop
    $aRecords = @($records | Where-Object { $_.Type -eq "A" })
    $cnames = @($records | Where-Object { $_.Type -eq "CNAME" })
    if ($aRecords.Count -eq 0 -and $cnames.Count -eq 0) { return "Sem resposta" }
    $vercelA = @($aRecords | Where-Object { $_.IPAddress -match "^76\." })
    $vercelCname = @($cnames | Where-Object { $_.NameHost -match "vercel" })
    if ($vercelA.Count -gt 0 -or $vercelCname.Count -gt 0) { return "Ok (Vercel)" }
    $firstIp = if ($aRecords.Count -gt 0) { $aRecords[0].IPAddress } else { $cnames[0].NameHost }
    return "ALERTA: $firstIp"
  } catch {
    return "Indisponivel"
  }
}

function Get-SecurityUpdateStatus {
  try {
    if (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired") {
      return "Reiniciar"
    }
    $session = New-Object -ComObject Microsoft.Update.Session -ErrorAction Stop
    $searcher = $session.CreateUpdateSearcher()
    $histCount = $searcher.GetTotalHistoryCount()
    if ($histCount -gt 0) {
      $last = $searcher.QueryHistory(0, 1)[0]
      $days = [int]((Get-Date) - $last.Date).TotalDays
      if ($days -gt 30) { return "Verificar ($days d)" }
    }
    return "Em dia"
  } catch {
    return "Indisponivel"
  }
}

function Get-NetworkScan {
  $knownHosts = @{
    "192.168.15.1"  = "Gateway"
    "192.168.15.4"  = "Celular-Mae"
    "192.168.15.6"  = "Este PC"
    "192.168.15.7"  = "Celular-Mae-2"
    "192.168.15.8"  = "Laptop-Mae"
    "192.168.15.10" = "Galaxy-A30"
    "192.168.15.11" = "Laptop-Sallum"
    "192.168.15.18" = "Tablet"
  }
  $result = @{
    total   = 0
    unknown = 0
    status  = "Indisponivel"
    updated = (Get-Date -Format "HH:mm:ss")
  }
  try {
    $arpLines = & arp -a 2>$null
    $foundIPs = @(
      $arpLines | ForEach-Object {
        if ($_ -match "(192\.168\.15\.\d{1,3})\s") { $Matches[1] }
      } | Where-Object {
        $_ -and $_ -ne "192.168.15.255" -and $_ -ne "192.168.15.0"
      } | Sort-Object -Unique { [int]($_ -split "\.")[-1] }
    )
    $unknownIPs = @($foundIPs | Where-Object { -not $knownHosts.ContainsKey($_) })
    $result.total   = $foundIPs.Count
    $result.unknown = $unknownIPs.Count
    $result.status  = if ($unknownIPs.Count -eq 0) { "Segura" } else { "ALERTA: $($unknownIPs.Count) desconhecido(s)" }
  } catch {
    $result.status = "Erro na varredura"
  }
  return $result
}

function New-TabletDashboard {
  param(
    [string]$StatusPath,
    [string]$OutputRoot,
    [string]$RemoteRoot,
    [int]$WatchdogIntervalSeconds = 300
  )

  New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

  $memory = Get-MemorySnapshot
  $memoryTotal = [double]$memory.total
  $memoryFree = [double]$memory.free
  $memoryUsed = [double]$memory.used
  $memoryUsedPct = if ($memoryTotal -gt 0) { [math]::Round(($memoryUsed / $memoryTotal) * 100, 1) } else { 0 }
  $cpuPercent = Get-CpuPercent
  $git = Get-GitMonitorSnapshot $Repo
  $analyticsStatus = if (Test-WebAnalyticsConfigured $Repo) { "Ativo" } else { "Nao configurado" }
  $siteStatus = Test-HttpStatus "https://www.anatomiadogasto.ong.br"
  $deployStatus = Get-DeploymentStatus $siteStatus
  $githubSyncStatus = if ($git.ahead -eq "0" -and $git.behind -eq "0") { "Em dia" } else { "+$($git.ahead) / -$($git.behind)" }
  $vercelSyncStatus = if ($siteStatus -eq "Online") { "Online" } else { "Verificar" }
  $devServerStatus = Test-HttpStatus "http://localhost:3000"
  $diskStatus = Get-DiskStatus "C"
  $powerStatus = Get-PowerStatus

  $securityStatus = if (Test-Path -LiteralPath $StatusPath) {
    Read-SharedTextFile $StatusPath
  } else {
    ""
  }

  $watchdogStatus = "indisponivel"
  $watchdogUpdatedAt = Get-Date
  if ($securityStatus -match "(?m)^Status:\s*(.+)$") {
    $watchdogStatus = $Matches[1].Trim()
  }
  if ($securityStatus -match "(?m)^Updated:\s*(.+)$") {
    $rawUpdatedAt = $Matches[1].Trim()
    try {
      $watchdogUpdatedAt = [datetime]::ParseExact($rawUpdatedAt, "yyyy-MM-dd HH:mm:ss", [Globalization.CultureInfo]::InvariantCulture)
    } catch {
      $watchdogUpdatedAt = Get-Date
    }
  }

  $headPath = Join-Path $OutputRoot "painel-head.txt"
  $envPath = Join-Path $OutputRoot "painel.env"
  $cpuText = if ($null -eq $cpuPercent) { "Indisponivel" } else { "{0:N1}%" -f $cpuPercent }
  $panelUpdatedAt = Get-Date
  $panelIntervalSeconds = 35
  $alertPath = Join-Path "C:\Omega\tmp" "omega-security-alerts"
  $keepAwakeStatusPath = Join-Path "C:\Omega\tmp" "omega-keep-awake-status.txt"
  $pendingAlerts = if (Test-Path -LiteralPath $alertPath) {
    @(Get-ChildItem -LiteralPath $alertPath -Filter "*.txt" -File).Count
  } else {
    0
  }
  $keepAwakeStatus = if (Test-Path -LiteralPath $keepAwakeStatusPath) { "Ativo" } else { "Inativo" }
  $tabletSshStatus = "Offline"
  try {
    $tabletConfig = Get-Content -Path $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $tabletSshStatus = Test-TcpPort ([string]$tabletConfig.host) ([int]$tabletConfig.port)
  } catch {
  }

  $rede = Get-NetworkScan
  $sslStatus = if ($siteStatus -eq "Online") { Test-SslExpiry "www.anatomiadogasto.ong.br" } else { "Indisponivel" }
  $defenderStatus = Get-DefenderStatus
  $firewallStatus = Get-FirewallStatus
  $wslStatus = Get-WslStatus
  $ongDns = Test-OngDns "www.anatomiadogasto.ong.br"
  $updateStatus = Get-SecurityUpdateStatus
  $pcUptime = Get-UptimeStatus
  $redeDisplay = if ($rede.unknown -eq 0) { "Segura ($($rede.total) disp.)" } else { "ALERTA: $($rede.unknown) desconhecido(s)" }
  $projetoIntegridade = if ($watchdogStatus -like "OK -*") { "Ok" } else { "Verificar" }

  $head = @(
    "This file is generated for compatibility. The live panel reads painel.env."
  )
  Write-TermuxTextFile $headPath $head

  $watchdogActive = if ($watchdogStatus -like "OK -*") {
    "Sim"
  } else {
    "Verificar"
  }
  $labelUltimaAtualizacao = New-Text @(218,108,116,105,109,97,32,97,116,117,97,108,105,122,97,231,227,111,58)
  $labelMemoriaTotal = New-Text @(77,101,109,243,114,105,97,32,116,111,116,97,108,58)
  $labelMemoriaUsada = (New-Text @(77,101,109,243,114,105,97,32,117,115,97,100,97,58)) + " "
  $labelMemoriaLivre = New-Text @(77,101,109,243,114,105,97,32,108,105,118,114,101,58)
  $labelMudancas = (New-Text @(77,117,100,97,110,231,97,115,58)) + "      "
  $labelAcessos = New-Text @(65,99,101,115,115,111,115,58)
  $labelUltimaVerificacao = New-Text @(218,108,116,105,109,97,32,118,101,114,105,102,105,99,97,231,227,111,58)
  $omegaStatus = New-Text @(101,109,32,112,108,97,110,101,106,97,109,101,110,116,111)
  $env = @(
    "PANEL_UPDATED='$(Get-Date $panelUpdatedAt -Format "yyyy-MM-dd HH:mm:ss")'",
    "PANEL_UPDATED_EPOCH=$(ConvertTo-UnixTime $panelUpdatedAt)",
    "PANEL_INTERVAL_SECONDS=$panelIntervalSeconds",
    "LABEL_ULTIMA_ATUALIZACAO='$(Escape-ShSingleQuoted $labelUltimaAtualizacao)'",
    "LABEL_MEMORIA_TOTAL='$(Escape-ShSingleQuoted $labelMemoriaTotal)'",
    "LABEL_MEMORIA_USADA='$(Escape-ShSingleQuoted $labelMemoriaUsada)'",
    "LABEL_MEMORIA_LIVRE='$(Escape-ShSingleQuoted $labelMemoriaLivre)'",
    "LABEL_MUDANCAS='$(Escape-ShSingleQuoted $labelMudancas)'",
    "LABEL_ACESSOS='$(Escape-ShSingleQuoted $labelAcessos)'",
    "LABEL_ULTIMA_VERIFICACAO='$(Escape-ShSingleQuoted $labelUltimaVerificacao)'",
    "MEMORY_TOTAL='$(Escape-ShSingleQuoted (Format-Bytes $memoryTotal))'",
    "MEMORY_USED='$(Escape-ShSingleQuoted "$((Format-Bytes $memoryUsed)) ($("{0:N1}" -f $memoryUsedPct)%)")'",
    "MEMORY_FREE='$(Escape-ShSingleQuoted (Format-Bytes $memoryFree))'",
    "CPU_USED='$(Escape-ShSingleQuoted $cpuText)'",
    "ONG_BRANCH='$(Escape-ShSingleQuoted $git.branch)'",
    "ONG_CHANGES='$(Escape-ShSingleQuoted $git.changes)'",
    "ONG_GITHUB='+$($git.ahead) / -$($git.behind)'",
    "ONG_SITE='$(Escape-ShSingleQuoted $siteStatus)'",
    "ONG_DEPLOY='$(Escape-ShSingleQuoted $deployStatus)'",
    "ONG_ANALYTICS='$(Escape-ShSingleQuoted $analyticsStatus)'",
    "ONG_ACESSOS='Vercel dashboard'",
    "SYNC_GITHUB='$(Escape-ShSingleQuoted $githubSyncStatus)'",
    "SYNC_VERCEL='$(Escape-ShSingleQuoted $vercelSyncStatus)'",
    "REDE_STATUS='$(Escape-ShSingleQuoted $rede.status)'",
    "REDE_TOTAL='$($rede.total)'",
    "REDE_UNKNOWN='$($rede.unknown)'",
    "REDE_UPDATED='$(Escape-ShSingleQuoted $rede.updated)'",
    "PC_REDE='$(Escape-ShSingleQuoted $redeDisplay)'",
    "PC_FIREWALL='$(Escape-ShSingleQuoted $firewallStatus)'",
    "PC_DEFENDER='$(Escape-ShSingleQuoted $defenderStatus)'",
    "ONG_SSL='$(Escape-ShSingleQuoted $sslStatus)'",
    "PROJETO_INTEGRIDADE='$(Escape-ShSingleQuoted $projetoIntegridade)'",
    "WSL_STATUS='$(Escape-ShSingleQuoted $wslStatus)'",
    "ONG_DNS='$(Escape-ShSingleQuoted $ongDns)'",
    "PC_UPDATES='$(Escape-ShSingleQuoted $updateStatus)'",
    "PC_UPTIME='$(Escape-ShSingleQuoted $pcUptime)'",
    "TABLET_UPTIME=''",
    "OMEGA_DISCO='$(Escape-ShSingleQuoted $diskStatus)'",
    "OMEGA_DEV_SERVER='$(Escape-ShSingleQuoted $devServerStatus)'",
    "OMEGA_ENERGIA='$(Escape-ShSingleQuoted $powerStatus)'",
    "OMEGA_TABLET_SSH='$(Escape-ShSingleQuoted $tabletSshStatus)'",
    "OMEGA_ALERTAS='$pendingAlerts'",
    "OMEGA_SYNC='Ativo'",
    "OMEGA_KEEP_AWAKE='$keepAwakeStatus'",
    "OMEGA_STATUS='$(Escape-ShSingleQuoted $omegaStatus)'",
    "WATCHDOG_STATUS='$(Escape-ShSingleQuoted $watchdogStatus)'",
    "WATCHDOG_ACTIVE='$(Escape-ShSingleQuoted $watchdogActive)'",
    "WATCHDOG_UPDATED='$(Get-Date $watchdogUpdatedAt -Format "yyyy-MM-dd HH:mm:ss")'",
    "WATCHDOG_UPDATED_EPOCH=$(ConvertTo-UnixTime $watchdogUpdatedAt)",
    "WATCHDOG_INTERVAL_SECONDS=$WatchdogIntervalSeconds"
  )
  Write-TermuxTextFile $envPath $env

  $panelScriptPath = Join-Path $OutputRoot "painel"
  $panelScript = @(
    "#!/data/data/com.termux/files/usr/bin/sh",
    "ROOT='$RemoteRoot'",
    "G=`$(printf '\033[32m')",
    "R=`$(printf '\033[31m')",
    "Y=`$(printf '\033[33m')",
    "C=`$(printf '\033[96m')",
    "D=`$(printf '\033[90m')",
    "B=`$(printf '\033[1m')",
    "X=`$(printf '\033[0m')",
    "fmt_countdown() {",
    "  updated=`$1",
    "  interval=`$2",
    "  now=`$(date +%s)",
    "  target=`$((updated + interval))",
    "  remaining=`$((target - now))",
    "  if [ ""`$remaining"" -le 0 ]; then printf 'atualizando'; else min=`$((remaining / 60)); sec=`$((remaining % 60)); printf '%02d:%02d' ""`$min"" ""`$sec""; fi",
    "}",
    "row() {",
    "  lbl=""`$1""; val=""`$2""",
    "  case ""`$val"" in",
    "    Online|Ativo|Sim|0|'Em dia')",
    "      printf ""  `${D}%-15s`${X} `${G}%s`${X}\033[K\n"" ""`$lbl"" ""`$val"" ;;",
    "    Ok*|Segura*|Tomada*|Bateria*|Carregando*|Produ*)",
    "      printf ""  `${D}%-15s`${X} `${G}%s`${X}\033[K\n"" ""`$lbl"" ""`$val"" ;;",
    "    Offline|ALERTA*|Expirado|Verificar*|Indisponivel|Reiniciar|Erro*|Nao*)",
    "      printf ""  `${D}%-15s`${X} `${R}%s`${X}\033[K\n"" ""`$lbl"" ""`$val"" ;;",
    "    *)",
    "      printf ""  `${D}%-15s`${X} %s\033[K\n"" ""`$lbl"" ""`$val"" ;;",
    "  esac",
    "}",
    "section() {",
    "  printf '\033[K\n'",
    "  if [ -n ""`$2"" ]; then",
    "    printf ""`${B}`${C}%s`${X} `${D}(%s)`${X}\033[K\n"" ""`$1"" ""`$2""",
    "  else",
    "    printf ""`${B}`${C}%s`${X}\033[K\n"" ""`$1""",
    "  fi",
    "}",
    "notify_rede() {",
    "  count=""`${REDE_UNKNOWN:-0}""",
    "  if [ ""`$count"" -gt 0 ] 2>/dev/null; then",
    "    sf=""`${TMPDIR:-/tmp}/.omega-rede-alerta""",
    "    now=`$(date +%s)",
    "    last=`$(cat ""`$sf"" 2>/dev/null || printf '0')",
    "    if [ `$((now - last)) -gt 300 ]; then",
    "      termux-notification --title 'OMEGA Seguranca' --content 'Dispositivo desconhecido na rede!' --priority high 2>/dev/null || true",
    "      printf '%s' ""`$now"" > ""`$sf""",
    "    fi",
    "  fi",
    "}",
    "printf '\033[2J\033[?25l'",
    "trap 'printf ""\033[?25h\n""; exit' INT TERM EXIT",
    "while true; do",
    "  if [ -f ""`$ROOT/painel.env"" ]; then . ""`$ROOT/painel.env""; fi",
    "  panel_countdown=`$(fmt_countdown ""`$PANEL_UPDATED_EPOCH"" ""`$PANEL_INTERVAL_SECONDS"")",
    "  watchdog_countdown=`$(fmt_countdown ""`$WATCHDOG_UPDATED_EPOCH"" ""`$WATCHDOG_INTERVAL_SECONDS"")",
    "  notify_rede",
    "  printf '\033[H'",
    "  printf ""`${B}`${C}OMEGA MONITOR`${X}  `${D}atualiza em %s`${X}\033[K\n"" ""`$panel_countdown""",
    "  section 'PC' ""`$REDE_UPDATED""",
    "  row 'Rede:' ""`$PC_REDE""",
    "  row 'Firewall:' ""`$PC_FIREWALL""",
    "  row 'Defender:' ""`$PC_DEFENDER""",
    "  row 'Alertas:' ""`$OMEGA_ALERTAS""",
    "  section 'ONG' ""`$panel_countdown""",
    "  row 'Site:' ""`$ONG_SITE""",
    "  row 'SSL:' ""`$ONG_SSL""",
    "  row 'DNS:' ""`$ONG_DNS""",
    "  row 'Deploy:' ""`$ONG_DEPLOY""",
    "  row 'GitHub:' ""`$SYNC_GITHUB""",
    "  section 'ANATOMIA' ""`$panel_countdown""",
    "  row 'Branch:' ""`$ONG_BRANCH""",
    "  row ""`$LABEL_MUDANCAS"" ""`$ONG_CHANGES""",
    "  row 'Integridade:' ""`$PROJETO_INTEGRIDADE""",
    "  row 'Dev server:' ""`$OMEGA_DEV_SERVER""",
    "  section 'SISTEMA' ""`$PANEL_UPDATED""",
    "  row 'Uptime:' ""`${PC_UPTIME} PC · `${TABLET_UPTIME} tablet""",
    "  row 'Energia:' ""`$OMEGA_ENERGIA""",
    "  row ""`$LABEL_MEMORIA_USADA"" ""`$MEMORY_USED""",
    "  row 'Disco C:' ""`$OMEGA_DISCO""",
    "  row 'WSL:' ""`$WSL_STATUS""",
    "  row 'Atualizacoes:' ""`$PC_UPDATES""",
    "  row 'Tablet SSH:' ""`$OMEGA_TABLET_SSH""",
    "  row 'Watchdog:' ""`$WATCHDOG_ACTIVE""",
    "  printf '\033[J'",
    "  sleep 1",
    "done"
  )
  Write-TermuxTextFile $panelScriptPath $panelScript
}

if (-not (Test-Path -LiteralPath $ConfigPath)) {
  $sample = [ordered]@{
    host = "192.168.1.50"
    port = 8022
    user = "u0_a000"
    keyPath = "C:\Omega\Sensivel\infra\secrets\omega-tablet-status-ed25519"
    remoteRoot = "/data/data/com.termux/files/home/AnatomiaTerminal"
    expectedHostKeySha256 = "SHA256:COLE_AQUI_A_FINGERPRINT_DO_TERMUX"
  }
  New-Item -ItemType Directory -Force -Path (Split-Path $ConfigPath) | Out-Null
  $sample | ConvertTo-Json -Depth 4 | Set-Content -Path $ConfigPath -Encoding UTF8
  throw "Config template created: $ConfigPath. Edit host/user/fingerprint before using."
}

$config = Get-Content -Path $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$knownHosts = "C:\Omega\Sensivel\infra\secrets\omega-tablet-known_hosts"
New-Item -ItemType Directory -Force -Path (Split-Path $knownHosts) | Out-Null

if (-not (Test-Path -LiteralPath $config.keyPath)) {
  throw "SSH key not found: $($config.keyPath). Run tools\tablet\create-tablet-ssh-key.ps1 first."
}

if ([string]::IsNullOrWhiteSpace($config.expectedHostKeySha256) -or $config.expectedHostKeySha256 -like "*COLE_AQUI*") {
  throw "Expected host key fingerprint is missing in $ConfigPath. Compare it with Termux before connecting."
}

$oldErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$sshExe = "C:\Windows\System32\OpenSSH\ssh.exe"
$scpExe = "C:\Windows\System32\OpenSSH\scp.exe"
$sshKeyscanExe = "C:\Windows\System32\OpenSSH\ssh-keyscan.exe"
$sshKeygenExe = "C:\Windows\System32\OpenSSH\ssh-keygen.exe"

$scanOutput = & $sshKeyscanExe -p ([int]$config.port) -T 5 -t ed25519 $config.host 2>&1
$ErrorActionPreference = $oldErrorActionPreference
$scan = @($scanOutput | Where-Object { $_ -match "ssh-ed25519" }) -join [Environment]::NewLine
if ([string]::IsNullOrWhiteSpace($scan)) {
  throw "Could not read tablet SSH host key from $($config.host):$($config.port)."
}

$tmpHostKey = Join-Path "C:\Omega\tmp" "omega-tablet-hostkey.pub"
New-Item -ItemType Directory -Force -Path (Split-Path $tmpHostKey) | Out-Null
($scan -replace "^\[[^\]]+\]:\d+\s+", "") | Set-Content -Path $tmpHostKey -Encoding ASCII
$fingerprintLine = & $sshKeygenExe -lf $tmpHostKey
if ($fingerprintLine -notmatch [regex]::Escape([string]$config.expectedHostKeySha256)) {
  throw "Tablet host key mismatch. Got: $fingerprintLine"
}

$scan | Set-Content -Path $knownHosts -Encoding ASCII

$pcStatusTxt = Join-Path $PcStatusRoot "omega-pc-status.txt"
$pcStatusJson = Join-Path $PcStatusRoot "omega-pc-status.json"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Repo "tools\security\write-pc-status.ps1") -Root $Repo -OutputPath $pcStatusTxt -JsonPath $pcStatusJson
New-TabletDashboard -StatusPath "C:\Omega\tmp\omega-security-status.txt" -OutputRoot $PcStatusRoot -RemoteRoot ([string]$config.remoteRoot)

$sshBase = @(
  "-i", [string]$config.keyPath,
  "-p", [string]$config.port,
  "-o", "IdentitiesOnly=yes",
  "-o", "StrictHostKeyChecking=yes",
  "-o", "UserKnownHostsFile=$knownHosts",
  "-o", "BatchMode=yes",
  "-o", "ConnectTimeout=5",
  "-o", "ConnectionAttempts=1",
  "-o", "ServerAliveInterval=5",
  "-o", "ServerAliveCountMax=1"
)

$scpBase = @(
  "-i", [string]$config.keyPath,
  "-P", [string]$config.port,
  "-o", "IdentitiesOnly=yes",
  "-o", "StrictHostKeyChecking=yes",
  "-o", "UserKnownHostsFile=$knownHosts",
  "-o", "BatchMode=yes",
  "-o", "ConnectTimeout=5",
  "-o", "ConnectionAttempts=1",
  "-o", "ServerAliveInterval=5",
  "-o", "ServerAliveCountMax=1"
)

$target = "$($config.user)@$($config.host)"
$remoteRoot = [string]$config.remoteRoot

& $sshExe @sshBase $target "mkdir -p '$remoteRoot/security' '$remoteRoot/pc'"
if ($LASTEXITCODE -ne 0) { throw "Failed to create remote status directories." }

$rawUptime = & $sshExe @sshBase $target "uptime 2>/dev/null"
$tabletUptime = "?"
if ($rawUptime -match 'up\s+(.+?),?\s+load') {
  $up = $Matches[1].Trim()
  if ($up -match '(\d+)\s+day') {
    $d = [int]$Matches[1]
    $h = if ($up -match '(\d+):') { [int]$Matches[1] } else { 0 }
    $tabletUptime = "${d}d ${h}h"
  } elseif ($up -match '(\d+):(\d+)') {
    $h = [int]$Matches[1]; $m = [int]$Matches[2]
    $tabletUptime = "${h}h ${m}m"
  } elseif ($up -match '(\d+)\s+min') {
    $tabletUptime = "$([int]$Matches[1])m"
  }
}
$envFilePath = Join-Path $PcStatusRoot "painel.env"
$utf8NoBom = New-Object Text.UTF8Encoding $false
$envContent = [IO.File]::ReadAllText($envFilePath, $utf8NoBom)
$envContent = $envContent.Replace("TABLET_UPTIME=''", "TABLET_UPTIME='$(Escape-ShSingleQuoted $tabletUptime)'")
[IO.File]::WriteAllText($envFilePath, $envContent, $utf8NoBom)

$copies = @(
  @{ Local = "C:\Omega\tmp\omega-security-status.txt"; Remote = "$remoteRoot/security/security-status.txt" },
  @{ Local = "C:\Omega\tmp\omega-security-last-check.txt"; Remote = "$remoteRoot/security/security-last-check.txt" },
  @{ Local = "C:\Omega\tmp\omega-security-watch.log"; Remote = "$remoteRoot/security/security-watch.log" },
  @{ Local = "C:\Omega\tmp\omega-security-events.jsonl"; Remote = "$remoteRoot/security/security-events.jsonl" },
  @{ Local = $pcStatusTxt; Remote = "$remoteRoot/pc/pc-status.txt" },
  @{ Local = (Join-Path $PcStatusRoot "painel-head.txt"); Remote = "$remoteRoot/painel-head.txt" },
  @{ Local = (Join-Path $PcStatusRoot "painel.env"); Remote = "$remoteRoot/painel.env" },
  @{ Local = (Join-Path $PcStatusRoot "painel"); Remote = "/data/data/com.termux/files/usr/bin/painel" }
)

foreach ($copy in $copies) {
  if (Test-Path -LiteralPath $copy.Local) {
    & $scpExe @scpBase $copy.Local "$target`:$($copy.Remote)"
    if ($LASTEXITCODE -ne 0) { throw "SCP failed for $($copy.Local)" }
  }
}

& $sshExe @sshBase $target "sed -i 's/\r$//' /data/data/com.termux/files/usr/bin/painel && chmod 700 /data/data/com.termux/files/usr/bin/painel"
if ($LASTEXITCODE -ne 0) { throw "Failed to chmod remote painel command." }

Write-Host "Tablet status updated over SSH: $target"
