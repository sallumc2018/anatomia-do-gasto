param(
  [string]$Targets = "data\manifests\benchmark_targets.csv",
  [string]$Output = "data\manifests\benchmark_http_latest.csv",
  [int]$TimeoutSec = 20
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $Targets)) {
  throw "Targets file not found: $Targets"
}

$rows = Import-Csv -LiteralPath $Targets
$measuredAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$results = New-Object System.Collections.Generic.List[object]

foreach ($row in $rows) {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $status = ""
  $bytes = ""
  $errorMessage = ""

  try {
    $response = Invoke-WebRequest -Uri $row.url -Method Get -TimeoutSec $TimeoutSec -MaximumRedirection 5 -UseBasicParsing
    $sw.Stop()
    $status = [int]$response.StatusCode
    $bytes = if ($null -ne $response.RawContent) {
      [System.Text.Encoding]::UTF8.GetByteCount($response.RawContent)
    } else {
      0
    }
  } catch {
    $sw.Stop()
    $status = "erro"
    $errorMessage = $_.Exception.Message
  }

  $results.Add([pscustomobject]@{
    measured_at_utc = $measuredAt
    id = $row.id
    nome = $row.nome
    categoria = $row.categoria
    municipio = $row.municipio
    url = $row.url
    status_http = $status
    elapsed_ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 0)
    bytes = $bytes
    ferramenta = "Invoke-WebRequest"
    limitacao = "Mede disponibilidade e tempo HTTP simples; nao substitui Lighthouse, UX, acessibilidade ou cobertura de dados."
    erro = $errorMessage
  })
}

$dir = Split-Path -Parent $Output
if ($dir -and -not (Test-Path -LiteralPath $dir)) {
  New-Item -ItemType Directory -Path $dir | Out-Null
}

$results | Export-Csv -LiteralPath $Output -NoTypeInformation -Encoding UTF8
Write-Host "Wrote $($results.Count) benchmark rows to $Output"
