# Handoff Claude → Codex — CI PNCP diário (2026-05-30)

## Contexto

O workflow `.github/workflows/sorocaba-pipeline.yml` foi reescrito pelo Claude
(sessão 2026-05-30) para a versão mínima funcional: coleta diária do PNCP via
Playwright + commit do CSV de publicação. Está pronto no disco mas **não foi
commitado** — a razão está abaixo.

## Bloqueador: dependência da tua branch

O workflow chama `pipelines/gerar_pncp_publicacao.py` no passo 6. Esse script
precisa da versão que **tu implementaste** na tua branch
`codex/institutional-audit-data-catalog` — especificamente a função
`ler_fonte_playwright` e o loop de anos por tipo.

A versão da `main` hoje é a antiga (só lê os 3 arquivos legado, sem Playwright).
Se o workflow for commitado na `main` antes da tua branch ser mesclada, o passo
6 rodaria contra o script errado e descartaria silenciosamente tudo que o passo
5 baixou.

## O que o Claude deixou pronto (no disco, branch local do Codex)

1. `.github/workflows/sorocaba-pipeline.yml` — reescrito do zero.
   - Usa `baixar_pncp_playwright.py` (porta `/api/search/`, a que funciona).
   - Remove pipeline saúde/educação (precisa de PDFs locais, não funciona em CI).
   - Remove bifurcação R2 (não configurado). Usa GitOps simples.
   - Adiciona `permissions: contents: write`, `git pull --rebase`, trava de concorrência.

2. `pipelines/gerar_pncp_publicacao.py` — 1 linha alterada:
   - `anos = [2022, 2023, 2024, 2025]` → `anos = [2022, 2023, 2024, 2025, 2026]`
   - Sem isso o robô coletaria 2026 no passo 5 mas descartaria tudo no passo 6.
   - **Verificar se essa linha está na tua versão do script** — se já tiver 2026,
     descarta este item.

3. `.github/workflows/sync-docs.yml` — workflow novo de sincronização de docs.
   - Em push para main com mudança em datasets.csv / paths.py / data/public/**:
     regenera seções AUTO dos 5 READMEs e commita automaticamente.
   - Em PRs para main: valida (`--check`) e bloqueia merge se README estiver velho.
   - Cobre Claude + Codex + Gemini + humano — qualquer push dispara.
   - Não depende de nenhuma outra branch. Pode entrar na main independentemente.

## Ação solicitada ao Codex

Quando fores mesclar `codex/institutional-audit-data-catalog` na `main`:

1. Incluir os três arquivos acima no mesmo PR (ou em PRs separados por tema).
2. Confirmar que `gerar_pncp_publicacao.py` na `main` tem `2026` na lista de anos.
3. O `sync-docs.yml` pode entrar antes, independente do PNCP — não tem dependência.
4. Após a mescla do PNCP, disparar o workflow manualmente no GitHub (aba Actions →
   "Coleta diária PNCP (Sorocaba)" → Run workflow) para validar antes de confiar
   no agendamento diário.

## Validação já feita pelo Claude

- `gerar_pncp_publicacao.py` rodou local com a edição de 2026: 2.102 registros,
  resultado idêntico ao CSV publicado atual — nenhuma regressão.
- O CSV publicado atual está correto (dados de 2022–2025 intactos).
- O workflow **nunca foi ativado** (nunca chegou à main), portanto os erros da
  versão anterior não afetaram dado algum.
