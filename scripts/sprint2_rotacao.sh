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
N_GRUPOS_NOITE=2   # grupos processados por execução (padrão 2 → ciclo ~10 noites)
PARALELAS=1        # coletas simultâneas por grupo

while [[ $# -gt 0 ]]; do
  case "$1" in
    --status)    STATUS=true; shift ;;
    --resetar)   RESETAR=true; shift ;;
    --forcar)    FORCAR_UF="${2:-}"; shift 2 ;;
    --grupos)    N_GRUPOS_NOITE="${2:-2}"; shift 2 ;;
    --paralelas) PARALELAS="${2:-1}"; shift 2 ;;
    *)           if [[ -n "$FORCAR_UF" && "$1" != --* ]]; then FORCAR_UF="$1"; fi; shift ;;
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

if $STATUS; then
  PROXIMO_STATUS=$(( (IDX + N_GRUPOS_NOITE) % N_GRUPOS ))
  echo "Grupo atual : $IDX — UFs: [${GRUPOS[$IDX]}]"
  echo "Grupos/noite: $N_GRUPOS_NOITE (~$(( (N_GRUPOS + N_GRUPOS_NOITE - 1) / N_GRUPOS_NOITE )) noites/ciclo)"
  echo "Próximo     : $PROXIMO_STATUS"
  echo "Total grupos: $N_GRUPOS"
  exit 0
fi

log "=== Sprint 2 Rotação ==="

if [[ -n "$FORCAR_UF" ]]; then
  # Modo forçado: apenas uma UF, índice não avança
  log "FORÇADO: $FORCAR_UF (índice não avança)"
  UF_FLAGS="--uf $FORCAR_UF"
  log "Iniciando coleta: $UF_FLAGS (paralelas=$PARALELAS)"
  "$PYTHON" "$REPO/pipelines/coletar_municipios_brasil.py" $UF_FLAGS --paralelas "$PARALELAS" >> "$LOG_FILE" 2>&1
  EXIT_CODE=$?
  if [[ $EXIT_CODE -eq 0 ]]; then
    log "✓ [$FORCAR_UF] concluído"
  else
    log "✗ [$FORCAR_UF] com falhas (exit $EXIT_CODE)"
  fi
else
  # Modo rotação: processar N_GRUPOS_NOITE grupos consecutivos
  log "Grupos/noite: $N_GRUPOS_NOITE — iniciando em idx=$IDX (paralelas=$PARALELAS)"
  FALHAS=0
  for (( i=0; i<N_GRUPOS_NOITE; i++ )); do
    CUR=$(( (IDX + i) % N_GRUPOS ))
    UFS_CUR="${GRUPOS[$CUR]}"
    UF_FLAGS=""
    for uf in $UFS_CUR; do
      UF_FLAGS="$UF_FLAGS --uf $uf"
    done
    log "--- Grupo $CUR/$((N_GRUPOS-1)): [$UFS_CUR]"
    "$PYTHON" "$REPO/pipelines/coletar_municipios_brasil.py" $UF_FLAGS --paralelas "$PARALELAS" >> "$LOG_FILE" 2>&1
    EC=$?
    if [[ $EC -eq 0 ]]; then
      log "✓ Grupo $CUR [$UFS_CUR] OK"
    else
      log "✗ Grupo $CUR [$UFS_CUR] falhou (exit $EC)"
      FALHAS=$((FALHAS + 1))
    fi
  done
  PROXIMO=$(( (IDX + N_GRUPOS_NOITE) % N_GRUPOS ))
  echo "$PROXIMO" > "$ESTADO"
  log "Índice avançado para $PROXIMO [${GRUPOS[$PROXIMO]}] — próxima noite"
  log "Falhas nesta rodada: $FALHAS/$N_GRUPOS_NOITE"
fi

log "=== Sprint 2 Rotação concluída ==="
