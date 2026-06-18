# Handoff Master: Melhorias de Pipeline e Infraestrutura de Dados
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Claude Sonnet (sessões dedicadas por item)
**Todas as decisões aprovadas por:** Alexandre Sallum em 2026-06-03
**Base:** análise real dos repos okfn-brasil/querido-diario e turicas/rows via GitHub MCP
         + leitura dos 26 scripts em pipelines/ + 8 scripts em tools/data/

---

## Estado atual (confirmado em 2026-06-03)

- **26 scripts** em `pipelines/`: 21 usam requests/urllib, 5 usam Playwright
- **64 linhas** de `import requests` ou `import urllib` no projeto
- **Apenas 2 scripts** têm qualquer retry: `baixar_cepa_emendas.py` e
  `baixar_pncp_sorocaba.py`. O resto falha silenciosamente ou usa `time.sleep(0.5)`.
- **Nenhum schema de validação** existe em nenhum script
- **Scripts de QA** existem: `qa_extracted_sorocaba.py` (9.9K) e
  `qa_lacunas_sorocaba.py` (26.1K) — candidatos a serem complementados por DuckDB

---

## Melhorias aprovadas — por ordem de execução

### FASE 1 — Sem refatoração (adicionar ao código atual)

#### 1. `tenacity` — retry automático
**Branch:** `claude/tenacity-retry`
**Validação:** 64 imports de requests, 24 scripts SEM retry. FNS tem só `sleep(0.5)`.
             Portais instáveis (FNS, transferências federais) falham e param o pipeline.
**O que fazer:**
```bash
uv add tenacity
```
Adicionar decorator em cada script que faz requisições HTTP:
```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import requests

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=60),
    retry=retry_if_exception_type((requests.Timeout, requests.ConnectionError))
)
def fetch(url, **kwargs):
    return requests.get(url, timeout=30, **kwargs)
```
Prioridade de scripts: `baixar_fns_repasses.py`, `baixar_transferencias_federais.py`,
`baixar_transferegov_sorocaba.py`, `baixar_rreo_sus.py`.
Não aplicar nos 5 scripts Playwright — eles têm retry próprio.

---

#### 2. `requests-cache` — cache de requisições em desenvolvimento
**Branch:** juntar ao `claude/tenacity-retry`
**Validação:** durante debug e desenvolvimento, os scripts batem no mesmo portal
             dezenas de vezes. Com cache, a segunda chamada retorna em <1ms do disco.
**O que fazer:**
```bash
uv add requests-cache
```
Adicionar no topo de cada script, ativado por variável de ambiente:
```python
import os, requests_cache
if os.getenv("ANATOMIA_DEV_CACHE"):
    requests_cache.install_cache("data/raw/.dev_cache", expire_after=3600)
```
Em produção (coleta real): não setar a variável. Em dev: `ANATOMIA_DEV_CACHE=1 py script.py`.
**Não commitar** os arquivos `.dev_cache` — adicionar ao `.gitignore`.

---

### FASE 2 — Novas camadas de QA (não toca nos scripts existentes)

#### 3. `DuckDB` — SQL sobre CSVs para validação de totais
**Branch:** `claude/duckdb-qa`
**Validação:** `qa_extracted_sorocaba.py` (9.9K) e `qa_lacunas_sorocaba.py` (26.1K)
             existem mas carregam tudo em memória via pandas. Com 8GB RAM e 377k
             registros em Paulínia, isso é risco real de OOM. DuckDB faz streaming.
**Handoff detalhado:** `2026-06-03-claude-para-claude-duckdb-qa.md`
**O que fazer:**
```bash
uv add duckdb
```
Criar `tools/qa/duckdb_checks.py` com funções: `check_totals()`, `check_duplicates()`,
`check_nulls()`, `check_range()`. Integrar ao portão Opus (antes de flipar
`extracted → public`). NÃO substituir pandas onde já funciona — é complemento.

---

#### 4. `Pandera` — validação de schema na entrada
**Branch:** `claude/pandera-schema` (ou agrupar com `claude/duckdb-qa`)
**Validação:** nenhum script valida schema. Quando o SICONFI renomeia uma coluna
             ou o TCE muda o formato, o erro aparece só no portão Opus ou no site.
             Pandera captura na entrada (`raw → extracted`).
