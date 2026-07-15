# Handoff Codex para Claude — Sprint 2 24/7

## Entrega do Codex

- Worker continuo:
  - `scripts/sprint2_24x7_worker.py`
- Testes:
  - `tools/server/test_sprint2_24x7_worker.py`
- Documentacao:
  - `docs/sprint2-24x7-worker.md`
- Fallback de cron endurecido:
  - `scripts/coleta_wrapper_server.sh`
  - `docs/server-cron-pipeline.md`

## Modelo operacional recomendado

- Parar de depender de cron a cada 4h como caminho principal.
- Usar um servico systemd no `sallumc-server` rodando:

```bash
cd /home/omega-blue/Documentos/Projects/anatomia-do-gasto
.venv/bin/python3 scripts/sprint2_24x7_worker.py --loop --sleep 30 --commit-push-every 25
```

## Antes de ativar commit/push automatico

- Rodar primeiro sem commit/push:

```bash
.venv/bin/python3 scripts/sprint2_24x7_worker.py --loop --sleep 30
```

- Verificar:
  - `_logs/sprint2_24x7/state.json`
  - `_logs/sprint2_24x7/events_YYYYMMDD.jsonl`
  - `_logs/sprint2_24x7/runs/*.log`

## Salvaguardas

- Lock impede dois workers simultaneos.
- Cursor persistente permite retomada.
- Coleta/publicacao por IBGE isolado.
- Dados publicos so entram em `data/public/` depois do publicador/gates.
- Commit/push roda apenas em lote e passa por gates antes.

## LAI/LGPD

- Repositorio publico recebe somente material publicavel.
- Dados brutos, privados ou com PII devem ficar fora do repo publico.
- Se surgir dado sensivel, manter em area privada do Omega e documentar classificacao.

## Pendencias do Claude

- Instalar/ativar systemd no servidor.
- Acompanhar primeiro ciclo.
- Desativar ou manter cron antigo apenas como fallback, evitando execucoes concorrentes.
