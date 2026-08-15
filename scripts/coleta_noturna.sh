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

# 1 e 2. REMOVIDOS em 15/08/2026 — eram `rclone sync` do Drive PARA o local.
#
# O que havia aqui: sync_from_gdrive() puxava
#   gdrive:.../04_staging/anatomia-do-gasto/{raw,extracted}/ -> data/{raw,extracted}/
# com `sync`, nao `copy`. O destino ESPELHAVA a origem: arquivo local ausente
# no Drive era APAGADO. Era proposital enquanto o Drive fosse a fonte de
# verdade do cache.
#
# Por que sairam, e nao foram so repontados:
#   - A fonte que espelhavam esta congelada em 21/06/2026 (medido: 2.572
#     objetos, 312,511 MiB) enquanto os dados vivos foram para OUTRO remote,
#     gdrive-crypt:Omega-Backups/arquivo-historico/sprint2-raw/. Religar isso
#     restauraria junho por cima do presente.
#   - Repontar para o remote novo manteria uma operacao destrutiva viva,
#     apontando agora para 155 GiB em vez de 312 MiB — trocaria o calibre.
#   - data/raw nao precisa persistir: e re-baixavel da fonte e a coleta e
#     incremental por municipio. O bruto e descartado apos a extracao; o
#     arquivo frio em gdrive-crypt: existe para proveniencia, nao para runtime.
#   - data/extracted passa a ficar local em definitivo (e a entrada do
#     publicador) e e copiado para o Drive como BACKUP, nunca lido de volta.
#
# Consequencia direta: SKIP_GDRIVE_SYNC deixa de poder derrubar a coleta. Era
# essa flag, combinada com o cache esvaziado pela migracao, que fazia o
# servico morrer no passo 1 com zero trabalho feito (15/08/2026).
#
# O caminho de saida para o Drive continua vivo nos passos 5 e 6.

# 0. Convergir com o remoto ANTES de coletar.
#
# Sem isso a coleta commita sobre uma base velha e diverge de origin/main —
# foi o que produziu 7-atras/6-a-frente entre 30/07 e 15/08/2026, com dois
# escritores (o robo do GitHub Actions e esta coleta) no mesmo branch.
# --autostash porque a arvore de runtime raramente esta limpa.
if [[ "$DRY_RUN" == "true" ]]; then
  log "▶ [DRY-RUN] git fetch + pull --rebase (nada foi alterado)"
else
  log "▶ Convergir com origin/main antes de coletar"
  if git -C "$REPO" fetch -q origin main >> "$LOG_FILE" 2>&1 \
     && git -C "$REPO" pull --rebase --autostash -q origin main >> "$LOG_FILE" 2>&1; then
    log "  ✓ Convergiu com origin/main ($(git -C "$REPO" rev-parse --short HEAD))"
  else
    log "  ✗ Nao consegui convergir com origin/main — abortando antes de coletar"
    log "    (coletar sobre base divergente e o que produz a divergencia)"
    exit 1
  fi
fi

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
  # Corrigido em 15/08/2026: a mensagem antiga dizia "quem sincroniza e o
  # omega-gray". Nao era verdade — o Gray nunca teve script recorrente para
  # isto (o ~/coleta_wrapper.sh de la faz cd para um diretorio que nao existe
  # mais, e nenhum cron o chama). O hop para o Drive hoje e VPS -> omega-core
  # -> gdrive-crypt:, por pull do core via rrsync -ro. Enquanto ele nao for
  # agendado, este passo simplesmente nao acontece — e dizer isso e melhor do
  # que apontar para um responsavel que nao existe.
  log "▶ Sync GDrive PULADO (SKIP_GDRIVE_SYNC=1) — hop pendente de agendamento no omega-core"
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
# O --dry-run precisa valer aqui tambem. Sem esta guarda, um "ensaio" fazia
# `git add` de verdade: um dry-run na VPS deixou 22.169 arquivos staged no repo
# de runtime. Ensaio que altera estado nao e ensaio.
if [[ "$DRY_RUN" == "true" ]]; then
  log "  [DRY-RUN] git add + commit do lote (nada foi alterado)"
  DRY_RUN_SKIP_COMMIT=1
