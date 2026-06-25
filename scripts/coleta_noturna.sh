#!/bin/bash
# Coleta noturna com sincronização GDrive (02:00 cada dia)
# Uso: bash scripts/coleta_noturna.sh [--dry-run]

set -eE
FALHAS=()
RCLONE=/home/sallumc/.local/bin/rclone
export PATH="/home/sallumc/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
REPO=$(cd "$(dirname "$0")/.." && pwd)
LOG_DIR="$REPO/_logs/coleta_noturna"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/coleta_${TIMESTAMP}.log"

mkdir -p "$LOG_DIR"

DRY_RUN=false
[[ "$1" == "--dry-run" ]] && DRY_RUN=true

# Prevenir execuções simultâneas (lock de arquivo)
LOCKFILE="/tmp/coleta_noturna_anatomia.lock"
exec 9>"$LOCKFILE"
if ! flock -n 9; then
  echo "[$(date -u +'%H:%M:%S')] AVISO: Coleta já em andamento (lockfile $LOCKFILE). Saindo." | tee -a "$LOG_FILE"
  exit 0
fi

log() {
  local msg="[$(date -u +'%H:%M:%S')] $1"
  echo "$msg" | tee -a "$LOG_FILE"
}

run_cmd() {
  local label="$1"
  shift
  log "▶ $label"
  if [[ "$DRY_RUN" == "true" ]]; then
    log "  [DRY-RUN] $@"
    return 0
  fi
  local code=0
  "$@" >> "$LOG_FILE" 2>&1 || code=$?
  if [[ $code -eq 0 ]]; then
    log "  ✓ $label"
  else
    log "  ✗ $label (exit $code)"
    FALHAS+=("$label")
  fi
}

# Passos críticos que param o script se falharem (ex: rclone sync de entrada)
critical_run_cmd() {
  local label="$1"
  shift
  log "▶ $label"
  if [[ "$DRY_RUN" == "true" ]]; then
    log "  [DRY-RUN] $@"
    return 0
  fi
  if "$@" >> "$LOG_FILE" 2>&1; then
    log "  ✓ $label"
  else
    local code=$?
    log "  ✗ $label (exit $code) — PASSO CRÍTICO, abortando"
    exit "$code"
  fi
}

log "=== Coleta Noturna iniciada ==="

# 1. Sincronizar raw do GDrive (antes de coletar)
critical_run_cmd "Sync raw from GDrive" \
  "$RCLONE" sync "gdrive:02-Profissional/00-Omega/04_staging/anatomia-do-gasto/raw/" \
    "$REPO/data/raw/" \
    --progress --checksum --create-empty-src-dirs

# 2. Sincronizar extracted do GDrive (para continuar de onde parou)
critical_run_cmd "Sync extracted from GDrive" \
  "$RCLONE" sync "gdrive:02-Profissional/00-Omega/04_staging/anatomia-do-gasto/extracted/" \
    "$REPO/data/extracted/" \
    --progress --checksum --create-empty-src-dirs

# 3. Rodar coleta de São Paulo (capital)
run_cmd "Coletar São Paulo Capital" \
  "$REPO/.venv/bin/python3" "$REPO/pipelines/coletar_sao_paulo.py"

# 3b. Rodar coleta Sprint 1 — 18 municípios top SP
run_cmd "Coletar Sprint 1 — 18 municípios SP" \
  "$REPO/.venv/bin/python3" "$REPO/pipelines/coletar_municipio_sp.py" --todos

# 4. Gerar datasets.json (publicar dados coletados)
run_cmd "Gerar catálogo de datasets" \
  "$REPO/.venv/bin/python3" "$REPO/pipelines/gerar_datasets_json.py"

# 5. Sincronizar extracted para GDrive (persist coleta)
run_cmd "Sync extracted to GDrive" \
  "$RCLONE" sync "$REPO/data/extracted/" \
    "gdrive:02-Profissional/00-Omega/04_staging/anatomia-do-gasto/extracted/" \
    --progress --checksum

# 6. Sincronizar public para GDrive (backup + vis)
run_cmd "Sync public to GDrive" \
  "$RCLONE" sync "$REPO/data/public/" \
    "gdrive:02-Profissional/00-Omega/05_bases-operacionais/anatomia-do-gasto-dados/public/" \
    --progress --checksum

# 7. Sprint 2 — rotação de UF (fontes federais para todos os municípios Brasil)
log "=== Sprint 2 Rotação de UF ==="
if [[ "$DRY_RUN" == "true" ]]; then
  log "  [DRY-RUN] bash scripts/sprint2_rotacao.sh"
else
  bash "$REPO/scripts/sprint2_rotacao.sh" >> "$LOG_FILE" 2>&1 || \
    log "  AVISO: Sprint 2 terminou com erros (ver log acima)"
fi

# 8. Sincronizar extracted Sprint 2 para GDrive (backup)
run_cmd "Sync extracted Sprint 2 to GDrive" \
  "$RCLONE" sync "$REPO/data/extracted/" \
    "gdrive:02-Profissional/00-Omega/04_staging/anatomia-do-gasto/extracted/" \
    --progress --checksum

log "=== Coleta Noturna concluída ==="
log "Log completo: $LOG_FILE"
if [[ ${#FALHAS[@]} -gt 0 ]]; then
  log "ATENÇÃO: ${#FALHAS[@]} falha(s) não-crítica(s):"
  for f in "${FALHAS[@]}"; do
    log "  ✗ $f"
  done
  exit 1
fi
