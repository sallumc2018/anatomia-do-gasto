param([string]$AlertPath = "C:\Omega\tmp\omega-security-alerts")

$pending = @(Get-ChildItem -LiteralPath $AlertPath -Filter "*.txt" -File -ErrorAction SilentlyContinue)
if ($pending.Count -eq 0) {
    Write-Host "Sem alertas pendentes."
    exit 0
}

$dest = Join-Path $AlertPath "reviewed-$(Get-Date -Format 'yyyyMMdd-HHmm')"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$pending | Move-Item -Destination $dest
Write-Host "$($pending.Count) alerta(s) arquivado(s) em reviewed-$(Split-Path $dest -Leaf)."
