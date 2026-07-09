# STATUS — Anatomia do Gasto
> **Regra:** ao atingir 40 linhas, migrar em batch p/ STATUS_HISTORICO.md; manter as 20 ativas + esta linha.
## Ativo — 2026-07-09
- Ranking Fase 1 (transferências) ✅ `pipelines/gerar_ranking_transferencias.py` criado + `data/manifests/rankings/transferencias.json` gerado; FNS 183/5.571 municípios (3,28%) ok; **`emendas_federais` bloqueado**: valor_pago/liquidado/empenhado zerados em 100% das 15.015 linhas coletadas — bug de extrator upstream (Portal Transparência), não falta de execução real; corrigir extrator antes de rankear
- Sprint 2 🔄 +46 municípios commitados (`92ccd06c`); cron 05:05 UTC × 3h; cobertura crescendo
- Deploy ✅ manual autorizado pelo usuário 2026-07-09; push `d9f30e32` + deploy `dpl_HkpXk3VSKxQjPBdDjYJcH3nfUCHK` READY
- Sprint 1 transferências ✅ refresh SP 2020-2026 (Fazenda-SP) commitado junto
- Sprint 1 transferências ✅ `e3acdfb5`: fase_transferencias_federais usa rodar_warn() (403 não bloqueia)
- TCE contas anuais ✅ bug confirmado resolvido: IBGE filter OK (Sorocaba=10, Paulínia=10, Gov=0)
- Sorocaba score 80.2% (calc_score.py 2026-07-05)
- Paulínia score 80.2% (calc_score.py 2026-07-05); câmara+PNCP+executivo publicados ✅
- P2 Confiabilidade 🔄 Ruff keys + hotspot refactor pendentes
- Portal Transparência ⚠️ conta bloqueada por rate limit (Sprint 2); aguarda desbloqueio email sallumc@gmail.com
## Blockers
- `npm install/update/audit fix` — PROIBIDO (worm mai/2026)
- Portal Transparência: conta bloqueada (rate limit Sprint 2) + chave sem escopo `/transferencias`. Requer desbloqueio + re-cadastro com escopo "Transferências"
- CPF em git history ✅ RESOLVIDO 2026-07-09: varredura completa de todos os 35.003 blobs alcançáveis de `origin/main` — 0 CPF real (único match é o regex-fonte de `sanear_cpf_publicos.py`). CPF real só existe em `worktree-uiux-anatomia`/tag `fluxo/coleta/v1.0` (histórico completo pré-squash, nunca esteve em `origin`; arquivo privado local+server por design). Usuário decidiu manter como está — sem BFG, sem force-push.
## Municípios
| Município | Status |
|---|---|
| Sorocaba | ✅ publicado (80.2% cobertura) |
| Paulínia | ✅ publicado (80.2% cobertura); PNCP workaround `/api/search/` ativo |
| SP + 18 municípios SP | 🔄 Sprint 1 — coleta noturna ativa |
| Brasil 5571 | 🔄 Sprint 2 — 218 coletados, worker circular ativo |
