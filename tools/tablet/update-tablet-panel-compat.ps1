param(
    [string]$Repo = "C:\Omega\02_Repos\anatomia-do-gasto",
    [string]$TabletIp = "192.168.15.18",
    [string]$SshPort = "8022",
    [string]$User = "u0_a151"
)

$ErrorActionPreference = "Continue"

$Key = "C:\Omega\Sensivel\infra\secrets\omega-tablet-status-ed25519"
$KnownHosts = "C:\Omega\Sensivel\infra\secrets\omega-tablet-known_hosts"

$State = Join-Path $Repo ".local\state"
$EnvFile = Join-Path $State "painel.env"
$PcStatus = Join-Path $State "omega-pc-status.txt"
$Dashboard = Join-Path $State "tablet-dashboard-now.txt"

$Bullet = [char]0x2022
$Cced = [char]0x00E7
$Atil = [char]0x00E3
$Otil = [char]0x00F5

$UpdatesLabel = "Atualiza$Cced${Otil}es"
$DeployText = "Produ$Cced${Atil}o online"

function Read-EnvFile {
    param([string]$Path)

    $map = @{}

    if (Test-Path $Path) {
        Get-Content $Path | ForEach-Object {
            $line = $_.Trim()

            if ($line -match "^([A-Z0-9_]+)=(.*)$") {
                $keyName = $matches[1]
                $value = $matches[2].Trim()

                if ($value.StartsWith("'") -and $value.EndsWith("'")) {
                    $value = $value.Substring(1, $value.Length - 2)
                }

                $map[$keyName] = $value
            }
        }
    }

    return $map
}

function Fix-Text {
    param([string]$Text)

    if ($null -eq $Text) {
        return ""
    }

    $x = $Text
    $x = $x.Replace("Â-", $Bullet)
    $x = $x.Replace("Â•", $Bullet)
    $x = $x.Replace("Âº", $Bullet)
    $x = $x.Replace("â€¢", $Bullet)
    $x = $x.Replace("Ã§", "ç")
    $x = $x.Replace("Ã£", "ã")
    $x = $x.Replace("Ã¡", "á")
    $x = $x.Replace("Ã©", "é")
    $x = $x.Replace("Ãª", "ê")
    $x = $x.Replace("Ã­", "í")
    $x = $x.Replace("Ã³", "ó")
    $x = $x.Replace("Ãµ", "õ")
    $x = $x.Replace("Ãº", "ú")
    $x = $x.Replace("Ãš", "Ú")
    $x = $x.Replace(" tablet", " Tablet")

    return $x
}

function Get-WifiRates {
    $rx = "N/D"
    $tx = "N/D"

    try {
        $wifi = netsh wlan show interfaces 2>$null

        foreach ($line in $wifi) {
            $l = $line.Trim()

            if ($l -match "(?i)(receive|recep).*?\(Mbps\)\s*:\s*([0-9]+([,.][0-9]+)?)") {
                $rx = "$($matches[2]) Mbps"
            }

            if ($l -match "(?i)(transmit|transmiss).*?\(Mbps\)\s*:\s*([0-9]+([,.][0-9]+)?)") {
                $tx = "$($matches[2]) Mbps"
            }
        }
    } catch {}

    return @{
        Download = $rx
        Upload = $tx
    }
}

$envMap = Read-EnvFile $EnvFile
$wifi = Get-WifiRates

$pcUptime = Fix-Text $envMap["PC_UPTIME"]
$tabletUptime = Fix-Text $envMap["TABLET_UPTIME"]

if ([string]::IsNullOrWhiteSpace($tabletUptime)) {
    $tabletUptime = "N/D"
}

$watchdog = Fix-Text $envMap["WATCHDOG_STATUS"]

$content = @"
ANATOMIA DO GASTO - PC AGORA
Atualizado: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Memoria total: $($envMap["MEMORY_TOTAL"])
Memoria usada:  $($envMap["MEMORY_USED"])
Memoria livre:  $($envMap["MEMORY_FREE"])
CPU usada:      $($envMap["CPU_USED"])

Site ONG:       $($envMap["ONG_SITE"])
Deploy:         $DeployText
GitHub:         $($envMap["ONG_GITHUB"])
Mudancas:       $($envMap["ONG_CHANGES"])

Rede:           $($envMap["PC_REDE"])
Wi-Fi:          Download $($wifi.Download) $Bullet Upload $($wifi.Upload)
Firewall:       $($envMap["PC_FIREWALL"])
Defender:       $($envMap["PC_DEFENDER"])
$UpdatesLabel`:    $($envMap["PC_UPDATES"])

Tablet SSH:     $($envMap["OMEGA_TABLET_SSH"])
Sync:           $($envMap["OMEGA_SYNC"])
Alertas:        $($envMap["OMEGA_ALERTAS"])
Dev server:     $($envMap["OMEGA_DEV_SERVER"])
Energia:        $($envMap["OMEGA_ENERGIA"])

Disco:          $($envMap["OMEGA_DISCO"])
Uptime:         $pcUptime PC $Bullet $tabletUptime Tablet

Watchdog:       $watchdog
Watchdog ativo: $($envMap["WATCHDOG_ACTIVE"])
Watchdog data:  $($envMap["WATCHDOG_UPDATED"])
"@

[System.IO.File]::WriteAllText($Dashboard, $content, [System.Text.UTF8Encoding]::new($false))

$Ssh = "ssh -i `"$Key`" -p $SshPort -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=`"$KnownHosts`" -o BatchMode=yes -o ConnectTimeout=5 $User@$TabletIp"
$Scp = "scp -O -i `"$Key`" -P $SshPort -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=`"$KnownHosts`" -o BatchMode=yes -o ConnectTimeout=5"

cmd /c "$Ssh `"mkdir -p ~/AnatomiaTerminal ~/AnatomiaTerminal/pc ~/AnatomiaTerminal/security ~/AnatomiaTerminal/pc/logs`"" | Out-Null
cmd /c "$Scp `"$Dashboard`" `"$User@$TabletIp`:~/AnatomiaTerminal/painel-agora.txt`"" | Out-Null
cmd /c "$Scp `"$Dashboard`" `"$User@$TabletIp`:~/AnatomiaTerminal/pc/tablet-dashboard-now.txt`"" | Out-Null

if (Test-Path $EnvFile) {
    cmd /c "$Scp `"$EnvFile`" `"$User@$TabletIp`:~/AnatomiaTerminal/painel.env`"" | Out-Null
    cmd /c "$Scp `"$EnvFile`" `"$User@$TabletIp`:~/AnatomiaTerminal/pc/painel.env`"" | Out-Null
}

if (Test-Path $PcStatus) {
    cmd /c "$Scp `"$PcStatus`" `"$User@$TabletIp`:~/AnatomiaTerminal/pc/pc-status.txt`"" | Out-Null
    cmd /c "$Scp `"$PcStatus`" `"$User@$TabletIp`:~/AnatomiaTerminal/pc/omega-pc-status.txt`"" | Out-Null
}

Write-Host "Tablet panel compat updated: $Dashboard"
