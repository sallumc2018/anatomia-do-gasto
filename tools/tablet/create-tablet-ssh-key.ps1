param(
  [string]$KeyPath = "C:\Omega\Sensivel\infra\secrets\omega-tablet-status-ed25519"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path (Split-Path $KeyPath) | Out-Null

if (Test-Path -LiteralPath $KeyPath) {
  Write-Host "Key already exists: $KeyPath"
} else {
  & ssh-keygen.exe -t ed25519 -f $KeyPath -N "" -C "omega-tablet-status" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "ssh-keygen failed with exit code $LASTEXITCODE"
  }
  Write-Host "Created SSH key: $KeyPath"
}

Write-Host ""
Write-Host "Public key to add in Termux ~/.ssh/authorized_keys:"
Get-Content -Path "$KeyPath.pub"
Write-Host ""
Write-Host "Termux commands:"
Write-Host "  pkg update"
Write-Host "  pkg install openssh"
Write-Host "  mkdir -p ~/.ssh ~/AnatomiaTerminal/security ~/AnatomiaTerminal/pc"
Write-Host "  chmod 700 ~/.ssh"
Write-Host "  echo '<PUBLIC_KEY_ABOVE>' >> ~/.ssh/authorized_keys"
Write-Host "  chmod 600 ~/.ssh/authorized_keys"
Write-Host "  sshd"
Write-Host "  whoami && ip addr"
Write-Host "  ssh-keygen -lf `$PREFIX/etc/ssh/ssh_host_ed25519_key.pub"
