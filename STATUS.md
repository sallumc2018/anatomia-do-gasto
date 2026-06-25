# STATUS — Anatomia do Gasto
> Fonte única de verdade. Lido por Claude, Codex e qualquer IDE.
> Atualizar a cada sessão. Data da última normalização documental: 2026-06-25.

## Governança documental — 2026-06-25

- `CANONICAL_PATHS.md` define onde cada artefato, camada de dados e handoff fica.
- `TASKS.md` substitui o antigo `tasks.txt` e contém a fila executável.
- `IDEAS.md` recebe propostas ainda não aprovadas.
- `DECISIONS.md` permanece como registro de decisões duráveis.
- `memory/handoffs/YYYY-MM/` permanece como caixa postal pública sanitizada.
- O estado operacional detalhado abaixo ainda precisa de reconciliação pelas
  sessões responsáveis antes de ser tratado como fotografia integral de 2026-06-25.

## Coleta e Publicação — 2026-06-25 (Claude Coleta e Publicação)

- **P0 gate integridade Sprint 2** (`bd5a6e7`): `publicar_municipios_brasil.py` valida
  schema por área, rejeita HTML/CSV vazio/sem linhas, copia atomicamente via temp+replace,
  gera manifesto SHA-256 em `data/manifests/sprint2/`, exit 1 em rejeições.
- **P0 falhas cron Sprint 2**: passos 7 e 8 convertidos para `run_cmd` — falhas entram
  em `FALHAS[]` e disparam alerta Telegram.
- **P0 Telegram hardening**: subshell isola segredos (sem exportar ao ambiente), umask 077
  cria arquivo com perm 600, trap garante remoção em qualquer sinal, log path removido da
  mensagem.
- **Passo 11 cron**: `gerar_cobertura_sprint2.py` (Codex) integrado à coleta noturna.
- Pendente (Codex): testes de contrato P1 para as 3 áreas federais.

## UI/UX — 2026-06-25 (Claude UI/UX)

- **Canonicals corrigidos**: `layout.tsx` criados em `/fluxo`, `/fluxo-financeiro`,
  `/mapa-interativo` (canonical) e `/sandbox` (noindex). Gate `check_canonical_routes.py` retorna OK.
- **Títulos duplicados eliminados**: 8 páginas tinham `title: "X — Anatomia do Gasto"` que
  combinava com o template do root layout (`"%s | Anatomia do Gasto"`) gerando duplicação.
  Corrigido em `atualizacoes/page.tsx`, `atualizacoes/[slug]/page.tsx`, `api/dados/page.tsx`,
  `auditoria/reportar/page.tsx`, `institucional/page.tsx`, `sobre/page.tsx`, `voluntarios/page.tsx`,
  `comparativo/page.tsx`.
- **Recharts -1**: verificado — todos os charts de produção (`components/charts/`) têm `minWidth={0}`
  e alturas fixas. Charts sorocaba experimentais já têm wrapper divs com altura explícita. Sem ação pendente.
- **Gramática PT-BR**: pipeline `tools/gates/check_grammar.py` criado e integrado ao pre-commit
  (Layer 1.5). ~50 strings corrigidas em 10 arquivos. Commit `48f0d6f`.
- **Mapa interativo sem cruzamentos**: SVG e coordenadas redesenhados (bandas y disjuntas). Commit `8d02ce3`.

## Sprint ativo
**Sorocaba + Paulínia em paralelo** (sessão 2026-06-09, Claude Sonnet 4.6). Score Sorocaba: **26/37 sem-LAI (70%)** — Urbes despesas mensais promovida de `coletado_pend_valid` → `publicado_parcial`. Paulínia: CNPJ confirmado válido (`45751435000106` = BrasilAPI ✓); `data/public/paulinia/` 89 CSVs já commitados. Bloqueio CNPJ resolvido: `baixar_pncp_playwright.py` já pode rodar para Paulínia. Próximo: LOA extrator, Câmara projetos de lei, SIOPS, novas fontes (DATASUS, INEP, SIGA Brasil).

