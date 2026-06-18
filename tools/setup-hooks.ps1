# Bootstrap dos hooks de seguranca — rode UMA vez por clone (Windows PowerShell).
# O git NAO deixa um repositorio auto-configurar core.hooksPath (protecao contra
# repo malicioso), por isso este opt-in explicito. Sem ele, os hooks .husky/
# (pre-commit/pre-push/commit-msg) NAO disparam neste clone.
#
# Consolidacao 2026-06-15: .husky e o caminho canonico unico (pre-commit chama
# check-commit-gate.py --staged; pre-push chama --full --no-warn).
git config core.hooksPath .husky
if ((git config --get core.hooksPath) -eq '.husky') {
    Write-Host "OK: core.hooksPath = .husky (gate de seguranca ativo neste clone)."
} else {
    Write-Error "FALHOU ao setar core.hooksPath"
    exit 1
}
