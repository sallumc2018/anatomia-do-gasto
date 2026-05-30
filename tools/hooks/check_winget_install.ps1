# Hook PreToolUse (Bash/PowerShell): bloqueia winget install de binario nao auditado.
# Allowlist = IDs winget marcados em requirements-audit.txt nas linhas "via:winget <ID>".
# Mesma politica do pip gate, para binarios externos.

$ErrorActionPreference = "Stop"
try {
    $data = [Console]::In.ReadToEnd() | ConvertFrom-Json
} catch { exit 0 }

$cmd = $null
if ($data.tool_input) { $cmd = $data.tool_input.command }
if (-not $cmd) { exit 0 }

# remove trechos entre aspas (mencoes em string/doc nao sao comando)
$scan = $cmd -replace '"[^"]*"', '' -replace "'[^']*'", ''
# so age em "winget install" como comando real (inicio de segmento)
$segMatch = $false
foreach ($seg in ($scan -split '&&|\|\||\||;|\r?\n')) {
    if ($seg.Trim() -match '^winget\s+install\b') { $segMatch = $true; break }
}
if (-not $segMatch) { exit 0 }

# allowlist de IDs winget a partir do requirements-audit.txt
$auditPath = Join-Path $PSScriptRoot "..\..\requirements-audit.txt"
$allow = @()
if (Test-Path $auditPath) {
    foreach ($line in Get-Content $auditPath) {
        if ($line -match "via:winget\s+(\S+)") { $allow += $Matches[1].ToLower() }
    }
}

# extrai o ID do pacote apos "winget install" (corta no primeiro operador de shell)
$after = ($cmd -replace "(?s).*?winget\s+install\s+", "")
$after = (($after -split '(\&\&|\|\||\||;|2>|>|\n)')[0])
$tokens = @($after -split "\s+" | Where-Object { $_ -and ($_ -notmatch "^-") })
$pkg = if ($tokens.Count -gt 0) { ([string]$tokens[0]).ToLower().Trim() } else { "" }

if ($pkg -and ($allow -notcontains $pkg)) {
    $reason = "Bloqueado: binario winget nao auditado -> $pkg. " +
              "Audite com /catao e registre em requirements-audit.txt (linha 'via:winget $pkg') antes de instalar."
    $out = @{
        hookSpecificOutput = @{
            hookEventName            = "PreToolUse"
            permissionDecision       = "deny"
            permissionDecisionReason = $reason
        }
    } | ConvertTo-Json -Depth 5 -Compress
    Write-Output $out
}
exit 0