fi
if [[ "${DRY_RUN_SKIP_COMMIT:-0}" != "1" ]]; then
# LOCK COMPARTILHADO COM O SPRINT2 — os dois escrevem no MESMO clone da VPS.
#
# O sprint2_24x7_worker.py roda em loop continuo e commita a cada N municipios;
# esta coleta commita uma vez por noite. Sem serializacao, um `git add` pode
# capturar o lote do outro pela metade, ou os dois disputam .git/index.lock e
# um falha. Em 15/08/2026 os dois ficaram ativos ao mesmo tempo pela primeira
# vez e o risco deixou de ser teorico.
#
# O worker.lock que ja existia NAO serve: protege contra dois workers e fica
# tomado durante o loop inteiro — esta coleta esperaria para sempre. Este e
# tomado so em volta do trecho de git.
#
# Do outro lado, o worker usa fcntl.flock no MESMO arquivo. flock(2) do kernel
# e o protocolo comum; nada foi inventado.
exec {GIT_LOCK_FD}> "$REPO/_logs/git.lock"
if ! flock -w 900 "$GIT_LOCK_FD"; then
  log "  ✗ git.lock ocupado por mais de 900s (Sprint2 commitando?) — pulando commit desta noite"
  FALHAS+=("Commit local do lote noturno (git.lock ocupado > 900s)")
  DRY_RUN_SKIP_COMMIT=1
fi
fi
if [[ "${DRY_RUN_SKIP_COMMIT:-0}" != "1" ]]; then
git -C "$REPO" add -- data/public data/manifests apps/web/lib/datasets_status.json 2>/dev/null || true
if git -C "$REPO" diff --cached --quiet; then
  log "  · nada novo para commitar"
else
  # ATENCAO ao que cada um destes dois faz de verdade:
  #
  #   check-secrets.py --staged  -> gate REAL. Sai != 0 se achar segredo, e
  #                                 barra o commit. E a defesa que importa num
  #                                 repositorio publico.
  #   pre_deploy.py              -> ADVISORY aqui. Ele so bloqueia com --block
  #                                 (`return 1 if args.block else 0`, linha 171);
  #                                 sem a flag sai 0 mesmo reprovando. Fica na
  #                                 cadeia porque registra o diagnostico no log.
  #
  # Nao adicione --block sem antes resolver dois checks que sao falsos
  # positivos NESTE ponto do ciclo: "Working tree apps/web limpo" reprova
  # porque o lote da noite esta staged, e "Commits nao-pushados" reprova
  # porque o push ainda nao aconteceu (ele vem logo abaixo). pre_deploy e
  # gate de DEPLOY; usa-lo como gate de COMMIT inverte a ordem do ciclo.
  if "$REPO/.venv/bin/python3" "$REPO/tools/agents/check-secrets.py" --staged >> "$LOG_FILE" 2>&1 \
    && "$REPO/.venv/bin/python3" "$REPO/tools/gates/pre_deploy.py" >> "$LOG_FILE" 2>&1; then
    if git -C "$REPO" commit -q \
      -m "chore(coleta): coleta noturna $(date -u +%Y-%m-%d)" \
      -m "Coleta automatica via coleta_noturna.sh (00h-06h BRT)." \
      -m "[Claude-CP > claude-opus-5 > High]" >> "$LOG_FILE" 2>&1
    then
      log "  ✓ Commit local criado"

      # PUSH — o fecho do ciclo. Sem ele o commit fica represado e o repo
      # diverge de origin/main a cada noite; foi assim ate 15/08/2026, quando
      # a credencial desta maquina era deploy key do omega-trader e nao tinha
      # escrita aqui. Agora usa ~/.ssh/id_ed25519_anatomia via `github-anatomia`.
      #
      # Retentativa unica com rebase no meio: a janela entre commit e push e o
      # unico ponto onde o robo do GitHub Actions (cron 03:00 UTC) pode entrar
      # na frente. Nao insiste alem disso — push que falha duas vezes e falha
      # de verdade e tem que aparecer no relatorio.
      if git -C "$REPO" push -q origin main >> "$LOG_FILE" 2>&1; then
        log "  ✓ Push para origin/main"
      else
        log "  · push rejeitado — convergindo e tentando outra vez"
        if git -C "$REPO" pull --rebase --autostash -q origin main >> "$LOG_FILE" 2>&1 \
           && git -C "$REPO" push -q origin main >> "$LOG_FILE" 2>&1; then
          log "  ✓ Push para origin/main (2a tentativa, apos rebase)"
        else
          log "  ✗ Push falhou nas duas tentativas"
          FALHAS+=("Push para origin/main (2 tentativas — repo fica divergente ate a proxima noite)")
        fi
      fi
    else
      log "  ✗ git commit falhou (ver log)"
      FALHAS+=("Commit local do lote noturno (git commit falhou apos gates OK — ver log; hooks/assinatura?)")
    fi
  else
    log "  ✗ Gates de commit falharam — deixando staged para revisão manual"
    FALHAS+=("Commit local do lote noturno (gate falhou)")
  fi
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
