# Operação da coleta — um serviço, sem cron

## Objetivo

- Manter a coleta rodando até fechar os 5.571 municípios do Brasil.
- Publicar somente dados e manifestos auditáveis.
- Impedir commit/push quando a coleta falhar ou quando a worktree já estiver suja.
- **Avisar quando algo falhar** — sem exigir que alguém vá olhar.

## Arquitetura atual (16/08/2026)

**Um único serviço, sempre ligado**, na `omega-vps`:

```
sprint2.service  →  scripts/sprint2_24x7_worker.py --loop --sleep 30
                                                   --commit-push-every 25 --push
```

Ele tem duas fases:

| fase | o que faz | cadência |
|---|---|---|
| **diária** | `scripts/coleta_noturna.sh` — SIOPS, SIOPE/FNDE, RPPS, RREO de segurança e transporte, transferências estaduais de SP, CEIS/CNEP e os raspadores de Sorocaba e Paulínia | 1× por dia, guardada por marcador em fuso de Brasília |
| **nacional** | um município por volta: coleta as 11 etapas federais e publica | contínua |

A cada 25 sucessos: `git pull --rebase` → gates → `commit` → `push`.

## Por que não há mais cron nem timer

Até 16/08/2026 havia **dois agendadores** para o mesmo clone: este worker e um
`sprint1.timer` de usuário disparando às 01:00 BRT. Os dois commitavam no mesmo
repositório, o que exigiu um `flock` compartilhado (`_logs/git.lock`) para não
corromperem o índice do git um do outro.

Duas coisas independentes disputando um recurso são mais difíceis de raciocinar
do que uma coisa com duas fases. Hoje a coleta diária é uma **fase** do worker:
nunca concorre consigo mesma e há um único serviço para ligar, desligar e vigiar.
O `flock` continua no código como cinto de segurança, não como necessidade.

**Não bastava apagar o timer**: a coleta diária cobre áreas que a fila nacional
não coleta. Apagá-lo sem absorver essas etapas perderia dado.

**Custo medido:** ~1h20 por dia com a fila nacional parada. No ritmo real de
13,2 municípios/hora sobre os 4.466 restantes (~14 dias), atrasa a conclusão em
cerca de um dia — em troca de um serviço em vez de três.

## Quando o Brasil terminar

O worker percorre o manifesto de forma **circular**: ao chegar em 5.571 ele
volta ao começo e recoleta, o que mantém os dados frescos. Se a preferência
passar a ser parar, é `systemctl disable --now sprint2.service`.

## Deploy

A integração Git do projeto na Vercel seguia o repositório **`anatomia-do-gasto-old`**
(ID `1227495789`), não o vivo (`anatomia-do-gasto`, ID `1273727525`). A Vercel
rastreia repositório por **ID**, não por nome: quando o projeto foi recomeçado
limpo em 18/06/2026 — repo novo criado, antigo renomeado para `-old` — ela
continuou fielmente conectada ao antigo.

Efeito: o último deploy de **produção** foi em **20/06/2026**. Tudo depois disso
ficou fora do ar sem erro nenhum, porque os pushes iam para um repositório que a
Vercel não observava. Era esta a causa de `/apoie` responder 404 desde 26/07.

Reconectado em 16/08/2026. Desde então o deploy é **automático por push**, sem
Deploy Hook e sem credencial guardada na VPS.

`scripts/vercel_ignore_build.sh` é o *Ignored Build Step* que evita a tempestade
de builds registrada no `DECISIONS.md` ("cancela deploys automaticamente" — que
era sintoma de ~7 pushes/dia, não escolha de política):

| commit | decisão |
|---|---|
| algo fora de `data/` | constrói |
| coleta diária | constrói |
| incremental do worker | pula |
| atualização agendada do robô | pula |
| qualquer dúvida | constrói |

A dúvida constrói de propósito: um build a mais custa minutos; um build a menos
deixa o site desatualizado sem ninguém perceber — que foi o estado entre 20/06 e
16/08.

## Alertas

`scripts/notificar.sh` é o canal único. Ele **sempre grava** em
`~/.local/state/omega/anatomia-alertas/alertas.log` e **empurra** por qualquer
canal configurado:

| variável | canal |
|---|---|
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | Telegram |
| `ANATOMIA_ALERTA_WEBHOOK` | POST de texto puro — serve ntfy, Discord, Slack e push monitor do Uptime Kuma |

Sem nenhum canal, ele escreve `SEM_CANAL` no log, para silêncio nunca ser
confundido com "está tudo bem".

**Canal ativo desde 16/08/2026:** um tópico `ntfy.sh` aleatório, configurado em
`~/.config/omega/secrets.env` (chmod 600) na estação e na VPS. Escolhido porque
o ntfy aceita publicação **sem credencial** — não exigiu token de ninguém, e por
isso pôde ser ligado de imediato. O tópico tem 24 caracteres aleatórios, então é
inadivinhável na prática; ainda assim, tópico público do ntfy é legível por quem
souber o nome. As mensagens não contêm segredo (host, nome do serviço, código de
saída), mas se a preferência for sigilo real, Telegram ou ntfy auto-hospedado
substituem sem mudar uma linha de código — basta trocar a variável.

Verificado ponta a ponta: mensagens da estação e da VPS entregues no tópico.

Dispara em dois níveis:

1. **Interno** — o worker chama `notificar_falha()` quando a coleta diária falha
   ou um gate barra o commit.
2. **Do systemd** — `OnFailure=anatomia-alerta@%n.service` cobre o caso que o
   código não alcança: o processo morrer por OOM, erro não tratado ou falha de
   start.

> **Histórico que justifica o nível 2.** Havia dois mecanismos de notificação e
> nenhum funcionava: o worker chamava `~/.claude/notify.sh`, que não existe na
> VPS, e o `coleta_noturna.sh` dependia de `~/.config/omega/secrets.env`, que
> também não existe lá. Nenhuma falha deste projeto jamais saiu da máquina — a
> coleta ficou 4 dias fora do ar em agosto sem ninguém notar.

## Verificação rápida

```bash
systemctl is-active sprint2.service
ssh omega-vps 'cd ~/anatomia-do-gasto-sprint2 && python3 -c "
import json; d=json.load(open(\"_logs/sprint2_24x7/state.json\"))
print(d[\"cursor\"], \"de 5571 |\", d[\"total_successes\"], \"sucessos\")"'
tail -5 ~/.local/state/omega/anatomia-alertas/alertas.log
```
