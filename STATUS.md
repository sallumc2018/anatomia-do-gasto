# STATUS — Anatomia do Gasto
> **Regra:** ao atingir 40 linhas, migrar em batch p/ STATUS_HISTORICO.md; manter as 20 ativas + esta linha.
## Ativo — 2026-06-25
- P0 Coleta Sprint 2 ✅ `bd5a6e7`: gate integridade + cron `run_cmd` + Telegram hardening
- P1 Contratos/testes ✅ `0240664`: testes/cron Sprint 1 restaurado + API downloads allowlist
- P1 Frontend ✅ `fbf0b2a`: canonicals, títulos duplos, Recharts, gramática PT-BR
- P2 Confiabilidade 🔄 Codex+Claude: allowlist API ✅; Ruff keys + hotspot refactor pendentes
- Sorocaba 26/37 sem-LAI (70%); Urbes publicado_parcial
- Paulínia site ⬜ página `/paulinia` (~22 sub-rotas); nota metodológica 2022 obrigatória
- Paulínia CNPJ-PNCP ⬜ candidato 46.392.130/0001-18 INVÁLIDO; obter via Playwright
## Blockers
- `npm install/update/audit fix` — PROIBIDO (worm mai/2026)
- `vercel deploy --prod --yes` (integração GitHub cancela deploys)
- PNCP `/api/consulta/v1/` → 403; workaround Playwright `/api/search/`
- `baixar_tce_sorocaba.py` contas anuais: coleta página ESTADUAL (BUG; sem impacto público)
## Municípios
| Município | Status |
|---|---|
| Sorocaba | ✅ publicado |
| Paulínia | 🔄 dados extraídos; prefeitura/câmara/PNCP pendentes |
