#!/bin/bash
# Wrapper seguro para cron no sallumc-server.
#
# Fluxo:
#   pull --ff-only -> coleta_noturna -> gates leves -> commit escopado -> push
#
# Este script deve ser instalado em /home/sallumc/coleta_wrapper.sh no servidor.

set -Eeuo pipefail

REPO="${ANATOMIA_REPO:-/home/sallumc/anatomia-do-gasto}"
LOG_DIR="$REPO/_logs/coleta_noturna"
WRAP_LOG="$LOG_DIR/wrapper_$(date -u +%Y%m%d_%H%M%S).log"
PYTHON="$REPO/.venv/bin/python3"
PUSH_REMOTE="${ANATOMIA_PUSH_REMOTE:-origin}"
PUSH_BRANCH="${ANATOMIA_PUSH_BRANCH:-main}"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] $*" | tee -a "$WRAP_LOG"
}

run_logged() {
  local label="$1"
  shift
  log "▶ $label"
  set +e
  "$@" 2>&1 | tee -a "$WRAP_LOG"
  local code=${PIPESTATUS[0]}
  set -e
  if [[ $code -ne 0 ]]; then
    log "✗ $label falhou (exit $code)"
    return "$code"
  fi
  log "✓ $label"
}

ensure_repo() {
  if [[ ! -d "$REPO/.git" ]]; then
    log "ERRO: repo não encontrado em $REPO"
    exit 1
  fi
  if [[ ! -x "$PYTHON" ]]; then
    log "ERRO: venv Python não encontrado em $PYTHON"
    exit 1
  fi
}

ensure_no_previous_dirty_worktree() {
  local dirty
  dirty=$(git status --porcelain --untracked-files=normal)
  if [[ -n "$dirty" ]]; then
    log "ERRO: worktree já estava suja antes da coleta; abortando para não misturar estados."
    git status --short | tee -a "$WRAP_LOG"
    exit 1
  fi
}

stage_publish_outputs() {
  git add -- \
    data/public/ \
    data/manifests/sprint2/ \
    data/manifests/datasets_status.json \
    apps/web/lib/datasets_status.json
}

run_publish_gates() {
  run_logged "check-secrets staged" "$PYTHON" tools/agents/check-secrets.py --staged
  run_logged "gate publicação local" "$PYTHON" tools/gates/pre_deploy.py
  run_logged "verificar publicação" "$PYTHON" pipelines/testes/verificar_publicacao.py
  run_logged "gate slugs Sprint 2" "$PYTHON" tools/gates/check_sprint2_slug_collisions.py --max-findings 20
  run_logged "gate tracing Turbopack" "$PYTHON" tools/gates/check_turbopack_data_tracing.py
}

commit_and_push_if_needed() {
  stage_publish_outputs
  if git diff --cached --quiet; then
    log "Sem dados/manifests novos para commitar."
    return 0
  fi

  run_publish_gates

  git config user.email "sallumc@gmail.com"
  git config user.name "sallumc-server"

  local today
  today=$(date -u +%Y-%m-%d)
  run_logged "git commit dados coletados" git commit -m "chore(coleta): dados $today" -m "Coleta automatica via sallumc-server. Inclui dados publicos, manifests Sprint 2 e catalogo do site." -m "[Claude Code > claude-sonnet-4-6 > Auto]"

  run_logged "git push $PUSH_REMOTE $PUSH_BRANCH" git push "$PUSH_REMOTE" "$PUSH_BRANCH"
}

main() {
  log "=== WRAPPER INICIO ==="
  ensure_repo
  cd "$REPO"

  ensure_no_previous_dirty_worktree

  run_logged "git fetch" git fetch "$PUSH_REMOTE" "$PUSH_BRANCH"
  run_logged "git pull --ff-only" git pull --ff-only "$PUSH_REMOTE" "$PUSH_BRANCH"

  run_logged "coleta_noturna" bash "$REPO/scripts/coleta_noturna.sh"
  commit_and_push_if_needed

  log "=== WRAPPER FIM OK ==="
}

main "$@"
