#Requires -RunAsAdministrator
# Configura SSH Server no PC para acoes remotas do tablet
# Uso: powershell -ExecutionPolicy Bypass -File tools\tablet\setup-tablet-actions.ps1

$TabletIP     = "192.168.15.18"
$PcUser       = $env:USERNAME
$PcHome       = $env:USERPROFILE
$RepoRoot     = "C:\Omega\02_Repos\anatomia-do-gasto"
$TabletKeyDir = "C:\Omega\Sensivel\infra\secrets"
$TabletKey    = "$TabletKeyDir\omega-tablet-actions-ed25519"
$AuthKeys     = "$PcHome\.ssh\authorized_keys"
$SshKeygenExe = "C:\Windows\System32\OpenSSH\ssh-keygen.exe"
$SshExe       = "C:\Windows\System32\OpenSSH\ssh.exe"
$ScpExe       = "C:\Windows\System32\OpenSSH\scp.exe"

$StatusCfg    = "C:\Omega\03_Ferramentas\infra\omega-tablet-ssh.json"
$KnownHosts   = "C:\Omega\Sensivel\infra\secrets\omega-tablet-known_hosts"
$config       = Get-Content $StatusCfg -Raw | ConvertFrom-Json
$target       = "$($config.user)@$($config.host)"
$remoteRoot   = [string]$config.remoteRoot
$scpBase = @("-i",[string]$config.keyPath,"-P",[string]$config.port,
    "-o","IdentitiesOnly=yes","-o","StrictHostKeyChecking=yes",
    "-o","UserKnownHostsFile=$KnownHosts","-o","BatchMode=yes","-o","ConnectTimeout=5")
$sshBase = @("-i",[string]$config.keyPath,"-p",[string]$config.port,
    "-o","IdentitiesOnly=yes","-o","StrictHostKeyChecking=yes",
    "-o","UserKnownHostsFile=$KnownHosts","-o","BatchMode=yes","-o","ConnectTimeout=5")

Write-Host "=== Setup: acoes do tablet ===" -ForegroundColor Cyan

# 1. Instalar OpenSSH Server
Write-Host "`n[1] OpenSSH Server..."
$cap = Get-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
if ($cap.State -ne "Installed") {
    Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0 | Out-Null
    Write-Host "    Instalado."
} else { Write-Host "    Ja instalado." }

Set-Service -Name sshd -StartupType Automatic
Start-Service -Name sshd -ErrorAction SilentlyContinue

# 2. Configurar sshd: apenas chaves, sem senha
Write-Host "`n[2] Configurando sshd_config..."
$cfg = "C:\ProgramData\ssh\sshd_config"
$content = Get-Content $cfg -Raw
$replacements = @{
    '(?m)^#?\s*PasswordAuthentication\s+\S+'   = 'PasswordAuthentication no'
    '(?m)^#?\s*PubkeyAuthentication\s+\S+'     = 'PubkeyAuthentication yes'
    '(?m)^#?\s*AuthorizedKeysFile\s+\S+'       = 'AuthorizedKeysFile .ssh/authorized_keys'
}
foreach ($pat in $replacements.Keys) {
    if ($content -match $pat) { $content = $content -replace $pat, $replacements[$pat] }
    else { $content += "`n$($replacements[$pat])" }
}
$content | Set-Content $cfg -Encoding UTF8

# 3. Gerar chave do tablet (se nao existir)
Write-Host "`n[3] Chave SSH tablet -> PC..."
New-Item -ItemType Directory -Force -Path $TabletKeyDir | Out-Null
if (-not (Test-Path $TabletKey)) {
    cmd /c "`"$SshKeygenExe`" -q -t ed25519 -f `"$TabletKey`" -N `"`" -C omega-tablet-actions" | Out-Null
    Write-Host "    Gerada: $TabletKey"
} else { Write-Host "    Ja existe." }

# 4. Autorizar chave no PC
Write-Host "`n[4] authorized_keys..."
$pubKey = (Get-Content "${TabletKey}.pub").Trim()
New-Item -ItemType Directory -Force -Path "$PcHome\.ssh" | Out-Null
if (-not (Test-Path $AuthKeys)) {
    $pubKey | Set-Content $AuthKeys -Encoding UTF8
} elseif ((Get-Content $AuthKeys -Raw) -notmatch ($pubKey -split " ")[1]) {
    Add-Content $AuthKeys "`n$pubKey" -Encoding UTF8
} else { Write-Host "    Ja autorizada." }
icacls $AuthKeys /inheritance:r /grant "${PcUser}:(R,W)" 2>$null | Out-Null

