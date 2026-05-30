# Hook PreToolUse (Write/Edit): quando o arquivo alvo esta em data/public,
# injeta um lembrete (additionalContext) para rodar verificar_publicacao.py e
# registrar em qa.csv antes de considerar publicado. Nao bloqueia.
#
# additionalContext vai para o modelo (Claude), nao gera ruido visual para o usuario.

$ErrorActionPreference = "Stop"
try {
    $data = [Console]::In.ReadToEnd() | ConvertFrom-Json
} catch { exit 0 }

$fp = $null
if ($data.tool_input) { $fp = $data.tool_input.file_path }
if (-not $fp) { exit 0 }

if ($fp -match "data[\\/]public[\\/]") {
    $msg = "Lembrete (hook): este arquivo esta em data/public. Antes de considerar publicado: " +
           "(1) rode python pipelines/testes/verificar_publicacao.py; " +
           "(2) garanta entrada em data/manifests/datasets.csv; " +
           "(3) registre em data/manifests/sorocaba/qa.csv. " +
           "Nao publique texto bruto como serie estruturada."
    $out = @{
        hookSpecificOutput = @{
            hookEventName     = "PreToolUse"
            additionalContext = $msg
        }
    } | ConvertTo-Json -Depth 5 -Compress
    Write-Output $out
}
exit 0
