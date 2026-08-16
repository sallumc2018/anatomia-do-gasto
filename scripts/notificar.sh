#!/bin/bash
# Notificador unico do projeto. Uso:
#   bash scripts/notificar.sh "<titulo>" "<detalhe>"
#
# POR QUE ELE EXISTE
# Ate 16/08/2026 o projeto tinha DOIS mecanismos de aviso e NENHUM funcionava:
#
#   1. sprint2_24x7_worker.py chamava notify_telegram(), que procura
#      ~/.claude/notify.sh. Esse arquivo NAO EXISTE na omega-vps — a funcao
#      retornava em silencio. O worker nunca avisou nada, nunca.
#   2. coleta_noturna.sh tem bloco proprio de Telegram, condicionado a
#      ~/.config/omega/secrets.env. Esse arquivo tambem NAO EXISTE na VPS
#      (so existe secrets/by-project/portais.env, com a chave do Portal).
#
# Resultado: a coleta ficou 4 dias fora do ar em agosto sem ninguem notar, e o
# servico terminava vermelho toda noite sem que isso chegasse a lugar nenhum.
# Aviso que nao sai da maquina nao e aviso.
#
# DESENHO
# Este script SEMPRE registra em disco, e ADICIONALMENTE empurra por qualquer
# canal configurado. Registrar sempre garante que o historico existe mesmo sem
# credencial; empurrar e o que faz voce nao precisar olhar.
#
# Canais, todos opcionais e independentes (usa todos os que estiverem prontos):
#   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID  -> mensagem no Telegram
#   ANATOMIA_ALERTA_WEBHOOK                -> POST do texto puro na URL.
#                                             Serve para ntfy.sh, Discord,
#                                             Slack e push monitor do Uptime
#                                             Kuma sem codigo adicional.
#
# NUNCA falha: um notificador que derruba quem o chamou transforma um aviso em
# um segundo incidente. Sai 0 em qualquer cenario.

set -uo pipefail

TITULO="${1:-Alerta}"
DETALHE="${2:-}"
HOST=$(hostname -s 2>/dev/null || echo "?")
AGORA=$(date -u +"%Y-%m-%d %H:%M:%SZ")

REPO=$(cd "$(dirname "$0")/.." && pwd)
LOG_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/omega/anatomia-alertas"
mkdir -p "$LOG_DIR" 2>/dev/null || true
LOG="$LOG_DIR/alertas.log"

# Carrega segredos se existirem (mesma convencao do coleta_noturna.sh).
for f in "${OMEGA_SECRETS:-${XDG_CONFIG_HOME:-$HOME/.config}/omega/secrets.env}" \
         "${PORTAIS_ENV:-${XDG_CONFIG_HOME:-$HOME/.config}/omega/secrets/by-project/portais.env}"; do
  # shellcheck disable=SC1090
  [ -f "$f" ] && { set +u; . "$f"; set -u; }
done

MSG="⚠️ Anatomia do Gasto — ${TITULO}
host: ${HOST}
quando: ${AGORA}
${DETALHE}"

# 1. Registro duravel (sempre)
printf '%s\t%s\t%s\t%s\n' "$AGORA" "$HOST" "$TITULO" "${DETALHE//$'\n'/ }" >> "$LOG" 2>/dev/null || true

# 2. Telegram, se houver credencial.
#    A URL vai em arquivo de config com permissao 600 para o token nao aparecer
#    em `ps aux` — mesmo cuidado que o coleta_noturna.sh ja tomava.
if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
  _um=$(umask); umask 077; CFG=$(mktemp); umask "$_um"
  trap 'rm -f "${CFG:-}"' EXIT INT TERM HUP
  printf 'url = "https://api.telegram.org/bot%s/sendMessage"\n' "$TELEGRAM_BOT_TOKEN" > "$CFG"
  curl -s --max-time 10 --config "$CFG" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${MSG}" > /dev/null 2>&1 || true
  rm -f "$CFG"; trap - EXIT INT TERM HUP
fi

# 3. Webhook generico, se houver.
if [ -n "${ANATOMIA_ALERTA_WEBHOOK:-}" ]; then
  curl -s --max-time 10 -X POST -H "Content-Type: text/plain; charset=utf-8" \
    --data-binary "$MSG" "$ANATOMIA_ALERTA_WEBHOOK" > /dev/null 2>&1 || true
fi

# 4. Se nenhum canal existe, deixa isso EVIDENTE no log — para o silencio nao
#    ser confundido com "esta tudo bem", que foi exatamente o erro anterior.
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] && [ -z "${ANATOMIA_ALERTA_WEBHOOK:-}" ]; then
  printf '%s\tSEM_CANAL\tAlerta so foi gravado em disco: configure TELEGRAM_BOT_TOKEN+TELEGRAM_CHAT_ID ou ANATOMIA_ALERTA_WEBHOOK\n' \
    "$AGORA" >> "$LOG" 2>/dev/null || true
fi

exit 0
