# Hook Stop: ao fim do turno, se data/public mudou desde a ultima checagem,
# roda verificar_publicacao.py e avisa (systemMessage) somente se algo quebrou.
# Caminho rapido: se nada mudou em data/public, sai em ms (sem rodar o python de 4.4s).

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pub = Join-Path $root "data\public"
if (-not (Test-Path $pub)) { exit 0 }

$marker = Join-Path $root ".local\last_public_check.txt"

# mtime mais recente em data/public (apenas stat — rapido)
$latestItem = Get-ChildItem $pub -Recurse -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $latestItem) { exit 0 }
$latest = $latestItem.LastWriteTime

if (Test-Path $marker) {
    try {
        $lastChecked = [datetime](Get-Content $marker -Raw).Trim()
        if ($lastChecked -ge $latest) { exit 0 }  # nada novo desde a ultima checagem
    } catch { }
}

# roda a verificacao (so chega aqui se houve mudanca)
$out = & python (Join-Path $root "pipelines\testes\verificar_publicacao.py") 2>&1 | Out-String

# atualiza marcador
$markerDir = Split-Path $marker
if (-not (Test-Path $markerDir)) { New-Item -ItemType Directory -Force -Path $markerDir | Out-Null }
Set-Content -Path $marker -Value (Get-Date -Format "o") -Encoding utf8

if ($out -match "problema") {
    $resumo = ($out -replace "\s+", " ").Trim()
    if ($resumo.Length -gt 400) { $resumo = $resumo.Substring(0, 400) }
    # async + asyncRewake: exit 2 acorda o modelo com esta mensagem para corrigir
    Write-Output ("verificar_publicacao detectou problema apos mudanca em data/public: " + $resumo)
    exit 2
}
exit 0
