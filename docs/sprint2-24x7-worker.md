# Sprint 2 24/7 Worker

## Objetivo

- Rodar coleta continua no `sallumc-server`.
- Processar um municipio por vez.
- Retomar pelo ultimo cursor salvo.
- Reprocessar em ciclo continuo ate cobrir todos os municipios e manter dados atualizados.
- Publicar no repositorio publico apenas dados que passem pelos gates.

## Comando base

```bash
cd /home/omega-blue/Documentos/Projects/anatomia-do-gasto
.venv/bin/python3 scripts/sprint2_24x7_worker.py --loop --sleep 30 --commit-push-every 25
```

## Estado operacional

- `_logs/sprint2_24x7/state.json`
- `_logs/sprint2_24x7/events_YYYYMMDD.jsonl`
- `_logs/sprint2_24x7/runs/*.log`
- `_logs/sprint2_24x7/worker.lock`

Esses arquivos sao operacionais e ficam fora do Git.

## Garantias

- Lock local impede dois workers simultaneos.
- Cursor persistente permite retomada apos queda.
- Cada municipio roda coleta e publicacao isoladas por IBGE.
- Falhas ficam registradas em `failures_by_ibge`.
- Commit/push automatico e opcional.
- Antes de commit/push, o worker regenera catalogo/cobertura e roda gates.

## Separacao LAI/LGPD

- `data/public/` deve conter somente dados publicaveis.
- Dados brutos e privados devem ficar fora do repo publico.
- Qualquer material com PII, segredo, credencial ou dado nao publicavel deve ir para area privada do Omega, nunca para `data/public/`.
- Coleta publica automatica deve ser bloqueada por gate quando houver risco de exposicao.

## Systemd sugerido

```ini
[Unit]
Description=Anatomia do Gasto Sprint 2 24x7 Worker
After=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/omega-blue/Documentos/Projects/anatomia-do-gasto
ExecStart=/home/omega-blue/Documentos/Projects/anatomia-do-gasto/.venv/bin/python3 scripts/sprint2_24x7_worker.py --loop --sleep 30 --commit-push-every 25
Restart=always
RestartSec=60

[Install]
WantedBy=default.target
```

## Primeiro ciclo recomendado

1. Rodar teste curto:

```bash
.venv/bin/python3 scripts/sprint2_24x7_worker.py --max-municipios 1 --dry-run-commit
```

2. Se passar, iniciar em loop sem commit/push:

```bash
.venv/bin/python3 scripts/sprint2_24x7_worker.py --loop --sleep 30
```

3. Depois de validar os gates, ativar commit/push em lote.
