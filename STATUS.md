# STATUS — Anatomia do Gasto
> Fonte única de verdade. Lido por Claude, Codex, Gemini e qualquer IDE.
> Atualizar a cada sessão. Data: 2026-05-30

## Sprint ativo
Fechar cobertura do site Sorocaba + estrutura nacional de navegação.

## ✅ Concluído (mai/2026)
- `/fluxo-financeiro` — Sankey do rastro do dinheiro público (RREO 2024), com seletor de município
- `/sorocaba/transferencias` — page existe e está funcional (task.md estava desatualizado)
- `/sorocaba/controle-externo` — funcional
- `shell-header`: "Fluxo Financeiro" adicionado ao menu Mais
- Sitemap: `/fluxo-financeiro` incluído (prioridade 0.85)
- Commits pushados ao GitHub + deploys Vercel via CLI

## 🔄 Em andamento
- `camara-municipal/page.tsx` — outro chat varrendo dados inválidos no site inteiro
- Pipeline decoupling: duto de Sorocaba → repo `crawlers-ong` (em progresso)
- GitHub Actions para coleta diária PNCP (em progresso)

## ⬜ Pendente
- Build/lint local sem erros (validar após mudanças de hoje)
- READMEs: 14 arquivos em 3 repos, ~5 desatualizados
- `/sorocaba/transferencias`: link no header (shell-header `MAIS_NAV`)
- Cloudflare R2: CDN de dados para o Vercel
- Hierarquia nacional no `/mapa-interativo` — só quando Paulínia estiver no ar
- Théo v2: humanização do guia de aprendizado

## 🚫 Blockers conhecidos
- `npm install/update/audit fix` — PROIBIDO (worm ativo no GitHub, mai/2026)
- Vercel: usar `vercel deploy --prod --yes` (integração GitHub cancela deploys)
- PNCP `/api/consulta/v1/` — 403; workaround: `/api/search/?q=CNPJ&status=todos&tam_pagina=500` via Playwright
- OOM após downloads grandes: reiniciar antes de pipeline pesado
- PowerShell heredoc: `@'...'@` com `'@` em coluna 0

## Municípios
| Município | Estado | Status |
|---|---|---|
| Sorocaba | SP | ✅ publicado |
| Paulínia | SP | 🔄 em coleta |
