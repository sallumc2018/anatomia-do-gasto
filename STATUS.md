# STATUS — Anatomia do Gasto
> Fonte única de verdade. Lido por Claude, Codex, Gemini e qualquer IDE.
> Atualizar a cada sessão. Data: 2026-05-31

## Sprint ativo
Paulínia: coleta SICONFI concluída (81 CSVs). Próximo: TCE-SP + prefeitura + câmara.

## ✅ Concluído (mai/2026)
- `/fluxo-financeiro` — Sankey do rastro do dinheiro público (RREO 2024), com seletor de município
- `/sorocaba/transferencias` — page existe e está funcional (task.md estava desatualizado)
- `/sorocaba/controle-externo` — funcional
- `shell-header`: "Fluxo Financeiro" adicionado ao menu Mais
- Sitemap: `/fluxo-financeiro` incluído (prioridade 0.85)
- Commits pushados ao GitHub + deploys Vercel via CLI
- **Paulínia (2026-05-31)**: 17 pipelines parametrizados para multi-município; 89 CSVs extraídos (SICONFI + FNS + transferências federais), período 2020-2025; `paulinia_100_auditavel.csv` atualizado com status real de cada fonte

## 🔄 Em andamento
- `camara-municipal/page.tsx` — outro chat varrendo dados inválidos no site inteiro
- Pipeline decoupling: duto de Sorocaba → repo `crawlers-ong` (em progresso)
- GitHub Actions para coleta diária PNCP (em progresso)
- **Paulínia**: TCE-SP receita/despesa + prefeitura portal + câmara SMARAPD (próxima sessão, Opus)

## ⬜ Pendente
- Build/lint local sem erros (validar após mudanças de hoje)
- READMEs: 14 arquivos em 3 repos, ~5 desatualizados
- ~~`/sorocaba/transferencias`: link no header~~ ✅ já estava no `MAIS_NAV` (linha 48)
- Cloudflare R2: CDN de dados para o Vercel
- Hierarquia nacional no `/mapa-interativo` — só quando Paulínia estiver no ar
- Théo v2: humanização do guia de aprendizado

## 📊 Paulínia — cross-validação SICONFI (2026-05-31)
> Dados íntegros. Números internamente consistentes entre extratores. Destaques editoriais:
- **Pessoal 2020: 59.5% da RCL** — acima do limite LRF (54%). Provável causa da rejeição de contas pelo TCE-SP
- Pessoal voltou a subir: 50.1% (2024), 52.3% (2025) — tendência preocupante
- Receita cresceu 110% em 5 anos: R$1.4B (2020) → R$3.0B (2025) — REPLAN/Petrobras
- Dívida baixa e declinante: 25% (2020) → 8% (2024) — problema não é dívida, é gasto corrente
- RPPS superávit consistente em todos os anos
- Transferências federais 2020 ausentes na API — verificar se gap real ou indisponível
- `gerar_qa_manifest.py` opera sobre `data/public/` — só rodar após promover para public

## 🚫 Blockers conhecidos
- `npm install/update/audit fix` — PROIBIDO (worm ativo no GitHub, mai/2026)
- Vercel: usar `vercel deploy --prod --yes` (integração GitHub cancela deploys)
- PNCP `/api/consulta/v1/` — 403; workaround: `/api/search/?q=CNPJ&status=todos&tam_pagina=500` via Playwright
- OOM após downloads grandes: reiniciar antes de pipeline pesado
- PowerShell heredoc: `@'...'@` com `'@` em coluna 0
- Paulínia `sefaz_sp` (código Sefaz-SP): ainda None em paths.py — descobrir no portal fazenda.sp.gov.br antes de rodar baixar_transferencias_estaduais_sp.py
- Paulínia `cnpj_prefeitura`: ainda None em paths.py — necessário para PNCP

## Municípios
| Município | Estado | Status |
|---|---|---|
| Sorocaba | SP | ✅ publicado |
| Paulínia | SP | 🔄 89 CSVs extraídos (SICONFI+FNS+transf.fed.) — TCE/prefeitura/câmara/sefaz_sp/CNPJ pendentes |
