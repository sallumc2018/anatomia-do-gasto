# Pipeline de cron do sallumc-server

## Objetivo

- Manter um fallback seguro de coleta no `sallumc-server`.
- Publicar somente dados e manifests auditaveis.
- Impedir commit/push quando a coleta falhar ou quando a worktree ja estiver suja.

## Status

- Fallback/legado.
- O caminho principal para cobertura Brasil continua e o worker 24/7:
  - `scripts/sprint2_24x7_worker.py`
  - `docs/sprint2-24x7-worker.md`

## Wrapper canonico

- Arquivo versionado: `scripts/coleta_wrapper_server.sh`
- Instalar no servidor como: `/home/omega-blue/coleta_wrapper.sh`
- Cron esperado:

```cron
0 */4 * * * /home/omega-blue/coleta_wrapper.sh >> /home/omega-blue/Documentos/Projects/anatomia-do-gasto/_logs/coleta_noturna/cron.log 2>&1
```

## Fluxo

1. Verifica se o repo e a venv existem.
2. Bloqueia se a worktree ja estiver suja antes da coleta.
3. Executa `git fetch` e `git pull --ff-only`.
4. Roda `scripts/coleta_noturna.sh`.
5. Só se a coleta terminar com sucesso:
   - adiciona `data/public/`;
   - adiciona `data/manifests/sprint2/`;
   - adiciona `data/manifests/datasets_status.json`;
   - adiciona `apps/web/lib/datasets_status.json`.
6. Roda gates leves antes do commit:
   - `tools/agents/check-secrets.py --staged`;
   - `tools/gates/pre_deploy.py`;
   - `pipelines/testes/verificar_publicacao.py`;
   - `tools/gates/check_sprint2_slug_collisions.py`;
   - `tools/gates/check_turbopack_data_tracing.py`.
7. Faz commit e push apenas se houver staged diff.

## Limites conhecidos

- Deploy continua indireto via push para GitHub/Vercel.
- O servidor nao deve rodar build pesado do Next.js.
- Se algum gate rejeitar dados, o commit/push fica bloqueado para revisao humana.
