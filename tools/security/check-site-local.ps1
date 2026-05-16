Param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$BaseUrl = "",
  [switch]$SkipBuild,
  [switch]$SiteOnly
)

$ErrorActionPreference = "Stop"

$failures = New-Object System.Collections.Generic.List[string]

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "== $Message =="
}

function Add-Failure([string]$Message) {
  $script:failures.Add($Message) | Out-Null
  Write-Host "FAIL: $Message" -ForegroundColor Red
}

function Assert-FileContains([string]$Path, [string]$Pattern, [string]$Message) {
  $fullPath = Join-Path $Root $Path
  if (-not (Test-Path -LiteralPath $fullPath)) {
    Add-Failure "Arquivo ausente: $Path"
    return
  }

  if (-not (Select-String -LiteralPath $fullPath -Pattern $Pattern -Quiet)) {
    Add-Failure $Message
  } else {
    Write-Host "OK: $Message"
  }
}

function Assert-FileNotContains([string]$Path, [string]$Pattern, [string]$Message) {
  $fullPath = Join-Path $Root $Path
  if (-not (Test-Path -LiteralPath $fullPath)) {
    Add-Failure "Arquivo ausente: $Path"
    return
  }

  if (Select-String -LiteralPath $fullPath -Pattern $Pattern -Quiet) {
    Add-Failure $Message
  } else {
    Write-Host "OK: $Message"
  }
}

function Invoke-CheckedCommand([string]$Command, [string]$WorkingDirectory) {
  Write-Host "> $Command"
  Push-Location $WorkingDirectory
  try {
    cmd.exe /c $Command
    if ($LASTEXITCODE -ne 0) {
      Add-Failure "Comando falhou ($LASTEXITCODE): $Command"
    }
  } finally {
    Pop-Location
  }
}

function ConvertTo-RepoPath([string]$Path) {
  return ($Path -replace '\\', '/').Trim().Trim('"')
}

function Get-GitStatusEntries([string]$Pathspec = "") {
  $args = @("-C", $Root, "status", "--porcelain=v1", "--untracked-files=all")
  if ($Pathspec.Trim().Length -gt 0) {
    $args += @("--", $Pathspec)
  }

  $lines = & git @args
  foreach ($line in $lines) {
    if ($line.Length -lt 4) { continue }
    $path = $line.Substring(3)
    if ($path -match " -> ") {
      $path = ($path -split " -> ", 2)[1]
    }

    [PSCustomObject]@{
      Status = $line.Substring(0, 2)
      Path = ConvertTo-RepoPath $path
    }
  }
}

function Get-GitStatusEntriesForScope([string[]]$Pathspecs) {
  if ($Pathspecs.Count -eq 0) {
    return @(Get-GitStatusEntries)
  }

  $entries = New-Object System.Collections.Generic.List[object]
  foreach ($pathspec in $Pathspecs) {
    foreach ($entry in @(Get-GitStatusEntries $pathspec)) {
      $entries.Add($entry) | Out-Null
    }
  }

  return @($entries | Sort-Object Path, Status -Unique)
}

function Test-AnyPattern([string]$Value, [string[]]$Patterns) {
  foreach ($pattern in $Patterns) {
    if ($Value -match $pattern) {
      return $true
    }
  }
  return $false
}

function Test-Url([string]$Url, [int]$ExpectedStatus) {
  try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -MaximumRedirection 0 -UseBasicParsing -ErrorAction Stop
    $status = [int]$response.StatusCode
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $status = [int]$_.Exception.Response.StatusCode
    } else {
      Add-Failure "Sem resposta HTTP: $Url"
      return
    }
  }

  if ($status -ne $ExpectedStatus) {
    Add-Failure "HTTP $status em $Url; esperado $ExpectedStatus"
  } else {
    Write-Host "OK: HTTP $ExpectedStatus $Url"
  }
}

Write-Host "Anatomia do Gasto - auditoria local read-only"
Write-Host "Root: $Root"

$releasePathspecs = @()
if ($SiteOnly) {
  $releasePathspecs = @("apps/web", "data/public")
  Write-Host "Modo: site-only (escopo Git auditado: apps/web, data/public)"
} else {
  Write-Host "Modo: release completo (escopo Git auditado: repositorio inteiro)"
}

