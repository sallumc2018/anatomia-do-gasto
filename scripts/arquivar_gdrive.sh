#!/bin/bash
# Arquivamento do dado bruto/intermediario para o Google Drive.
#
# REGRA QUE ESTE SCRIPT IMPLEMENTA (definida pelo dono em 15/08/2026):
#   "os dados coletados, depois de trabalhados, nao podem permanecer em nenhuma
#    maquina do homelab, precisam ir para o gdrive."
#
# Ate hoje ela nao existia em lugar nenhum: nem o Sprint1 nem o Sprint2 enviavam
# nada ao Drive (o `sprint2_24x7_worker.py` tem 509 linhas e zero mencao a
# rclone), e o hop dependia de trabalho manual no omega-gray. Foi assim que a
# VPS chegou a 79 GB de data/raw.
#
# ---------------------------------------------------------------------------
# POR QUE A TOPOLOGIA E ESTA (e nao rclone direto na VPS)
#
#   omega-vps  --rsync(ro)-->  omega-core  --rclone-->  gdrive-crypt:
#   (IP publico)               (rede interna)           (2 TB, cripto no cliente)
#
# A VPS e a maquina exposta a internet. No modelo PULL a credencial do Drive
# mora no core, dentro de casa, e a VPS nao guarda nenhuma chave que entre na
# rede interna. Se a VPS for comprometida, o atacante nao ganha o core nem o
# Drive. A chave do core na VPS e restrita a `rrsync -ro .../data` — so rsync,
# so leitura, so em data/, shell negado (verificado: `ssh omega-vps-data echo`
# responde "SSH_ORIGINAL_COMMAND does not run rsync").
#
# A purga roda a partir da estacao (omega-neologos), que ja e o jump host da
# frota, porque o core NAO tem permissao de escrita na VPS — de proposito.
#
# ---------------------------------------------------------------------------
# A INVARIANTE DE SEGURANCA DO DADO
#
# Nada e apagado antes de existir prova de que chegou ao Drive. A prova nao e
# "o rclone nao deu erro": e o sha256 do pacote baixado DE VOLTA do Drive
# batendo com o sha256 local. Round-trip, nao otimismo.
#
# `rclone check` nao serve aqui — ele opera sobre diretorios e responde
# "is a file not a directory" quando o alvo e um arquivo.
#
# Uso:
#   bash scripts/arquivar_gdrive.sh --dry-run        # nao envia, nao apaga
#   bash scripts/arquivar_gdrive.sh --so-arquivar    # envia e verifica, nao apaga
#   bash scripts/arquivar_gdrive.sh                  # envia, verifica e purga
#   bash scripts/arquivar_gdrive.sh --camada raw     # so raw (default: raw+extracted)

set -Eeuo pipefail

VPS_SSH="${ANATOMIA_VPS_SSH:-omega-vps}"
CORE_SSH="${ANATOMIA_CORE_SSH:-omega-core}"
# Alias restrito no ~/.ssh/config do core: rrsync -ro sobre .../data
CORE_TO_VPS="${ANATOMIA_CORE_TO_VPS:-omega-vps-data}"
DEST="${ANATOMIA_GDRIVE_DEST:-gdrive-crypt:Omega-Backups/arquivo-historico}"

# Caminhos remotos resolvidos para ABSOLUTO uma unica vez, aqui.
#
# Por que nao deixar "$HOME/..." nas variaveis: o valor viaja dentro de
# argumentos com aspas simples nos comandos ssh mais abaixo, e ali `$HOME` NAO
# expande — chega literal ao outro lado. O sintoma foi exatamente este:
#   rsync: mkdir "/home/neologos/$HOME/anatomia-backup/extracted" failed
# Resolver cedo elimina a classe inteira de bug, em vez de caçar aspas uma a uma.
_resolver_home() {
  local host="$1" sufixo="$2" home
  home=$(ssh "$host" 'printf %s "$HOME"') || {
    echo "nao consegui resolver \$HOME em $host" >&2; exit 1
  }
  printf '%s/%s' "$home" "$sufixo"
}
VPS_REPO="${ANATOMIA_VPS_REPO:-$(_resolver_home "$VPS_SSH" anatomia-do-gasto-sprint2)}"
CORE_WORK="${ANATOMIA_CORE_WORK:-$(_resolver_home "$CORE_SSH" anatomia-backup)}"
RCLONE="${ANATOMIA_RCLONE:-$(_resolver_home "$CORE_SSH" .local/bin/rclone)}"

