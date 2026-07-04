#!/bin/bash
# Coleta noturna com sincronização GDrive (02:00 cada dia)
# Uso: bash scripts/coleta_noturna.sh [--dry-run]

set -Eeuo pipefail
FALHAS=()
RCLONE=/home/sallumc/.local/bin/rclone
export PATH="/home/sallumc/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
REPO=$(cd "$(dirname "$0")/.." && pwd)

# Carregar segredos (Portal Transparência, etc.) — arquivos fora do repo.
# O arquivo por projeto tem precedência quando existir, mas mantemos o caminho
# legado porque TASKS.md e sessões anteriores registraram a chave ali.
OMEGA_SECRETS="/home/sallumc/.config/omega/secrets.env"
PORTAIS_ENV="/home/sallumc/.config/omega/secrets/by-project/portais.env"
set +u
if [[ -f "$OMEGA_SECRETS" ]]; then
  source "$OMEGA_SECRETS"
fi
if [[ -f "$PORTAIS_ENV" ]]; then
  source "$PORTAIS_ENV"
fi
set -u
LOG_DIR="$REPO/_logs/coleta_noturna"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/coleta_${TIMESTAMP}.log"

mkdir -p "$LOG_DIR"

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

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

# 3c. Sprint 1 — FNDE repasses + SIOPE (Sorocaba e Paulínia)
# Requer PORTAL_TRANSPARENCIA_KEY com permissão para /transferencias — se 403, refaz stubs
run_cmd "Sprint 1 FNDE+SIOPE — Sorocaba e Paulínia" \
  "$REPO/.venv/bin/python3" "$REPO/pipelines/baixar_fnde_siope.py" \
    --municipios sorocaba paulinia

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

# Sprint 2 — rodado separadamente pelo cron de 05:30 (scripts/sprint2_rotacao.sh).
# Enquanto o servidor estiver offline, a rotação roda no PC com 1 grupo por noite,
# timeout de 2h. Quando o servidor voltar, o worker 24x7 (sprint2_24x7_worker.py)
# retoma via systemd e a rotação PC pode ser desativada.

log "=== Coleta Noturna concluída ==="
log "Log completo: $LOG_FILE"
if [[ ${#FALHAS[@]} -gt 0 ]]; then
  log "ATENÇÃO: ${#FALHAS[@]} falha(s) não-crítica(s):"
  for f in "${FALHAS[@]}"; do
    log "  ✗ $f"
  done

  # Notificação Telegram — token não exportado ao ambiente; arquivo 600; trap garante remoção
  OMEGA_SECRETS="/home/sallumc/.config/omega/secrets.env"
  TG_BOT_TOKEN=""
  TG_CHAT_ID=""
  if [[ -f "$OMEGA_SECRETS" ]]; then
    # Subshell: extrai apenas as duas variáveis necessárias; demais segredos não poluem o ambiente
    TG_BOT_TOKEN=$(. "$OMEGA_SECRETS" 2>/dev/null && printf '%s' "${TELEGRAM_BOT_TOKEN:-}")
    TG_CHAT_ID=$(. "$OMEGA_SECRETS" 2>/dev/null && printf '%s' "${TELEGRAM_CHAT_ID:-}")
  fi
  if [[ -n "${TG_BOT_TOKEN:-}" ]] && [[ -n "${TG_CHAT_ID:-}" ]]; then
    LISTA_FALHAS=$(printf '%s\n' "${FALHAS[@]}" | head -10 | sed 's/^/• /')
    TG_MSG="⚠️ Coleta Noturna — ${#FALHAS[@]} falha(s) em $(date -u +'%Y-%m-%d')

${LISTA_FALHAS}"
    # umask 077 → arquivo temporário com permissão 600 (sem leitura por outros usuários)
    _old_umask=$(umask)
    umask 077
    TG_CFG=$(mktemp)
    umask "$_old_umask"
    # trap garante remoção mesmo em sinal ou erro antes do rm explícito abaixo
    trap 'rm -f "${TG_CFG:-}"' EXIT INT TERM HUP
    # URL no config file → token não aparece em ps aux
    printf 'url = "https://api.telegram.org/bot%s/sendMessage"\n' \
      "$TG_BOT_TOKEN" > "$TG_CFG"
    curl -s --max-time 10 --config "$TG_CFG" \
      --data-urlencode "chat_id=${TG_CHAT_ID}" \
      --data-urlencode "text=${TG_MSG}" > /dev/null || true
    rm -f "$TG_CFG"
    trap - EXIT INT TERM HUP
  fi

  exit 1
fi