$sensitiveFilePatterns = @(
  '(^|/)\.env($|[./])',
  '\.credential\.xml$',
  '\.pem$',
  '\.key$',
  '(^|/)id_rsa',
  '(^|/)id_ed25519',
  'known_hosts$',
  'authorized_keys$',
  'recovery',
  'secret',
  'token',
  'cookies?'
)

$operatorArtifactPatterns = @(
  '(^|/)\.local/',
  '(^|/)tmp/',
  '(^|/)logs?/',
  'fw-allow-rules\.txt$',
  'omega-security-.*\.(json|log|txt|xml)$',
  'omega-tablet-.*\.(json|log|txt|xml)$',
  'tablet-.*\.(log|xml|png|json)$',
  'window_dump\.xml$',
  'screen(cap|shot).*\.png$'
)

$sensitiveTabletPatterns = @(
  '^tools/tablet/create-tablet-ssh-key\.ps1$',
  '^tools/tablet/setup-tablet-actions\.ps1$',
  '^tools/tablet/start-tablet-status-sync-loop\.ps1$',
  '^tools/tablet/tablet-status-sync-loop\.ps1$',
  '^tools/tablet/tablet-pc-status\.ps1$',
  '^tools/tablet/tablet-archive-alerts\.ps1$',
  '^tools/tablet/update-tablet-status(-ssh)?\.ps1$',
  '^tools/tablet/termux-bootstrap\.sh$',
  '^tools/tablet/termux-sshd-compat\.sh$'
)

$operationalScriptPatterns = @(
  '^tools/tablet/.*(ssh|sshd|status|sync|actions|bootstrap|archive).*',
  '^tools/security/harden-firewall-admin\.ps1$'
)

Write-Step "Estado Git"
Invoke-CheckedCommand "git status --short --branch" $Root

Write-Step "Supply chain npm"
& (Join-Path $PSScriptRoot "check-npm-supply-chain.ps1") -Root $Root
if ($LASTEXITCODE -ne 0) {
  Add-Failure "Scanner npm encontrou alerta ou falhou."
}

Write-Step "Arquivos sensiveis versionados"
$trackedSensitive = & git -C $Root ls-files | Select-String -Pattern '(^|/)(\.env|\.env\..*|.*\.pem|.*\.key|.*id_rsa.*|.*id_ed25519.*|.*recovery.*|.*secret.*|.*token.*|.*cookies?.*)$' -CaseSensitive:$false
if ($trackedSensitive) {
  Add-Failure "Possiveis arquivos sensiveis versionados: $($trackedSensitive -join ', ')"
} else {
  Write-Host "OK: nenhum nome de arquivo sensivel obvio esta versionado."
}

Write-Step "Escopo de release"
$statusEntries = @(Get-GitStatusEntriesForScope $releasePathspecs)
$trackedPaths = @(& git -C $Root ls-files | ForEach-Object { ConvertTo-RepoPath $_ })
$trackedBlocked = @($trackedPaths | Where-Object {
  (Test-AnyPattern $_ $sensitiveFilePatterns) -or
  (Test-AnyPattern $_ $operatorArtifactPatterns)
})

if ($trackedBlocked.Count -gt 0) {
  Add-Failure "Arquivos sensiveis ou artefatos locais estao versionados: $($trackedBlocked -join ', ')"
} else {
  Write-Host "OK: nenhum segredo ou artefato local obvio esta versionado."
}

$localSensitiveEntries = @($statusEntries | Where-Object {
  (Test-AnyPattern $_.Path $sensitiveFilePatterns) -or
  (Test-AnyPattern $_.Path $operatorArtifactPatterns)
})
if ($localSensitiveEntries) {
  Add-Failure "Arquivos locais/sensiveis ou artefatos de operador aparecem no status Git."
  $localSensitiveEntries | Format-Table Status, Path -AutoSize
} else {
  Write-Host "OK: status Git sem artefatos locais/sensiveis ou de operador conhecidos."
}

