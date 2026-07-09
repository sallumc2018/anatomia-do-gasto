# STATUS — Anatomia do Gasto
> **Regra:** ao atingir 40 linhas, migrar em batch p/ STATUS_HISTORICO.md; manter as 20 ativas + esta linha.
## Ativo — 2026-07-09
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
- CPF em git history: sanitizar com BFG Repo Cleaner (requer confirmação do usuário)
## Municípios
| Município | Status |
|---|---|
| Sorocaba | ✅ publicado (80.2% cobertura) |
| Paulínia | ✅ publicado (80.2% cobertura); PNCP workaround `/api/search/` ativo |
| SP + 18 municípios SP | 🔄 Sprint 1 — coleta noturna ativa |
| Brasil 5571 | 🔄 Sprint 2 — 218 coletados, worker circular ativo |
