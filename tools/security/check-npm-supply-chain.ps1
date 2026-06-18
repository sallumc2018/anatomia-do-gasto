Param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"

Write-Host "== Anatomia do Gasto: npm supply-chain read-only check =="
Write-Host "Root: $Root"

$patterns = @(
  "tanstack",
  "mistral",
  "uipath",
  "opensearch",
  "guardrails",
  "squawk",
  "router_init.js",
  "router_runtime.js",
  "setup.mjs",
  "gh-token-monitor",
  "SHA1HULUD",
  "Shai-Hulud",
  "shai-hulud",
  "pull_request_target",
  "actions/cache",
  "id-token",
  "npm publish"
)

$targets = @(
  "apps\web\package.json",
  "apps\web\package-lock.json",
  ".github",
  ".claude",
  ".vscode"
)

$hits = @()

foreach ($target in $targets) {
  $path = Join-Path $Root $target
  if (-not (Test-Path -LiteralPath $path)) {
    Write-Host "Missing: $target"
    continue
  }

  Write-Host "Scanning: $target"
  $files = if ((Get-Item -LiteralPath $path).PSIsContainer) {
    Get-ChildItem -LiteralPath $path -Recurse -File -Force
  } else {
    @(Get-Item -LiteralPath $path)
  }

  foreach ($pattern in $patterns) {
    $matches = $files | Select-String -Pattern $pattern -SimpleMatch -CaseSensitive:$false -ErrorAction SilentlyContinue
    if ($matches) {
      foreach ($match in $matches) {
        $relativePath = $match.Path.Replace($Root, "").TrimStart("\")
        $isExpectedRunbookReference =
          $relativePath -in @(
            "CLAUDE.md",
            "docs\seguranca-dependencias-npm.md",
            ".claude\commands\frontend.md"
          ) -and
          $pattern -in @("Shai-Hulud", "shai-hulud") -and
          $match.Line -match "campanha|runbook|seguranca-dependencias-npm|Antes de instalar"

        if ($isExpectedRunbookReference) {
          continue
        }

        $hits += [PSCustomObject]@{
          File = $relativePath
          Line = $match.LineNumber
          Pattern = $pattern
          Text = $match.Line.Trim()
        }
      }
    }
  }
}

if ($hits.Count -eq 0) {
  Write-Host "No local indicators found in the scanned project files."
  exit 0
}

Write-Host ""
Write-Host "Potential indicators found. Review before running npm or agent scripts:"
$hits | Format-Table -AutoSize
exit 2
