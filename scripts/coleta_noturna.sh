#!/bin/bash
# Coleta noturna com sincronização GDrive (02:00 cada dia)
# Uso: bash scripts/coleta_noturna.sh [--dry-run]

set -Eeuo pipefail
FALHAS=()
RCLONE="${RCLONE_BIN:-$HOME/.local/bin/rclone}"
NVM_ROOT="${NVM_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/nvm}"
NODE_BIN=$(find "$NVM_ROOT/versions/node" -mindepth 2 -maxdepth 2 -type d -name bin 2>/dev/null | sort -V | tail -n 1 || true)
export PATH="${NODE_BIN:+$NODE_BIN:}$HOME/.local/bin:$PATH"
REPO=$(cd "$(dirname "$0")/.." && pwd)

# Carregar segredos (Portal Transparência, etc.) — arquivos fora do repo.
# O arquivo por projeto tem precedência quando existir, mas mantemos o caminho
# legado porque TASKS.md e sessões anteriores registraram a chave ali.
OMEGA_SECRETS="${OMEGA_SECRETS:-${XDG_CONFIG_HOME:-$HOME/.config}/omega/secrets.env}"
PORTAIS_ENV="${PORTAIS_ENV:-${XDG_CONFIG_HOME:-$HOME/.config}/omega/secrets/by-project/portais.env}"
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

# 3d. CEIS/CNEP — cruzamento de sanções federais contra fornecedores já
# publicados (zona verde, ver docs/legislacao/MANUAL_LGPD_LAI_ANATOMIA_DO_GASTO.md §5).
# Movido para cron dedicado de domingo (scripts/ceis_cnep_semanal.sh, sem
# limite de tempo) em 2026-07-11: o cache nacional (data/raw/_nacional/sancoes/)
# fica incompleto por dias caso a chave falhe (como aconteceu), e paginar as
# listas nacionais completas de CEIS/CNEP até completar o cache pode estourar
# a janela de 6h da coleta noturna. Com o cache completo o cruzamento diário
# volta a ser rápido — mas por ora roda só semanalmente, fora desta janela.

# 3e. Diárias e viagens — Sorocaba prefeitura (TDAPortal). Seção "diarias" é um
# snapshot atual (filtro de ano do site nao afeta a tabela real, confirmado em
# 2026-07-10), por isso roda sem --ano. Saída em data/extracted/ (nao publicada
# automaticamente).
run_cmd "Diárias e viagens — Sorocaba prefeitura" \
  "$REPO/.venv/bin/python3" "$REPO/pipelines/baixar_sorocaba_prefeitura.py" --secao diarias

# 3f. Votações nominais — Câmara de Paulínia (Siscam). Domínio antigo
# (paulinia.sp.leg.br) migrou para paulinia.siscam.com.br, descoberto e
# validado em 2026-07-10. Coleta o ano corrente; publica direto em
# data/public (mesmo padrão do script original — dado público de vereador).
run_cmd "Votações nominais — Câmara Paulínia" \
  "$REPO/.venv/bin/python3" "$REPO/pipelines/baixar_camara_votacoes_paulinia.py" --anos "$(date -u +%Y)"

# 4. Gerar datasets.json (publicar dados coletados)
run_cmd "Gerar catálogo de datasets" \
  "$REPO/.venv/bin/python3" "$REPO/pipelines/gerar_datasets_json.py"

# 5 e 6. Sincronizar extracted e public para o GDrive.
#
# SKIP_GDRIVE_SYNC=1 pula as duas. Existe porque a coleta passou a rodar na
# omega-vps (mesmo clone do Sprint 2, um unico escritor do repo) enquanto as
# credenciais do rclone/GDrive vivem SOMENTE no omega-gray, que ja e o gateway
# de offsite da frota. Espalhar a credencial do Drive por mais uma maquina para
# economizar um hop e trocar seguranca por conveniencia.
# Com a flag ligada, quem sincroniza e o gray, lendo o resultado da coleta.
if [[ "${SKIP_GDRIVE_SYNC:-0}" == "1" ]]; then
  log "▶ Sync GDrive PULADO (SKIP_GDRIVE_SYNC=1) — quem sincroniza e o omega-gray"
elif [[ ! -x "$RCLONE" ]]; then
  log "▶ Sync GDrive PULADO — rclone ausente em $RCLONE"
  FALHAS+=("Sync GDrive: rclone ausente")
else
  run_cmd "Sync extracted to GDrive" \
    "$RCLONE" sync "$REPO/data/extracted/" \
      "gdrive:02-Profissional/00-Omega/04_staging/anatomia-do-gasto/extracted/" \
      --progress --checksum

  run_cmd "Sync public to GDrive" \
    "$RCLONE" sync "$REPO/data/public/" \
      "gdrive:02-Profissional/00-Omega/05_bases-operacionais/anatomia-do-gasto-dados/public/" \
      --progress --checksum
fi

# 7. Commit local (sem push — fica pronto para push manual matinal)
log "▶ Commit local do lote noturno"
git -C "$REPO" add -- data/public data/manifests apps/web/lib/datasets_status.json 2>/dev/null || true
if git -C "$REPO" diff --cached --quiet; then
  log "  · nada novo para commitar"
else
  if "$REPO/.venv/bin/python3" "$REPO/tools/agents/check-secrets.py" --staged >> "$LOG_FILE" 2>&1 \
    && "$REPO/.venv/bin/python3" "$REPO/tools/gates/pre_deploy.py" >> "$LOG_FILE" 2>&1; then
    git -C "$REPO" commit -q \
      -m "chore(coleta): coleta noturna $(date -u +%Y-%m-%d)" \
      -m "Coleta automatica via coleta_noturna.sh (00h-06h BRT); nao pusheado." \
      -m "[Claude Code > claude-sonnet-4-6 > Low]" >> "$LOG_FILE" 2>&1 \
      && log "  ✓ Commit local criado" \
      || { log "  ✗ git commit falhou (ver log)"; FALHAS+=("Commit local do lote noturno (git commit falhou apos gates OK — ver log; hooks/assinatura?)"); }
  else
    log "  ✗ Gates de commit falharam — deixando staged para revisão manual"
    FALHAS+=("Commit local do lote noturno (gate falhou)")
  fi
fi

# Sprint 2 — roda em paralelo pelo cron de 00:00 BRT (scripts/sprint2_24x7_worker.py --loop --sleep 30
# --commit-push-every N), timeout até 06:00 BRT. Commit local próprio, sem push (--push nao usado).
# Quando o servidor 192.168.15.9 voltar online, o worker pode rodar via systemd para cobertura contínua.

log "=== Coleta Noturna concluída ==="
log "Log completo: $LOG_FILE"
if [[ ${#FALHAS[@]} -gt 0 ]]; then
  log "ATENÇÃO: ${#FALHAS[@]} falha(s) não-crítica(s):"
  for f in "${FALHAS[@]}"; do
    log "  ✗ $f"
  done

  # Notificação Telegram — token não exportado ao ambiente; arquivo 600; trap garante remoção
  OMEGA_SECRETS="${OMEGA_SECRETS:-${XDG_CONFIG_HOME:-$HOME/.config}/omega/secrets.env}"
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
