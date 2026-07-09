# STATUS — Anatomia do Gasto
> **Regra:** ao atingir 40 linhas, migrar em batch p/ STATUS_HISTORICO.md; manter as 20 ativas + esta linha.
## Ativo — 2026-07-09
- Ranking Fase 1 (transferências) ✅ `pipelines/gerar_ranking_transferencias.py` criado + `data/manifests/rankings/transferencias.json` gerado; FNS 183/5.571 municípios (3,28%) ok; `emendas_federais` bloqueado automaticamente pelo script (ver linha abaixo)
- `emendas_federais` extrator ✅ CORRIGIDO E VALIDADO 2026-07-09 (bug de arquitetura, não de formatação: `/api-de-dados/emendas` **não tem filtro por município**, só `codigoEmenda`/`numeroEmenda`/`nomeAutor`/`tipoEmenda`/`ano`/`codigoFuncao`/`codigoSubfuncao`/`pagina` — confirmado via swagger oficial). Script antigo usava params inválidos (`localidadeGasto`/`anoExercicio`), ignorados silenciosamente pela API; os 77 municípios publicados tinham as mesmas 52 linhas idênticas, só relabeladas com IBGE errado. `pipelines/baixar_emendas_federais.py` reescrito: `ano`+`pagina` reais, cache nacional compartilhado em `data/raw/_nacional/emendas_federais/`, filtro client-side por `localidadeDoGasto` (9 testes verdes). Dado errado publicado foi para quarentena local (`data/private/quarentena/2026-07-09-emendas-federais-mislabeled/`, autorizado pelo usuário) e removido de `data/public/` (commit `5ddc1466`). **Validado ponta a ponta 2026-07-09** com chave nova (conta desbloqueada): Sorocaba/2023 → 6.110 emendas nacionais paginadas, 4 filtradas corretamente para Sorocaba (`localidade_do_gasto_raw: "SOROCABA - SP"`), valores reais não-zerados (R$ 2.103.376,00 empenhados). Falta apenas rodar a coleta nacional completa (todos os anos/municípios) e regenerar o ranking.
- Sprint 2 🔄 +46 municípios commitados (`92ccd06c`); cron 05:05 UTC × 3h; cobertura crescendo
- Deploy ✅ manual autorizado pelo usuário 2026-07-09; push `d9f30e32` + deploy `dpl_HkpXk3VSKxQjPBdDjYJcH3nfUCHK` READY
- Sprint 1 transferências ✅ refresh SP 2020-2026 (Fazenda-SP) commitado junto
- Sprint 1 transferências ✅ `e3acdfb5`: fase_transferencias_federais usa rodar_warn() (403 não bloqueia)
- TCE contas anuais ✅ bug confirmado resolvido: IBGE filter OK (Sorocaba=10, Paulínia=10, Gov=0)
- Sorocaba score 80.2% (calc_score.py 2026-07-05)
- Paulínia score 80.2% (calc_score.py 2026-07-05); câmara+PNCP+executivo publicados ✅
- P2 Confiabilidade 🔄 Ruff keys + hotspot refactor pendentes
- Portal Transparência ✅ desbloqueada 2026-07-09; nova chave ativa e testada (`api-de-dados/emendas` respondendo normalmente)
## Blockers
- `npm install/update/audit fix` — PROIBIDO (worm mai/2026)
- Portal Transparência ✅ RESOLVIDO 2026-07-09: conta desbloqueada, chave nova ativa e validada contra `/api-de-dados/emendas`
- CPF em git history ✅ RESOLVIDO 2026-07-09: varredura completa de todos os 35.003 blobs alcançáveis de `origin/main` — 0 CPF real (único match é o regex-fonte de `sanear_cpf_publicos.py`). CPF real só existe em `worktree-uiux-anatomia`/tag `fluxo/coleta/v1.0` (histórico completo pré-squash, nunca esteve em `origin`; arquivo privado local+server por design). Usuário decidiu manter como está — sem BFG, sem force-push.
## Municípios
| Município | Status |
|---|---|
| Sorocaba | ✅ publicado (80.2% cobertura) |
| Paulínia | ✅ publicado (80.2% cobertura); PNCP workaround `/api/search/` ativo |
| SP + 18 municípios SP | 🔄 Sprint 1 — coleta noturna ativa |
| Brasil 5571 | 🔄 Sprint 2 — 218 coletados, worker circular ativo |