## ✅ Concluído (jun/2026)
- **Urbes despesas mensais (2026-06-09, Claude)**: 21 PDFs coletados via Playwright Linux (2010-2026); 108 registros extraídos (2018-2026, 12 meses/ano); total validado contra linha-Total do PDF; `pipelines/extrair_urbes_despesas.py` criado; CSV em `data/public/sorocaba/transporte/urbes/saida/urbes_despesas_mensais_sorocaba.csv`; PDFs 2010-2017 escaneados (OCR pendente, fora do período 2020-2026); Dec/2024 ausente no portal
- **Paulínia CNPJ resolvido (2026-06-09, Claude)**: `45751435000106` confirmado válido via BrasilAPI; já está em `pipelines/paths.py`; STATUS.md anterior estava incorreto
- **Repo conectado ao GitHub (2026-06-09, Claude)**: `github.com/sallumc2018/anatomia-do-gasto` remoto configurado; `src/schema.py` + estrutura `src/` adicionados
- **Sorocaba SAAE publicado (2026-06-03, Claude)**: contratos(22) + licitações(77) 2026 em `data/public/sorocaba/autarquias/saae/saida/`; fix encoding latin-1→utf-8; 6 flips manifesto coletado/parcial→publicado_parcial
- **Sorocaba TCE pareceres inventário (2026-06-03, Claude)**: 20 links PDF oficiais (Prefeitura 2012-2023 + Câmara 2015-2022) em `data/public/sorocaba/controle_externo/tce/saida/`
- **Sorocaba não-LAI QA fechado (2026-06-02, Codex)**: 86 OK, 0 warn, 0 fail
- **Commits pendentes (2026-06-03, Claude)**: DECISIONS+TASKS commitados em `claude/governanca`; MCPs configurados (filesystem/GitHub/Windows)

## ✅ Concluído (mai/2026)
- `/fluxo-financeiro` — Sankey do rastro do dinheiro público (RREO 2024), com seletor de município
- `/sorocaba/transferencias` — page existe e está funcional (task.md estava desatualizado)
- `/sorocaba/controle-externo` — funcional
- `shell-header`: "Fluxo Financeiro" adicionado ao menu Mais
- Sitemap: `/fluxo-financeiro` incluído (prioridade 0.85)
- Commits pushados ao GitHub + deploys Vercel via CLI
- **Paulínia (2026-05-31)**: 17 pipelines parametrizados; 89 CSVs SICONFI+FNS+transf.fed.; manifesto atualizado
- **Paulínia coleta completa (2026-05-31)**: TCE-SP 364k despesas + 8k receitas (granular mensal 2020-2025); PNCP 3.895 contratos/atas/compras (2023-2026); sefaz_sp=5137; CNPJ=45751435000106 validado; `extrator_tce_transparencia.py` criado
- **Paulínia TCE-SP (2026-05-31, Opus)**: `baixar_tce_sorocaba.py` parametrizado p/ multi-município (env `MUNICIPIO`); coletado via API transparência TCE (slug `paulinia`): **144/144 consultas OK**, despesa 2020-2025 (364.803 reg.) + receita (8.202 reg.); 16 alertas LRF (15 prefeitura + 1 câmara, exerc. 2019); **318 PDFs de contas anuais inventariados 2002-2024** (inclui 2020 rejeitado). Saída em `data/extracted/paulinia/tce/` (raw 107 MB em G:). Não commitado (branch do Codex ativo).
- **Paulínia transferências estaduais SP (2026-05-31, Opus)**: `sefaz_sp` descoberto = **5137** (validado por Sorocaba=6695 na mesma lista do portal Fazenda-SP); gravado em `paths.py`. `baixar_transferencias_estaduais_sp.py` rodado: ICMS/IPVA/FEX/compensações 2020-2026 (85 linhas; ICMS 2024 = R$1,51 bi). Saída em `data/extracted/paulinia/transferencias_estaduais/saida/`. Não commitado.

## 🔄 Em andamento
- `camara-municipal/page.tsx` — outro chat varrendo dados inválidos no site inteiro
- Pipeline decoupling: duto de Sorocaba → repo `crawlers-ong` (em progresso)
- GitHub Actions para coleta diária PNCP (em progresso)
- **Paulínia**: ~~TCE-SP receita/despesa~~ ✅ feito (2026-05-31); falta prefeitura portal + câmara SMARAPD (Playwright)

## ⬜ Pendente
- Build/lint local sem erros (validar após mudanças de hoje)
- READMEs: 14 arquivos em 3 repos, ~5 desatualizados
- ~~`/sorocaba/transferencias`: link no header~~ ✅ já estava no `MAIS_NAV` (linha 48)
- Cloudflare R2: CDN de dados para o Vercel
- Hierarquia nacional no `/mapa-interativo` — só quando Paulínia estiver no ar
- Théo v2: humanização do guia de aprendizado

## ✅ QA Opus — Paulínia TCE×SICONFI COMPLETO (2026-06-01)
> **Cross-check de TODOS os anos concluído.** Despesa liquidada: **5 de 6 anos batem ao centavo**
> (2020/2023/2024/2025 = R$0,00 diff; 2021 = +R$950 arredondamento). **2022 diverge R$7,2M (~0,4%)**.
> Receitas: 6/6 na mesma ordem de grandeza (desvio <0,04%). Transf. estaduais: consistência interna OK.
> **Divergência 2022 investigada pelo Opus = REAL entre fontes, NÃO é bug** (0 duplicatas no TCE;
> Câmara idêntica nas 2 fontes; diferença no bloco Prefeitura+RPPS). CNPJ 45751435000106 confirmado.
> **DECISÃO (DECISIONS.md): SICONFI é o agregado oficial em todos os anos; TCE granular p/ drill-down;
> nota metodológica obrigatória no total de 2022.** Dados aprovados para promoção.
> QA em `data/extracted/paulinia/tce/qa_crosscheck_tce_siconfi.csv`.
> Nota técnica menor: `extrator_tce_transparencia.py` duplica colunas `ano`/`mes_num` (cosmético).

