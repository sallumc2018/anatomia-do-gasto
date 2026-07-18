#!/bin/bash
# Wrapper para coleta noturna no omega-blue (máquina secundária)
# Adapta caminhos da máquina principal (/home/sallumc) para esta máquina.
# Criado em 2026-07-13 para o setup inicial desta máquina.

set -Eeuo pipefail

REPO=$(cd "$(dirname "$0")/.." && pwd)
LAB_HOME="/home/omega-blue"
LAB_NVM="$LAB_HOME/.config/nvm/versions/node/v20.20.2/bin"

# PATH desta máquina
export PATH="$LAB_NVM:$LAB_HOME/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# Secrets locais (a criar quando disponíveis)
LAB_SECRETS="$LAB_HOME/.config/omega/secrets.env"
LAB_PORTAIS_ENV="$LAB_HOME/.config/omega/secrets/by-project/portais.env"

# Sobrescreve caminho do rclone para não quebrar quando ausente
RCLONE="$LAB_HOME/.local/bin/rclone"
export RCLONE

# Exporta para que o script principal enxergue os caminhos corretos
export OMEGA_SECRETS="$LAB_SECRETS"

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0

  local mode
  mode=$(stat -c "%a" "$file")
  if (( 8#$mode & 0077 )); then
    echo "[ERRO] arquivo de segredo com permissões amplas: $file ($mode). Use chmod 600." >&2
    return 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

# Carrega secrets se existirem, sem imprimir valores.
load_env_file "$LAB_SECRETS"
load_env_file "$LAB_PORTAIS_ENV"

LOG_DIR="$LAB_HOME/.local/state/anatomia-do-gasto/coleta_noturna_lab"
mkdir -p "$LOG_DIR"
chmod 700 "$LOG_DIR"
LOG_FILE="$LOG_DIR/coleta_$(date -u +%Y%m%d_%H%M%S).log"

echo "[$(date -u +'%Y-%m-%d %H:%M:%S UTC')] Iniciando coleta noturna no omega-blue" | tee "$LOG_FILE"

# Verifica se rclone está disponível; pula sync se não estiver
if ! command -v rclone &>/dev/null && [[ ! -f "$RCLONE" ]]; then
  echo "[AVISO] rclone não encontrado — sync GDrive será ignorado nesta execução." | tee -a "$LOG_FILE"
  export SKIP_RCLONE=true
fi

# Executa o script principal passando argumentos
exec bash "$REPO/scripts/coleta_noturna.sh" "$@" 2>&1 | tee -a "$LOG_FILE"