if ($SiteOnly) {
  Write-Host "OK: modo site-only ignora estado local de tools/tablet fora do escopo apps/web,data/public."
} else {
  $tabletStatusEntries = @(Get-GitStatusEntries "tools/tablet")
  $tabletSensitiveEntries = @($tabletStatusEntries | Where-Object {
    (Test-AnyPattern $_.Path $sensitiveTabletPatterns) -or
    (Test-AnyPattern $_.Path $operationalScriptPatterns)
  })
  if ($tabletSensitiveEntries) {
    Add-Failure "Scripts operacionais sensiveis de tablet/SSH/status sync estao modificados ou untracked."
    $tabletSensitiveEntries | Format-Table Status, Path -AutoSize
  } else {
    Write-Host "OK: nenhum script sensivel de tablet/SSH/status sync esta modificado ou untracked."
  }
}

$operationalReleaseEntries = @($statusEntries | Where-Object {
  Test-AnyPattern $_.Path $operationalScriptPatterns
})
if ($operationalReleaseEntries) {
  Add-Failure "Scripts operacionais de tablet/SSH/firewall aparecem no escopo de release."
  $operationalReleaseEntries | Format-Table Status, Path -AutoSize
} else {
  Write-Host "OK: escopo de release sem scripts operacionais de tablet/SSH/firewall."
}

Write-Step "Regra de leitura publica de dados"
Assert-FileContains "apps\web\lib\data.ts" 'function maybeDevDataDir' "apps/web/lib/data.ts tem helper de override local."
Assert-FileContains "apps\web\lib\data.ts" 'NODE_ENV === "production".*return null' "overrides DATA_SAIDA_DIR ficam nulos em producao."
Assert-FileNotContains "apps\web\lib\data.ts" 'process\.env\.DATA_SAIDA_DIR' "sem leitura direta de process.env.DATA_SAIDA_DIR no frontend."

$blockedFrontendDataPattern = 'data[/\\](raw|extracted|validated|manifests)|datasets\.csv|Origem_Dir'
$frontendDataLeak = Get-ChildItem -LiteralPath (Join-Path $Root "apps\web") -Recurse -File |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\out\\|\\dist\\|\\coverage\\' } |
  Select-String -Pattern $blockedFrontendDataPattern -CaseSensitive:$false

if ($frontendDataLeak) {
  Add-Failure "Frontend referencia camada de dados fora de data/public."
  $frontendDataLeak | Select-Object Path, LineNumber, Line | Format-Table -AutoSize
} else {
  Write-Host "OK: frontend nao referencia data/raw, data/extracted, data/validated, data/manifests, datasets.csv ou Origem_Dir."
}

Write-Step "Manifesto de publicacao"
Invoke-CheckedCommand "python pipelines\testes\verificar_publicacao.py --strict" $Root

Write-Step "API de dados"
Assert-FileContains "apps\web\app\api\dados\[...slug]\route.ts" 'data", "public"' "API aponta para data/public."
Assert-FileContains "apps\web\app\api\dados\[...slug]\route.ts" 'startsWith' "API valida path resolvido antes de servir arquivo."

if (-not $SkipBuild) {
  Write-Step "Frontend lint"
  Invoke-CheckedCommand "npm.cmd --script-shell cmd.exe run lint" (Join-Path $Root "apps\web")

  Write-Step "Frontend build"
  Invoke-CheckedCommand "npm.cmd --script-shell cmd.exe run build" (Join-Path $Root "apps\web")
} else {
  Write-Step "Frontend lint/build"
  Write-Host "Pulando lint/build por parametro -SkipBuild."
}

if ($BaseUrl.Trim().Length -gt 0) {
  $base = $BaseUrl.TrimEnd("/")
  Write-Step "Rotas locais em $base"
  $routes = @(
    "/",
    "/dados",
    "/metodologia",
    "/sobre",
    "/contato",
    "/camara-municipal",
    "/pacto-federativo",
    "/politica-de-dados",
    "/politica-de-neutralidade",
    "/termos",
    "/saude",
    "/educacao",
    "/seguranca",
    "/transporte",
    "/auditoria",
    "/sitemap.xml",
    "/robots.txt",
    "/opengraph-image"
  )

  foreach ($route in $routes) {
    Test-Url "$base$route" 200
  }

  Test-Url "$base/api/dados/sorocaba/saude/saida/despesas_saude_sorocaba_2025.csv" 200
  Test-Url "$base/api/dados/..%2F..%2Fpackage.json" 404
}

Write-Step "Resultado"
if ($failures.Count -gt 0) {
  Write-Host "Auditoria local falhou com $($failures.Count) item(ns):" -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host "- $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "Auditoria local concluida sem bloqueios."
exit 0
