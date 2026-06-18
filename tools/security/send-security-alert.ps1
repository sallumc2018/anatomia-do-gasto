Param(
  [Parameter(Mandatory = $true)]
  [string]$Reason,
  [string]$Severity = "ALERT",
  [string]$DetailsPath = "C:\Omega\tmp\omega-security-last-check.txt",
  [string]$ConfigPath = "C:\Omega\03_Ferramentas\infra\omega-security-alerts.json",
  [string]$CredentialPath = "C:\Omega\Sensivel\infra\secrets\omega-security-smtp.credential.xml",
  [string]$OutboxPath = "C:\Omega\tmp\omega-security-alerts"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutboxPath | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$subject = "[$Severity] Anatomia do Gasto security watch"
$details = if (Test-Path -LiteralPath $DetailsPath) {
  (Get-Content -Path $DetailsPath -Raw -Encoding UTF8).Trim()
} else {
  "No details file found at $DetailsPath."
}

$body = @(
  "Anatomia do Gasto security alert",
  "Time: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")",
  "Severity: $Severity",
  "Reason: $Reason",
  "Computer: $env:COMPUTERNAME",
  "User: $env:USERNAME",
  "",
  "Details:",
  $details
) -join [Environment]::NewLine

$alertFile = Join-Path $OutboxPath "$stamp-$Severity.txt"
$body | Set-Content -Path $alertFile -Encoding UTF8

if (-not (Test-Path -LiteralPath $ConfigPath)) {
  Write-Host "Alert queued locally: $alertFile"
  Write-Host "Email not sent; config not found: $ConfigPath"
  exit 0
}

$config = Get-Content -Path $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($config.enabled -ne $true) {
  Write-Host "Alert queued locally: $alertFile"
  Write-Host "Email not sent; alerts are disabled in $ConfigPath"
  exit 0
}

if (-not (Test-Path -LiteralPath $CredentialPath)) {
  Write-Host "Alert queued locally: $alertFile"
  Write-Host "Email not sent; credential not found: $CredentialPath"
  exit 0
}

$credential = Import-Clixml -Path $CredentialPath
$message = [System.Net.Mail.MailMessage]::new()
$message.From = [System.Net.Mail.MailAddress]::new([string]$config.from)
foreach ($recipient in @($config.to)) {
  if (-not [string]::IsNullOrWhiteSpace($recipient)) {
    $message.To.Add([string]$recipient)
  }
}
$message.Subject = $subject
$message.Body = $body

$client = [System.Net.Mail.SmtpClient]::new([string]$config.smtpHost, [int]$config.smtpPort)
$client.EnableSsl = [bool]$config.enableSsl
$client.Credentials = $credential.GetNetworkCredential()
$client.Send($message)

Write-Host "Alert sent by email and queued locally: $alertFile"