DRY_RUN=false
SO_ARQUIVAR=false
FORCAR_PURGA=false
CAMADAS=(raw extracted)

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)      DRY_RUN=true ;;
    --so-arquivar)  SO_ARQUIVAR=true ;;
    --forcar-purga) FORCAR_PURGA=true ;;
    --camada)       shift; CAMADAS=("$1") ;;
    *) echo "opcao desconhecida: $1" >&2; exit 2 ;;
  esac
  shift
done

STAMP=$(date -u +%Y%m%d_%H%M%S)
LOG_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/omega/anatomia-arquivar"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/arquivar_${STAMP}.log"

log() {
  local line="[$(date -u +%H:%M:%S)] $*"
  echo "$line" | tee -a "$LOG_FILE"
}

FALHAS=()

# ---------------------------------------------------------------------------
# Uma camada = um diretorio de data/ (raw ou extracted).
#
# O fluxo por camada, na ordem, e a ordem importa:
#   1. core puxa da VPS por rsync (sem --delete: rsync nunca apaga aqui)
#   2. core empacota em .tar.zst
#   3. core envia ao Drive
#   4. core baixa DE VOLTA e compara sha256          <- o portao
#   5. so entao a estacao manda a VPS apagar          <- irreversivel
#
# Empacotar troca dezenas de milhares de chamadas de API por uma. Medido em
# data/public: 69.023 arquivos soltos levavam >10 min so para COMPARAR sem
# --fast-list, e 18 s com a flag; um tarball unico e uma chamada.
# ---------------------------------------------------------------------------
arquivar_camada() {
  local camada="$1"
  local nome="anatomia-${camada}-${STAMP}.tar.zst"
  local remoto="$DEST/$nome"

  log "=== camada: $camada ==="

  # -- 0. ha o que arquivar? -------------------------------------------------
  local n_arquivos
  n_arquivos=$(ssh "$VPS_SSH" "find $VPS_REPO/data/$camada -type f 2>/dev/null | wc -l" || echo 0)
  if [[ "$n_arquivos" -eq 0 ]]; then
    log "  · $camada esta vazio na VPS — nada a fazer"
    return 0
  fi
  log "  · $n_arquivos arquivo(s) em data/$camada na VPS"

  if [[ "$DRY_RUN" == "true" ]]; then
    log "  [DRY-RUN] puxaria, empacotaria como $nome, enviaria e verificaria"
    return 0
  fi

  # -- 1. core puxa da VPS ---------------------------------------------------
  log "  ▶ core puxa data/$camada da VPS"
  if ! ssh "$CORE_SSH" "mkdir -p $CORE_WORK && rsync -a --no-motd '$CORE_TO_VPS:$camada/' '$CORE_WORK/$camada/'" >> "$LOG_FILE" 2>&1; then
    log "  ✗ rsync VPS→core falhou"
    FALHAS+=("$camada: rsync VPS->core")
    return 1
  fi

  # -- 2. empacota -----------------------------------------------------------
  log "  ▶ empacota em $nome"
  if ! ssh "$CORE_SSH" "cd $CORE_WORK && tar -I 'zstd -19 -T4 --long=27' -cf '$nome' '$camada' && sha256sum '$nome' > '$nome.sha256'" >> "$LOG_FILE" 2>&1; then
    log "  ✗ empacotamento falhou"
    FALHAS+=("$camada: tar/zstd")
    return 1
  fi
  local sha_local tamanho
  sha_local=$(ssh "$CORE_SSH" "cut -d' ' -f1 < $CORE_WORK/$nome.sha256")
  tamanho=$(ssh "$CORE_SSH" "stat -c%s $CORE_WORK/$nome")
  log "  · pacote: $tamanho bytes, sha256 ${sha_local:0:16}…"

  # -- 3. envia --------------------------------------------------------------
  log "  ▶ envia ao Drive"
  if ! ssh "$CORE_SSH" "$RCLONE copyto '$CORE_WORK/$nome' '$remoto' --checksum && $RCLONE copyto '$CORE_WORK/$nome.sha256' '$remoto.sha256' --checksum" >> "$LOG_FILE" 2>&1; then
    log "  ✗ upload falhou"
    FALHAS+=("$camada: upload")
    return 1
  fi

  # -- 4. O PORTAO: baixa de volta e compara --------------------------------
  # Sem este passo, "apagar depois de enviar" e um ato de fe. Com ele, so se
  # apaga o que provadamente pode ser lido de volta, byte a byte.
  log "  ▶ verifica: baixa do Drive e compara sha256"
  local sha_remoto
  sha_remoto=$(ssh "$CORE_SSH" "$RCLONE cat '$remoto' 2>/dev/null | sha256sum | cut -d' ' -f1")
  if [[ "$sha_remoto" != "$sha_local" ]]; then
    log "  ✗ VERIFICACAO FALHOU — local ${sha_local:0:16}… remoto ${sha_remoto:0:16}…"
    log "    NADA sera apagado. O pacote fica no core para investigacao."
    FALHAS+=("$camada: verificacao sha256 do round-trip")
    return 1
  fi
  log "  ✓ verificado — sha256 identico apos baixar do Drive"

  if [[ "$SO_ARQUIVAR" == "true" ]]; then
    log "  · --so-arquivar: purga pulada por opcao"
    return 0
  fi

  # POLITICA DE PURGA POR CAMADA — nem toda camada pode sair da maquina agora.
  #
  #   raw       -> PURGA. E re-baixavel da fonte (portais publicos), a coleta e
  #                incremental por municipio, e e a camada que encheu a VPS.
  #                Depois de arquivado e verificado, nao ha razao para ficar.
  #
  #   extracted -> NAO purga por padrao. E a ENTRADA do publicador:
  #                `publicar_municipios_brasil.py:188` le
  #                data/extracted/{ibge}/{area}/saida. Apagar antes de publicar
  #                quebraria a publicacao do que ainda nao foi publicado — e o
  #                que ainda nao foi publicado e a maior parte (o cursor do
  #                Sprint2 parou em 989 de 5.571).
  #
  #                Depois que a publicacao alcancar o coletado, este default
  #                muda: passa a purgar por municipio JA presente em
  #                data/public. Ate la, `--forcar-purga` faz o servico manual.
  if [[ "$camada" == "extracted" && "$FORCAR_PURGA" != "true" ]]; then
    log "  · extracted arquivado e verificado; purga NAO feita de proposito"
    log "    (e a entrada do publicador; purgar antes de publicar perderia o"
    log "     que ainda nao foi ao ar. Use --forcar-purga para sobrepor.)"
    return 0
  fi

  # -- 5. purga na VPS (irreversivel; so chega aqui se o passo 4 passou) -----
  #
  # Apaga o CONTEUDO de data/$camada, preservando o proprio diretorio e o
  # cache nacional compartilhado (_nacional/), que e reusado por todos os
  # municipios e nao e lixo por municipio.
  log "  ▶ purga data/$camada na VPS (preservando _nacional/)"
  local antes depois
  antes=$(ssh "$VPS_SSH" "du -sh $VPS_REPO/data/$camada 2>/dev/null | cut -f1" || echo "?")
  if ! ssh "$VPS_SSH" "find $VPS_REPO/data/$camada -mindepth 1 -maxdepth 1 ! -name '_nacional' -exec rm -rf {} + 2>/dev/null; true"; then
    log "  ✗ purga falhou"
    FALHAS+=("$camada: purga na VPS")
    return 1
  fi
  depois=$(ssh "$VPS_SSH" "du -sh $VPS_REPO/data/$camada 2>/dev/null | cut -f1" || echo "?")
  log "  ✓ purgado: $antes → $depois (arquivo no Drive: $nome)"

  # o pacote local no core tambem sai: ele ja cumpriu o papel e o core nao e
  # deposito. O .sha256 fica como recibo, que e minusculo.
  ssh "$CORE_SSH" "rm -rf '$CORE_WORK/$camada' '$CORE_WORK/$nome'" >> "$LOG_FILE" 2>&1 || true
}

log "=== Arquivamento para o GDrive iniciado (camadas: ${CAMADAS[*]}) ==="
log "Log: $LOG_FILE"

for camada in "${CAMADAS[@]}"; do
  arquivar_camada "$camada" || true
done

log "=== Arquivamento concluido ==="
if [[ ${#FALHAS[@]} -gt 0 ]]; then
  log "ATENCAO: ${#FALHAS[@]} falha(s):"
  for f in "${FALHAS[@]}"; do log "  ✗ $f"; done
  exit 1
fi
log "Tudo verificado."
