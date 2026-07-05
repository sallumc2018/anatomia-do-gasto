# STATUS — Anatomia do Gasto
> **Regra:** ao atingir 40 linhas, migrar em batch p/ STATUS_HISTORICO.md; manter as 20 ativas + esta linha.
## Ativo — 2026-07-05
- Sprint 2 🔄 cursor 218/5571 (3,9%); cron 02:05 BRT × 3h; ~300 mun/noite; cobertura ~18 noites
- Deploy ✅ cron 05:10 BRT; `--archive=tgz` corrige free tier >5000 arquivos; último build 114 páginas
- Sprint 1 transferências ✅ `e3acdfb5`: fase_transferencias_federais usa rodar_warn() (403 não bloqueia)
- TCE contas anuais ✅ bug confirmado resolvido: IBGE filter OK (Sorocaba=10, Paulínia=10, Gov=0)
- Sorocaba score 80.2% (calc_score.py 2026-07-05)
- Paulínia 🔄 dados extraídos; prefeitura/câmara/PNCP pendentes
- P2 Confiabilidade 🔄 Ruff keys + hotspot refactor pendentes
## Blockers
- `npm install/update/audit fix` — PROIBIDO (worm mai/2026)
- Portal Transparência 403: chave sem permissão `/transferencias`. Requer re-cadastro com escopo "Transferências"
- PNCP `/api/consulta/v1/` → 403; workaround Playwright `/api/search/`
- CPF em git history: sanitizar com BFG Repo Cleaner (requer confirmação do usuário)
## Municípios
| Município | Status |
|---|---|
| Sorocaba | ✅ publicado (80.2% cobertura) |
| Paulínia | 🔄 dados extraídos; prefeitura/câmara/PNCP pendentes |
| SP + 18 municípios SP | 🔄 Sprint 1 — coleta noturna ativa |
| Brasil 5571 | 🔄 Sprint 2 — 218 coletados, worker circular ativo |
