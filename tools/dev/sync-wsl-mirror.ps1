param(
  [string]$WslRepo = "~/projetos/anatomia-do-gasto",
  [string]$Branch = "main",
  [string]$Remote = "origin"
)

$ErrorActionPreference = "Stop"

$Command = @"
cd $WslRepo &&
git fetch $Remote $Branch &&
git reset --hard $Remote/$Branch &&
git status --short &&
git log -1 --oneline
"@

wsl bash -lc $Command
