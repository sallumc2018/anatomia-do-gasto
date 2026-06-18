Param(
  [string]$ConfigPath = "C:\Omega\03_Ferramentas\infra\omega-security-alerts.json",
  [string]$CredentialPath = "C:\Omega\Sensivel\infra\secrets\omega-security-smtp.credential.xml"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path (Split-Path $ConfigPath) | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $CredentialPath) | Out-Null

if (-not (Test-Path -LiteralPath $ConfigPath)) {
  $sample = [ordered]@{
    enabled = $false
    smtpHost = "smtp.gmail.com"
    smtpPort = 587
    enableSsl = $true
    from = "seu-email@gmail.com"
    to = @("seu-email@gmail.com")
  }
  $sample | ConvertTo-Json -Depth 4 | Set-Content -Path $ConfigPath -Encoding UTF8
  Write-Host "Created config template: $ConfigPath"
  Write-Host "Edit enabled/from/to before enabling email alerts."
}

Write-Host "Enter the SMTP username and app password. The credential is encrypted for this Windows user via DPAPI."
$credential = Get-Credential
$credential | Export-Clixml -Path $CredentialPath

Write-Host "Credential saved: $CredentialPath"
