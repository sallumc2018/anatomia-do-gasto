# Handoff: Adotar Pandera para validação de schema
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Claude Sonnet (sessão de QA/validação)
**Decisão:** aprovada por Alexandre NeoLogos em 2026-06-03
**Branch a criar:** `claude/pandera-schema` (ou agrupar com `claude/duckdb-qa`)

---

## Decisão

Adotar Pandera para validar schema dos dados na entrada do pipeline
(`raw → extracted`), antes de qualquer transformação.

---

## Por que Pandera

**Problema atual:** colunas renomeadas, tipos errados ou valores inesperados
de portais (SICONFI, TCE-SP, FNS) só são descobertos tarde — na revisão Opus
ou quando o site quebra.

**Com Pandera:** contrato de dados definido uma vez por fonte. Cada arquivo
validado na entrada. Erros têm localização exata (linha, coluna, valor).

**Diferença para DuckDB** (são camadas complementares):
- DuckDB → verifica o que já está lá (totais, duplicatas, divergências entre fontes)
- Pandera → verifica se o que chegou é o esperado (tipo, formato, range, obrigatoriedade)

---

## Schemas a criar (por fonte)

```python
import pandera as pa

# SICONFI RREO
schema_siconfi_rreo = pa.DataFrameSchema({
    "cod_ibge":         pa.Column(str,   pa.Check.str_matches(r"^\d{7}$")),
    "exercicio":        pa.Column(int,   pa.Check.isin(range(2019, 2028))),
    "periodo":          pa.Column(str),
    "conta":            pa.Column(str,   nullable=False),
    "valor":            pa.Column(float, pa.Check.ge(0)),
})

# TCE-SP granular
schema_tce_despesa = pa.DataFrameSchema({
    "municipio_id":     pa.Column(str,   pa.Check.str_matches(r"^\d{7}$")),
    "ano":              pa.Column(int,   pa.Check.isin(range(2019, 2028))),
    "valor_empenhado":  pa.Column(float, pa.Check.ge(0)),
    "valor_liquidado":  pa.Column(float, pa.Check.ge(0)),
    "valor_pago":       pa.Column(float, pa.Check.ge(0)),
    "fornecedor_cnpj":  pa.Column(str,   nullable=True),
})
```

---

## O que fazer na sessão

1. `git checkout main && git checkout -b claude/pandera-schema`
   (ou adicionar ao branch `claude/duckdb-qa` se fizer sentido agrupar)
2. `uv add pandera`
3. Criar `tools/qa/schemas/` com um arquivo por fonte:
   - `schema_siconfi.py`
   - `schema_tce.py`
   - `schema_fns.py`
   - `schema_pncp.py`
4. Criar `tools/qa/validate_on_ingest.py`:
   - Lê arquivo novo em `data/raw/`
   - Detecta fonte pelo path/nome
   - Aplica schema correspondente
   - Salva relatório em `data/raw/<municipio>/qa_log.json`
5. Integrar ao pipeline (chamar antes de mover para `data/extracted/`)
6. Quando schema falha: arquivo fica em `data/raw/` com flag `SCHEMA_FAILED`
   e não avança no pipeline sem revisão manual

---

## Relação com DuckDB

Ordem de execução no portão:

```
arquivo chega em data/raw/
  → Pandera valida schema (tipo, formato, range)    ← nova camada
  → DuckDB verifica integridade (totais, duplicatas) ← nova camada
  → Opus revisa e aprova
  → promove para data/extracted/ → data/public/
```

---

## Restrições
- `uv add pandera` — não pip standalone, não npm
- Schemas são código versionado — commitar em `tools/qa/schemas/`
- Falha de schema NÃO bloqueia coleta — bloqueia promoção
- Schemas evoluem quando fontes mudam: versionar com data no comentário
