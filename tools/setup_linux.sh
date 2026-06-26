#!/usr/bin/env bash
# Diagnostico local do ambiente Linux. Nao instala pacotes nem acessa a rede.

set -uo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

failures=0
warnings=0

ok() {
  printf 'OK: %s\n' "$1"
}

warn() {
  printf 'AVISO: %s\n' "$1" >&2
  warnings=$((warnings + 1))
}

fail() {
  printf 'ERRO: %s\n' "$1" >&2
  failures=$((failures + 1))
}

printf '=== Diagnostico Linux - Anatomia do Gasto ===\n'

if command -v rtk >/dev/null 2>&1; then
  ok "RTK encontrado em $(command -v rtk)"
  rtk --version || fail "RTK nao respondeu a --version"
  rtk verify >/dev/null 2>&1 \
    && ok "hook RTK verificado" \
    || fail "rtk verify falhou; revise a configuracao global da TUI"
else
  fail "RTK nao esta no PATH; instale somente a partir de artefato previamente validado"
fi

if [[ -x .venv/bin/python ]]; then
  ok "venv Python encontrado"
  .venv/bin/python -m pip check >/dev/null 2>&1 \
    && ok "dependencias instaladas sao consistentes" \
    || fail "pip check encontrou dependencias inconsistentes"
else
  fail ".venv/bin/python nao encontrado"
fi

if [[ -x .venv/bin/python ]] && .venv/bin/python -c "import gptcache" >/dev/null 2>&1; then
  warn "GPTCache esta instalado, mas pipelines/gptcache_helper.py nao possui consumidores ativos"
else
  warn "GPTCache indisponivel; nao afeta RTK nem o RAG publico local"
fi

if [[ -x .venv/bin/python ]]; then
  .venv/bin/python -m py_compile tools/hooks/autonomous_rag.py \
    && ok "hook de RAG compila" \
    || fail "hook de RAG nao compila"
  .venv/bin/python tools/memory/build-rag-index.py --check >/dev/null 2>&1 \
    && ok "contrato do indice RAG validado" \
    || fail "contrato do indice RAG falhou"
fi

printf 'Resumo: %d erro(s), %d aviso(s).\n' "$failures" "$warnings"
exit "$failures"
