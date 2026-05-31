# Hook PreToolUse (Bash/PowerShell): bloqueia pip install de pacote nao auditado.
# Espelha a politica de seguranca npm para pip. Le requirements-audit.txt como allowlist.
# Permite uso explicito de -r requirements-audit.txt. Caso contrario, exige que cada
# pacote esteja listado no arquivo auditado (Catao aprova antes de adicionar la).
#
# Entrada: JSON do hook via stdin (tool_input.command)
# Saida: JSON com permissionDecision=deny quando ha pacote nao listado.

$ErrorActionPreference = "Stop"
try {
    $raw = [Console]::In.ReadToEnd()
    $data = $raw | ConvertFrom-Json
} catch { exit 0 }  # sem payload valido -> nao interfere

$cmd = $null
if ($data.tool_input) { $cmd = $data.tool_input.command }
if (-not $cmd) { exit 0 }

# Detecta "pip install" apenas como COMANDO real (inicio de um segmento de shell).
# Remove trechos entre aspas primeiro: "pip install X" dentro de string/heredoc/echo
# (provenance, docs) nao eh comando. Comando real nao fica entre aspas.
$scan = $cmd -replace '"[^"]*"', '' -replace "'[^']*'", ''
$segments = $scan -split '&&|\|\||\||;|\r?\n'
$pipSeg = $null
foreach ($seg in $segments) {
    $s = $seg.Trim()
    if ($s -match '^(?:py(?:thon3?)?(?:\s+-\S+)*\s+-m\s+)?pip3?\s+install\b') {
        $pipSeg = $s; break
    }
}
if (-not $pipSeg) { exit 0 }  # nenhum pip install como comando real

# uso do arquivo auditado e sempre permitido
if ($pipSeg -match "requirements-audit\.txt") { exit 0 }

# allowlist a partir do requirements-audit.txt
$auditPath = Join-Path $PSScriptRoot "..\..\requirements-audit.txt"
$listed = @()
if (Test-Path $auditPath) {
    $listed = Get-Content $auditPath |
        Where-Object { $_ -notmatch "^\s*#" -and $_ -match "\S" } |
        ForEach-Object { (($_ -split "[=<>\s\\]")[0]).ToLower().Trim() } |
        Where-Object { $_ }
}

# extrai pacotes do trecho apos "pip install" (non-greedy desde o primeiro pip install)
$after = ($cmd -replace "(?s).*?pip\s+install\s+", "")
# corta no primeiro operador de shell (&&, ||, |, ;, >, 2>, nova linha)
$after = (($after -split '(\&\&|\|\||\||;|2>|>|\n)')[0])
$tokens = @($after -split "\s+" | Where-Object { $_ -and ($_ -notmatch "^-") })
$unlisted = @()
foreach ($t in $tokens) {
    $name = (($t -split "[=<>\[]")[0]).ToLower().Trim()
    if ($name -and ($listed -notcontains $name)) { $unlisted += $name }
}

if ($unlisted.Count -gt 0) {
    $reason = "Bloqueado: pacote(s) nao auditado(s) em requirements-audit.txt -> " +
              ($unlisted -join ", ") +
              ". Audite com /catao e adicione ao requirements-audit.txt antes de instalar " +
              "(ou use: pip install --require-hashes -r requirements-audit.txt)."
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
