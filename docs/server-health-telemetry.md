# Telemetria read-only do servidor de coleta

## Objetivo

- Rodar no `sallumc-server` para acompanhar carga, memoria, disco, cron, Git e ultima coleta noturna.
- Liberar o computador principal de verificacoes recorrentes leves.
- Manter a telemetria local em `_logs/server_health/`, sem publicar artefatos operacionais no repositorio publico.

## Comando manual

```bash
cd /home/omega-blue/Documentos/Projects/anatomia-do-gasto
.venv/bin/python3 tools/server/server_health_snapshot.py --stdout
```

## Saidas locais

- `_logs/server_health/latest.json`
- `_logs/server_health/server_health_YYYYMMDD_HHMMSS.json`

## Garantias

- Nao usa rede.
- Nao acessa `.env`, `~/.ssh`, tokens, cookies, `.vercel` ou diretorios de credenciais.
- Sanitiza marcadores comuns de segredo caso aparecam em logs operacionais.
- Le apenas `/proc`, status Git, crontab do usuario, disco e logs `_logs/coleta_noturna/`.

## Automacao sugerida

```cron
*/15 * * * * cd /home/omega-blue/Documentos/Projects/anatomia-do-gasto && /home/omega-blue/Documentos/Projects/anatomia-do-gasto/.venv/bin/python3 tools/server/server_health_snapshot.py >> _logs/server_health/cron.log 2>&1
```

## Integracao futura com HUD

- O HUD deve consumir somente `_logs/server_health/latest.json`.
- Se houver sincronizacao entre servidor e PC principal, usar caminho privado dentro do Omega Ecosystem, nao o repositorio publico.
- Nao versionar os JSONs gerados.