# 5. Firewall: SSH apenas do tablet
Write-Host "`n[5] Firewall SSH..."
netsh advfirewall firewall delete rule name="Omega-SSH-Tablet" 2>$null | Out-Null
netsh advfirewall firewall add rule name="Omega-SSH-Tablet" `
    dir=in action=allow protocol=TCP localport=22 remoteip=$TabletIP | Out-Null
Write-Host "    Porta 22 permitida apenas de $TabletIP"

# 6. Reiniciar sshd
Write-Host "`n[6] Reiniciando sshd..."
Restart-Service sshd
Start-Sleep -Seconds 2

# 7. Obter fingerprint do PC para o tablet confiar
Write-Host "`n[7] Host key do PC..."
$pcKeyFile = "C:\ProgramData\ssh\ssh_host_ed25519_key.pub"
if (Test-Path $pcKeyFile) {
    $pcPubKey = (Get-Content $pcKeyFile).Trim()
    $pcKnownHostsLine = "192.168.15.6 $pcPubKey"
    $tmpKnown = "C:\Omega\tmp\omega-pc-known_hosts"
    $pcKnownHostsLine | Set-Content $tmpKnown -Encoding ASCII
    & $ScpExe @scpBase $tmpKnown "${target}:${remoteRoot}/omega-pc-known_hosts"
    & $SshExe @sshBase $target "mkdir -p ~/.ssh && cp ${remoteRoot}/omega-pc-known_hosts ~/.ssh/omega_pc_known_hosts && chmod 600 ~/.ssh/omega_pc_known_hosts"
    Write-Host "    known_hosts do PC copiado para o tablet."
}

# 8. Copiar chave privada para o tablet
Write-Host "`n[8] Copiando chave para o tablet..."
& $SshExe @sshBase $target "mkdir -p ~/.ssh"
& $ScpExe @scpBase $TabletKey "${target}:~/.ssh/omega_pc_ed25519"
& $ScpExe @scpBase "${TabletKey}.pub" "${target}:~/.ssh/omega_pc_ed25519.pub"
& $SshExe @sshBase $target "chmod 600 ~/.ssh/omega_pc_ed25519"
Write-Host "    Chave copiada."

# 9. Criar scripts de acao no tablet
Write-Host "`n[9] Scripts de acao no tablet..."
$utf8NoBom = [Text.UTF8Encoding]::new($false)
$pcSsh = "ssh -i ~/.ssh/omega_pc_ed25519 -o StrictHostKeyChecking=yes -o UserKnownHostsFile=~/.ssh/omega_pc_known_hosts -o BatchMode=yes -o ConnectTimeout=5 ${PcUser}@192.168.15.6"
$ps    = "powershell -NoProfile -ExecutionPolicy Bypass"

$actions = @(
  @{
    Name = "omega-sync"
    Body = @(
      "#!/data/data/com.termux/files/usr/bin/sh",
      "# Forca sync imediato do painel",
      "echo 'Sincronizando...'",
      "$pcSsh `"$ps -File \`"$RepoRoot\tools\tablet\update-tablet-status-ssh.ps1\`"`"",
      "echo 'Pronto.'"
    )
  },
  @{
    Name = "omega-alertas"
    Body = @(
      "#!/data/data/com.termux/files/usr/bin/sh",
      "# Arquiva alertas de seguranca pendentes",
      "echo 'Verificando alertas...'",
      "$pcSsh `"$ps -File \`"$RepoRoot\tools\tablet\tablet-archive-alerts.ps1\`"`"",
      "echo 'Pronto.'"
    )
  },
  @{
    Name = "omega-status"
    Body = @(
      "#!/data/data/com.termux/files/usr/bin/sh",
      "# Mostra status do PC em tempo real",
      "$pcSsh `"$ps -File \`"$RepoRoot\tools\tablet\tablet-pc-status.ps1\`"`""
    )
  }
)

foreach ($a in $actions) {
    $local = "C:\Omega\tmp\$($a.Name).sh"
    [IO.File]::WriteAllText($local, ($a.Body -join "`n") + "`n", $utf8NoBom)
    & $ScpExe @scpBase $local "${target}:${remoteRoot}/$($a.Name).sh"
    & $SshExe @sshBase $target "chmod +x ${remoteRoot}/$($a.Name).sh && ln -sf ${remoteRoot}/$($a.Name).sh /data/data/com.termux/files/usr/bin/$($a.Name)"
    Write-Host "    $($a.Name) -> comando '$($a.Name)' disponivel"
}

Write-Host "`n=== Concluido ===" -ForegroundColor Green
Write-Host "No tablet, use:" -ForegroundColor Yellow
Write-Host "  omega-sync     - forca sync imediato do painel"
Write-Host "  omega-alertas  - arquiva todos os alertas pendentes"
Write-Host "  omega-status   - status do PC ao vivo"
