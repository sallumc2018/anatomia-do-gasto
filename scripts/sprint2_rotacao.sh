#!/bin/bash
# Sprint 2 — coleta fontes federais por UF em rotação noturna.
# A cada execução processa uma UF (ou grupo) e avança para a próxima.
# Arquivo de estado: _logs/sprint2_rotacao/estado.txt
#
# Uso:
#   bash scripts/sprint2_rotacao.sh              # roda UF da vez
#   bash scripts/sprint2_rotacao.sh --status     # mostra UF atual sem rodar
#   bash scripts/sprint2_rotacao.sh --resetar    # volta para a primeira UF
#   bash scripts/sprint2_rotacao.sh --forcar BA  # força UF específica

set -e
REPO=$(cd "$(dirname "$0")/.." && pwd)
LOG_BASE="$REPO/_logs/sprint2_rotacao"
ESTADO="$LOG_BASE/estado.txt"
PYTHON="$REPO/.venv/bin/python3"

mkdir -p "$LOG_BASE"

# Grupos de UFs — menores agrupadas para equilibrar carga por noite (~8h max)
# Estimativa de municípios por grupo:
GRUPOS=(
  "AC AP RR"    # 53  pequenas Norte
  "RO TO"       # 191 Norte médio
  "AM PA"       # 206 Amazônia
  "MA"          # 217 Maranhão
  "PI"          # 224 Piauí
  "PB"          # 223 Paraíba
  "RN"          # 167 Rio Grande do Norte
  "CE"          # 184 Ceará
  "PE"          # 185 Pernambuco
  "AL SE"       # 177 Alagoas+Sergipe
  "BA"          # 417 Bahia
  "ES MS"       # 154 ES+MS
  "DF RJ"       # 93  DF+RJ
  "MT"          # 142 Mato Grosso
  "GO"          # 246 Goiás
  "SC"          # 295 Santa Catarina
  "PR"          # 399 Paraná
  "RS"          # 497 Rio Grande do Sul
  "MG"          # 853 Minas Gerais (sozinho)
  "SP"          # 645 São Paulo (sozinho)
)

N_GRUPOS=${#GRUPOS[@]}

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_BASE/sprint2_${TIMESTAMP}.log"

log() {
  echo "[$(date -u +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# --- Flags ---
STATUS=false
RESETAR=false
FORCAR_UF=""

for arg in "$@"; do
  case "$arg" in
    --status)   STATUS=true ;;
    --resetar)  RESETAR=true ;;
    --forcar)   shift; FORCAR_UF="$1" ;;
    *)          if [[ -n "$FORCAR_UF" ]]; then FORCAR_UF="$arg"; fi ;;
  esac
done

# Resetar
if $RESETAR; then
  echo "0" > "$ESTADO"
  echo "Rotação resetada para grupo 0 (${GRUPOS[0]})"
  exit 0
fi

# Ler índice atual
IDX=0
if [[ -f "$ESTADO" ]]; then
  IDX=$(cat "$ESTADO")
fi
IDX=$((IDX % N_GRUPOS))

# Determinar UF(s) a rodar
if [[ -n "$FORCAR_UF" ]]; then
  UFS_HOJE="$FORCAR_UF"
  log "FORÇADO: $UFS_HOJE (índice não avança)"
else
  UFS_HOJE="${GRUPOS[$IDX]}"
  PROXIMO=$(( (IDX + 1) % N_GRUPOS ))
fi

log "=== Sprint 2 Rotação ==="
log "Grupo $IDX/$((N_GRUPOS-1)): [$UFS_HOJE]"

if $STATUS; then
  echo "Grupo atual : $IDX — UFs: [$UFS_HOJE]"
  echo "Próximo     : $PROXIMO — UFs: [${GRUPOS[$PROXIMO]}]"
  echo "Total grupos: $N_GRUPOS (~${N_GRUPOS} noites para 1 ciclo Brasil)"
  exit 0
fi

# Construir flags --uf para o orquestrador
UF_FLAGS=""
for uf in $UFS_HOJE; do
  UF_FLAGS="$UF_FLAGS --uf $uf"
done

log "Iniciando coleta: $UF_FLAGS"
log "Log Sprint 2: $LOG_FILE"

"$PYTHON" "$REPO/pipelines/coletar_municipios_brasil.py" $UF_FLAGS >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [[ $EXIT_CODE -eq 0 ]]; then
  log "✓ Grupo [$UFS_HOJE] concluído com sucesso"
else
  log "✗ Grupo [$UFS_HOJE] com falhas (exit $EXIT_CODE) — avançando mesmo assim"
fi

# Avançar índice (mesmo com falhas, para não travar indefinidamente)
if [[ -z "$FORCAR_UF" ]]; then
  echo "$PROXIMO" > "$ESTADO"
  log "Próxima noite: grupo $PROXIMO [${GRUPOS[$PROXIMO]}]"
fi

log "=== Sprint 2 Rotação concluída ==="
