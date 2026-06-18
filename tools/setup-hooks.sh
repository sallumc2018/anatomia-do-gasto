#!/bin/sh
# Bootstrap dos hooks de seguranca — rode UMA vez por clone (Git Bash / Linux / macOS).
# O git NAO deixa um repositorio auto-configurar core.hooksPath (protecao contra
# repo malicioso), por isso este opt-in explicito. Sem ele, os hooks .husky/
# (pre-commit/pre-push/commit-msg) NAO disparam neste clone.
#
# Consolidacao 2026-06-15: .husky e o caminho canonico unico. O pre-commit chama
# tools/agents/check-commit-gate.py --staged e o pre-push chama --full, entao toda
# a logica do antigo .githooks/ (segredos, caminhos proibidos, delecao em
# data/public) continua ativa — agora num so lugar.
set -e
git config core.hooksPath .husky
val=$(git config --get core.hooksPath || true)
if [ "$val" = ".husky" ]; then
  echo "OK: core.hooksPath = .husky (gate de seguranca ativo neste clone)."
else
  echo "FALHOU ao setar core.hooksPath" >&2
  exit 1
fi
