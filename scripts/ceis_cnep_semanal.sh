#!/bin/bash
# CEIS/CNEP — cruzamento semanal de sanções federais, sem limite de tempo.
# Roda fora da janela da coleta noturna porque a primeira passada (ou
# qualquer recuperação após falha de chave) precisa paginar as listas
# nacionais completas de CEIS/CNEP até o cache ficar atual. Ver
# pipelines/baixar_ceis_cnep.py e scripts/coleta_noturna.sh (etapa 3d, movida
# para cá em 2026-07-11).
set -Eeuo pipefail
export PATH="/home/sallumc/.nvm/versions/node/v24.16.0/bin:/home/sallumc/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
REPO=$(cd "$(dirname "$0")/.." && pwd)

OMEGA_SECRETS="/home/sallumc/.config/omega/secrets.env"
PORTAIS_ENV="/home/sallumc/.config/omega/secrets/by-project/portais.env"
set +u
[[ -f "$OMEGA_SECRETS" ]] && source "$OMEGA_SECRETS"
[[ -f "$PORTAIS_ENV" ]] && source "$PORTAIS_ENV"
set -u

LOG_DIR="$REPO/_logs/ceis_cnep_semanal"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/ceis_cnep_${TIMESTAMP}.log"
mkdir -p "$LOG_DIR"

LOCKFILE="/tmp/ceis_cnep_semanal_anatomia.lock"
exec 9>"$LOCKFILE"
if ! flock -n 9; then
  echo "[$(date -u +'%H:%M:%S')] AVISO: CEIS/CNEP semanal já em andamento. Saindo." | tee -a "$LOG_FILE"
  exit 0
fi

for muni in sorocaba paulinia sao_bernardo_do_campo; do
  echo "[$(date -u +'%H:%M:%S')] ▶ CEIS/CNEP — cruzamento $muni" | tee -a "$LOG_FILE"
  env MUNICIPIO="$muni" "$REPO/.venv/bin/python3" "$REPO/pipelines/baixar_ceis_cnep.py" >> "$LOG_FILE" 2>&1 \
    && echo "[$(date -u +'%H:%M:%S')]   ✓ $muni" | tee -a "$LOG_FILE" \
    || echo "[$(date -u +'%H:%M:%S')]   ✗ $muni (exit $?)" | tee -a "$LOG_FILE"
done

echo "[$(date -u +'%H:%M:%S')] === CEIS/CNEP semanal concluído ===" | tee -a "$LOG_FILE"
