# Handoff Codex para Claude — fallback seguro do cron ADG

## Atualizacao importante

- Este wrapper virou fallback.
- O caminho principal agora e o worker continuo:
  - `scripts/sprint2_24x7_worker.py`
  - `docs/sprint2-24x7-worker.md`

## O que o Codex mudou

- Criou wrapper versionado:
  - `scripts/coleta_wrapper_server.sh`
- Endureceu a coleta:
  - `scripts/coleta_noturna.sh` agora usa `set -Eeuo pipefail`.
  - Argumento opcional `--dry-run` ficou seguro com `${1:-}`.
- Documentou o fluxo:
  - `docs/server-cron-pipeline.md`

## Decisao operacional

- O cron do servidor pode chamar `/home/omega-blue/coleta_wrapper.sh` apenas como fallback.
- Esse arquivo deve ser uma copia instalada de `scripts/coleta_wrapper_server.sh`.
- A coleta atual nao precisa ser interrompida.
- Para cobertura Brasil 24/7, preferir systemd com o worker continuo.

## Gatilhos de bloqueio

- Worktree suja antes da coleta.
- `git pull --ff-only` falhar.
- `scripts/coleta_noturna.sh` falhar.
- Gate de segredo staged falhar.
- Gate pre-deploy falhar.
- Verificacao de publicacao falhar.
- Gate de slug Sprint 2 falhar.
- Gate de tracing Turbopack falhar.

## Escopo do commit automatico

- `data/public/`
- `data/manifests/sprint2/`
- `data/manifests/datasets_status.json`
- `apps/web/lib/datasets_status.json`

## O que o Claude precisa verificar quando voltar

- Confirmar no servidor:

```bash
diff -u /home/omega-blue/Documentos/Projects/anatomia-do-gasto/scripts/coleta_wrapper_server.sh /home/omega-blue/coleta_wrapper.sh
crontab -l
```

- Acompanhar o primeiro ciclo completo com o wrapper novo.
- Se um gate bloquear, revisar os dados rejeitados antes de qualquer push manual.
