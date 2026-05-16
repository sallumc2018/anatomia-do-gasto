#Requires -RunAsAdministrator
# Hardening de firewall para Anatomia do Gasto
# Executa com: powershell -ExecutionPolicy Bypass -File tools\security\harden-firewall-admin.ps1
# Requer: Executar como Administrador

$TabletIP   = "192.168.15.18"
$LaptopIP   = "192.168.15.11"  # Laptop-Sallum

Write-Host "=== Hardening de firewall — Anatomia do Gasto ===" -ForegroundColor Cyan

# 1. Habilitar log de conexoes bloqueadas e permitidas
Write-Host "`n[1] Habilitando log de firewall..."
netsh advfirewall set allprofiles logging droppedconnections enable
netsh advfirewall set allprofiles logging allowedconnections enable
netsh advfirewall set allprofiles logging maxfilesize 8192
Write-Host "    Log: $env:SystemRoot\system32\LogFiles\Firewall\pfirewall.log"

# 2. Restringir SMB (445/139) a apenas dispositivos conhecidos
Write-Host "`n[2] Bloqueando SMB de dispositivos desconhecidos..."
# Remover regra anterior se existir
netsh advfirewall firewall delete rule name="Omega-Block-SMB-Unknown" 2>$null

# Windows Firewall nao suporta "negar exceto lista" — bloqueamos cada IP nao autorizado explicitamente
$unknownIPs = @("192.168.15.4", "192.168.15.7", "192.168.15.8", "192.168.15.10")
foreach ($ip in $unknownIPs) {
    $ruleName = "Omega-Block-SMB-$ip"
    netsh advfirewall firewall delete rule name=$ruleName 2>$null
    netsh advfirewall firewall add rule name=$ruleName dir=in action=block protocol=TCP localport=139,445 remoteip=$ip
    netsh advfirewall firewall add rule name="${ruleName}-UDP" dir=in action=block protocol=UDP localport=137,138 remoteip=$ip
    Write-Host "    Bloqueado SMB de $ip"
}

# 3. Restringir TRIGONE (19150) apenas ao tablet
Write-Host "`n[3] Restringindo TRIGONE (19150) ao tablet ($TabletIP)..."
netsh advfirewall firewall delete rule name="Omega-TRIGONE-Allow" 2>$null
netsh advfirewall firewall delete rule name="Omega-Block-TRIGONE-Others" 2>$null

netsh advfirewall firewall add rule name="Omega-TRIGONE-Allow" dir=in action=allow protocol=TCP localport=19150 remoteip=$TabletIP
netsh advfirewall firewall add rule name="Omega-Block-TRIGONE-Others" dir=in action=block protocol=TCP localport=19150 remoteip=LocalSubnet
Write-Host "    TRIGONE: permitido $TabletIP, bloqueado demais"

# 4. Bloquear acesso externo ao dev server Next.js (3000)
Write-Host ""
Write-Host "[4] Bloqueando porta 3000 (Next.js dev) de acesso externo..."
netsh advfirewall firewall delete rule name="Omega-Block-DevServer" 2>$null
netsh advfirewall firewall add rule name="Omega-Block-DevServer" dir=in action=block protocol=TCP localport=3000 remoteip=LocalSubnet
Write-Host "    Porta 3000 bloqueada para toda a rede local (apenas localhost acessa)"

# 5. Remover compartilhamento Users (C:\Users nao deve ser compartilhado)
Write-Host ""
Write-Host "[5] Removendo compartilhamento 'Users' (C:\Users)..."
$usersShare = Get-SmbShare -Name "Users" -ErrorAction SilentlyContinue
if ($usersShare) {
    Remove-SmbShare -Name "Users" -Force
    Write-Host "    OK - compartilhamento 'Users' removido"
} else {
    Write-Host "    Compartilhamento 'Users' nao encontrado (ja removido ou inexistente)"
}

# 6. Bloquear CDP (5040) — Connected Devices Platform (Phone Link, Nearby Sharing)
Write-Host "`n[6] Bloqueando CDP/Connected Devices (porta 5040)..."
netsh advfirewall firewall delete rule name="Omega-Block-CDP" 2>$null
netsh advfirewall firewall add rule name="Omega-Block-CDP" dir=in action=block protocol=TCP localport=5040 remoteip=LocalSubnet
Write-Host "    CDP TCP 5040 bloqueado da rede local"

# 7. Bloquear WSD (5357) — Windows Service Discovery expoe o PC na rede local
Write-Host "`n[6] Bloqueando WSD/Function Discovery (porta 5357)..."
Write-Host "    Motivo: regra built-in 'WSD-In' permite que outros dispositivos descubram este PC"
netsh advfirewall firewall delete rule name="Omega-Block-WSD" 2>$null
netsh advfirewall firewall add rule name="Omega-Block-WSD" dir=in action=block protocol=TCP localport=5357 remoteip=LocalSubnet
netsh advfirewall firewall add rule name="Omega-Block-WSD-UDP" dir=in action=block protocol=UDP localport=5357 remoteip=LocalSubnet
Write-Host "    WSD TCP/UDP 5357 bloqueado da rede local"
Write-Host "    Efeito: este PC nao aparecera em 'Rede' no Explorer de outros dispositivos"

Write-Host "`n=== Hardening concluido ===" -ForegroundColor Green
Write-Host "Para verificar regras criadas:"
Write-Host "  netsh advfirewall firewall show rule name=all | Select-String 'Omega'"
