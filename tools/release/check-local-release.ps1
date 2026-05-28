Param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
  Param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string[]]$Command
  )

  Write-Host ""
  Write-Host "== $Name =="
  Push-Location -LiteralPath $WorkingDirectory
  try {
    & $Command[0] @($Command[1..($Command.Length - 1)])
    if ($LASTEXITCODE -ne 0) {
      throw "Step failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

Write-Host "== Anatomia do Gasto: local release check =="
Write-Host "Root: $Root"
Write-Host "Frontend scripts: $(-not $SkipFrontend)"

Invoke-Step "git diff check" $Root @("git.exe", "diff", "--check")
Invoke-Step "npm supply-chain read-only check" $Root @(
  "powershell.exe",
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  "tools\security\check-npm-supply-chain.ps1"
)
Invoke-Step "python compile tools" $Root @("python.exe", "-m", "compileall", "-q", "tools")
Invoke-Step "mindmap generated data check" $Root @("python.exe", "tools\frontend\generate-mindmap-data.py", "--check")
Invoke-Step "agents validation" $Root @("python.exe", "tools\agents\validate-area.py", "--area", "agents")
Invoke-Step "memory validation" $Root @("python.exe", "tools\agents\validate-area.py", "--area", "memory")
Invoke-Step "scope validation" $Root @("python.exe", "tools\agents\validate-area.py", "--area", "scope")
Invoke-Step "publication validation" $Root @("python.exe", "tools\agents\validate-area.py", "--area", "publication")
Invoke-Step "data integrity check" $Root @("python.exe", "tools\security\check-data-integrity.py")

if (-not $SkipFrontend) {
  $webRoot = Join-Path $Root "apps\web"
  Invoke-Step "frontend lint" $webRoot @("npm.cmd", "--script-shell", "cmd.exe", "run", "lint")
  Invoke-Step "frontend build" $webRoot @("npm.cmd", "--script-shell", "cmd.exe", "run", "build")
}

Write-Host ""
Write-Host "Local release check: OK"