**Handoff detalhado:** `2026-06-03-claude-para-claude-pandera-schema.md`
**O que fazer:**
```bash
uv add pandera
```
Criar `tools/qa/schemas/` com um arquivo por fonte (SICONFI, TCE-SP, FNS, PNCP).
Criar `tools/qa/validate_on_ingest.py` que detecta a fonte pelo path e aplica
o schema. Arquivo que falha validação fica em `data/raw/` com flag `SCHEMA_FAILED`.

**Ordem de execução das duas camadas:**
```
arquivo → Pandera (tipo/formato/range) → DuckDB (totais/duplicatas) → Opus revisa → public
```

---

### FASE 3 — Refatoração de pipeline (maior esforço, maior ganho)

#### 5. Scrapy + rows — substituir os 21 scripts de coleta
**Branch:** `claude/pipeline-scrapy-migration`
**Validação:** confirmado lendo o código real de okfn-brasil/querido-diario.
             `pipelines.py` tem deduplicação por checksum, coleta incremental por
             `start_date`, organização automática de arquivos e monitoramento de portais.
             `turicas/rows` tem `plugin_pdf.py` (36KB) mais sofisticado que pdfplumber direto,
             com mesma API para todos os formatos (PDF/XLSX/CSV/HTML).
**Handoff detalhado:** `2026-06-03-claude-para-claude-pipeline-scrapy.md`

**Scripts a migrar (21 — requests/urllib):**
baixar_cepa_emendas, baixar_despesas_gabinete_camara, baixar_fns_repasses,
baixar_fontes_execucao, baixar_funserv, baixar_pdfs, baixar_pdfs_educacao,
baixar_pncp_sorocaba, baixar_rreo_sus, baixar_saae_dados_abertos,
baixar_sorocaba_prefeitura, baixar_tce_sorocaba, baixar_transferegov_sorocaba,
baixar_transferencias_estaduais_sp, baixar_transferencias_federais,
baixar_urbes_transparencia, extrair_alertas_sdg_tce, extrair_contratos,
extrair_despesas_gabinete_camara, extrair_despesa_orcamentaria_fatiada,
extrair_urbes_contratos_pdf_ocr.

**Scripts que NÃO migrar (5 — Playwright, manter como estão):**
baixar_camara_playwright, baixar_contratos_legados_playwright,
baixar_pncp_playwright, baixar_saae_playwright, baixar_urbes_playwright.

**O que fazer:**
```bash
uv add scrapy rows
```
1. Criar `tools/pipeline/` com estrutura Scrapy (spiders/, pipelines.py, settings.py)
2. Começar por `baixar_tce_sorocaba.py` → spider mais simples e mais testado
3. Validar que output bate com dados já existentes em `data/raw/`
4. Migrar scripts restantes um a um
5. Só commitar cada spider após validação local

---

## O que foi descartado e por quê

| Sugestão | Descartada | Motivo |
|---|---|---|
| `httpx + asyncio` | ✅ | Scrapy já resolve paralelismo nativamente. Adicionar async aos scripts atuais sem Scrapy seria complexo sem ganho claro. |
| `Prefect/Airflow` | ✅ | Overkill para escala atual. Reavaliar com >5 municípios ativos. |
| `dbt` | ✅ | Overkill agora. Reavaliar com >3 municípios em `data/public`. |
| `Frictionless Data` | ✅ | Pandera já cobre validação de schema. Frictionless adiciona documentação, não validação. Baixo ROI agora. |
| `DVC` | ✅ | Versionamento de dados pesados no G:. Complexidade alta, benefício difuso. Reavaliar quando portal mudar arquivo silenciosamente pela segunda vez. |

---

## Dependências entre fases

```
FASE 1 (tenacity + requests-cache)
  → independente, pode fazer agora
  → beneficia imediatamente os 21 scripts

FASE 2 (DuckDB + Pandera)
  → independente da fase 1
  → pode ser paralela ou sequencial

FASE 3 (Scrapy)
  → fazer DEPOIS da fase 1
  → os spiders Scrapy herdam os benefícios de tenacity nativamente
  → validar com DuckDB + Pandera os primeiros spiders antes de migrar todos
```

---

## Restrições globais

- `uv add <pacote>` — NUNCA `npm install`, NUNCA `pip install` sem uv
- Portão Opus obrigatório antes de qualquer promoção para `data/public`
- Scripts Playwright: intocáveis durante esta migração
- Commits prefixados `[Claude]`, um branch por fase
- Merge para main apenas com aprovação explícita do usuário
