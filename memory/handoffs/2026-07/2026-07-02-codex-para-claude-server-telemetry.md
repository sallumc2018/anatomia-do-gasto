# Handoff Codex para Claude — telemetria do sallumc-server

## Escopo entregue pelo Codex

- Criado script read-only de telemetria:
  - `tools/server/server_health_snapshot.py`
- Criados testes:
  - `tools/server/test_server_health_snapshot.py`
- Criada documentacao operacional:
  - `docs/server-health-telemetry.md`

## O que o script mede

- Host, timestamp UTC e uptime/load average.
- Memoria, swap e disco.
- Top processos por RSS.
- `git status --porcelain=v1 --branch` do clone local.
- `crontab -l` apenas para confirmar entradas de coleta.
- Lock `/tmp/coleta_noturna_anatomia.lock`.
- Ultimo log em `_logs/coleta_noturna/coleta_*.log`, com contagem de falhas/avisos.

## Garantias de seguranca

- Sem rede.
- Sem acesso a `.env`, tokens, cookies, `.vercel`, `~/.ssh` ou credenciais.
- Saida em `_logs/server_health/`, que deve continuar ignorado pelo Git.
- Sanitizacao defensiva de marcadores comuns de segredo em textos coletados de logs.

## Tarefa do Claude quando voltar

- No servidor, depois de puxar os commits:

```bash
cd /home/sallumc/anatomia-do-gasto
.venv/bin/python3 tools/server/server_health_snapshot.py --stdout
```

- Se o teste manual estiver OK, instalar cron leve:

```cron
*/15 * * * * cd /home/sallumc/anatomia-do-gasto && /home/sallumc/anatomia-do-gasto/.venv/bin/python3 tools/server/server_health_snapshot.py >> _logs/server_health/cron.log 2>&1
```

## Proximo passo recomendado

- Claude: operar/agendar no `sallumc-server`.
- Codex: depois, integrar leitura do `latest.json` no Omega HUD de forma privada, sem publicar telemetria operacional no ADG publico.
