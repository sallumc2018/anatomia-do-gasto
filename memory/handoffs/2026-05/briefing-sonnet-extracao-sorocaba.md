# Briefing — Sessão Sonnet: extração de Sorocaba (raw → extracted)

**Cole isto como mensagem de abertura de uma conversa nova em Sonnet.**

## Seu papel
Coleta e extração **mecânica**. Você escreve SÓ em `data/raw` e `data/extracted`.
**NUNCA** publica em `data/public`, **não** flipa status de dataset, **não** faz deploy.
Publicar é o portão de uma sessão Opus (validação contra a fonte). Ver `DECISIONS.md > Modelos — REGRA DO PORTÃO`.

## Consulte ANTES (não grepe o repo inteiro)
- `data/manifests/datasets.csv` — catálogo de datasets
- `data/manifests/fontes_execucao_sorocaba.csv` — URL oficial + script + arquivo bruto/extraído por dado
- `pipelines/paths.py` — caminhos canônicos
- `docs/arquitetura.md` (camadas + regra de publicação) e `docs/pipeline.md` (como rodar)

## Tarefas (todas PARAM em `data/extracted`)
1. **Urbes — contratos/licitações**: PDFs já estão em `data/raw` (transparência Urbes). Extrair via pdfplumber seguindo o padrão dos extratores existentes.
2. **Receita — registro analítico mensal**: baixar os PDFs do "Registro Analítico da Receita" no portal `fazenda.sorocaba.sp.gov.br/transparencia`; extrair por conta e mês (padrão similar ao `extrator_despesa_orcamentaria.py`).
3. **Contratos pré-2022 (2020–2021)**: inventariar links de contratos por ano no portal municipal; extrair objeto, fornecedor, valor, vigência.
4. **Câmara — contratos/licitações**: portal da Câmara (`camarasorocaba.sp.gov.br`); inventariar + extrair campos estruturados.
5. **Controle externo — texto integral dos alertas SDG**: extrair o texto dos PDFs dos comunicados SDG (TCE-SP) e expandir para anos anteriores a 2025.

Para cada dataset, registrar no manifesto (fonte, URL, arquivo bruto, script, data) conforme `docs/arquitetura.md > Auditoria`.

## Regras inegociáveis
- ❌ `npm install/update/audit fix` — PROIBIDO (worm ativo, mai/2026).
- ❌ Não escrever em `data/public`; não flipar status; não commitar deploy.
- ⚠️ OOM após downloads grandes — reinicie antes de pipeline pesado; evite baixar PDFs gigantes (1,4 GB+) sem necessidade.
- ⚠️ PNCP `/api/consulta/v1/` = 403 → usar `/api/search/?q=CNPJ&status=todos&tam_pagina=500` via Playwright.
- ⚠️ Working tree COMPARTILHADO com sessões de Paulínia — fique em arquivos de Sorocaba; se precisar isolar, use `git worktree`.
- ✅ Commit com prefixo `[Claude]` (hook `commit-msg` rejeita sem; ative `git config core.hooksPath .githooks`).
- ✅ Validar localmente (`pipelines/testes/`), mas deixar a PUBLICAÇÃO para a sessão Opus.

## Entregar
Para cada dataset extraído: caminho em `data/extracted` + nota curta (fonte, nº de registros, anos cobertos, pendências) num handoff em `memory/handoffs/2026-05/` endereçado à sessão Opus, para validar e publicar.