### ✅ Paulínia PROMOVIDA a data/public (Opus, 2026-06-01)
**89 CSVs em `data/public/paulinia/`** (gate de integridade: 89/89 sha256 conferem com qa.csv).
- receita 6 · executivo 6 · fiscal 42 · seguranca 6 · transporte 12 · transf_federais 5 · transf_estaduais 6 · fns 6.
- `data/manifests/paulinia/qa.csv` (89 validated, `validado_por=opus-crosscheck-tce-siconfi`).
- 15 linhas de Paulínia mescladas em `data/manifests/datasets.csv` (Origem_Dir=public).
- `pipelines/publicar_dados.py`: `AREAS_EXTRACTED` estendido p/ receita/executivo/fiscal/transf_federais/transf_estaduais/fns.
- Conferência pós-promoção: despesa liquidada 2024 no public = R$ 2.586.407.247,87 (= QA). ✅
- **Fora do public (por política):** PNCP + TCE granular (com cautela/curadoria); inventários/alertas/contas anuais/amostras (insumo); transf_estaduais 2026 + fns 2026 (anos parciais).

### ⬜ Pendente Paulínia (camada SITE — execução Sonnet, revisão Opus)
- Página `/paulinia` (reusar Sorocaba — ~22 sub-rotas; lê de `data/public/paulinia`). Inclui **nota metodológica de 2022** no total (ver DECISIONS).
- Adaptar/parametrizar `gerar_datasets_json.py` (hoje hardcoded sorocaba) p/ gerar status de Paulínia quando a página existir.
- Hierarquia nacional no `/mapa-interativo` (2 municípios) + avaliar URLs `/uf/municipio` (ver DECISIONS).
- Texto editorial contas 2020 rejeitadas (Plínio).
- **Não commitado ainda:** manifestos, publicar_dados.py, data/public/paulinia. Commit coeso pendente (prefixo `[Claude]`).

## 📊 Paulínia — cross-validação SICONFI (2026-05-31)
> Dados íntegros. Números internamente consistentes entre extratores. Destaques editoriais:
- **⚠️ CORRIGIDO (Opus 2026-06-01):** a tese "pessoal 2020 = 59,5%, acima do teto LRF 54%" é **FALSA** (era Pessoal_Bruto/RCL, não o índice legal). **DTP/RCL real 2020 = 48,13%, dentro do teto.** Série DTP nunca estourou: 48,1→43,7→39,1→41,7→38,2→40,3 (2020-2025). Motivo da rejeição das contas 2020 NÃO está nos dados — exige ler o parecer (PDF inventariado). NÃO publicar acusação de pessoal.
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
- **BUG `baixar_tce_sorocaba.py` contas anuais (genérico, achado 2026-06-01):** a coleta de "contas anuais" (linha 142, `{TCE_HOST}/contas-anuais`) aponta para página ESTADUAL fixa (Contas do Governador), sem filtro por município. `inventario_pdfs_contas_anuais.csv` de Sorocaba E Paulínia = 318 PDFs estaduais (0 menções ao município, 333 a "Governador"). **Inútil para análise municipal nos 2 municípios.** Não publicado em lugar nenhum (CSV interno em extracted) → sem impacto público. Corrigir: mirar contas municipais por ente (pesquisa processual por município/exercício). Pendência em ambos.
- ~~Paulínia `sefaz_sp`~~ ✅ = 5137 (2026-05-31); transferências estaduais coletadas
- Paulínia `cnpj_prefeitura`: ainda None em paths.py — necessário para PNCP. ⚠️ candidato 46.392.130/0001-18 é INVÁLIDO (BrasilAPI 404); obter via Playwright. Atenção: `baixar_pncp_playwright.py` tem CNPJ hardcoded (linha 49) — parametrizar p/ `CFG["cnpj_prefeitura"]` antes de rodar

## Municípios
| Município | Estado | Status |
|---|---|---|
| Sorocaba | SP | ✅ publicado |
| Paulínia | SP | 🔄 SICONFI+FNS+transf.fed.+TCE-SP+transf.estaduais SP extraídos — prefeitura/câmara/CNPJ-PNCP pendentes (Playwright) |
