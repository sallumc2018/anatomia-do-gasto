# Handoff URGENTE: Validação — o que falta agora
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Claude Sonnet — branch `claude/duckdb-qa` + `claude/pandera-schema`
**Prioridade:** Alta — sem validação automática, erros de fonte chegam ao site

---

## Estado atual (auditado em 2026-06-03)

**Temos:**
- `qa_extracted_sorocaba.py` (9.9K) — QA manual, carrega tudo em pandas
- `qa_lacunas_sorocaba.py` (26.1K) — faz coisas demais, risco de OOM com 8GB RAM
- Portão Opus manual: funciona mas é lento e depende de intervenção humana
- Divergência TCE×SICONFI 2022 documentada em DECISIONS.md

**Não temos:**
- Schema de validação por fonte (colunas renomeadas passam despercebidas)
- Hash de mudança de arquivo-fonte (portal muda CSV sem avisar)
- Queries rápidas de QA sem carregar tudo na memória
- Provenance público

---

## O que fazer

### FASE 1 — DuckDB (branch: `claude/duckdb-qa`)
```bash
uv add duckdb
```
Criar `tools/qa/duckdb_checks.py` com:
```python
import duckdb

def check_totais(municipio, ano, fonte_csv, valor_esperado_siconfi):
    """Compara soma do CSV com total SICONFI conhecido."""
    result = duckdb.sql(f"""
        SELECT SUM(valor) as total
        FROM read_csv_auto('{fonte_csv}')
    """).fetchone()[0]
    diff = abs(result - valor_esperado_siconfi)
    pct = diff / valor_esperado_siconfi * 100
    return {"ok": pct < 0.5, "diff_pct": pct, "diff_R$": diff}

def check_duplicatas(arquivo_csv):
    """Detecta linhas duplicadas."""
    return duckdb.sql(f"""
        SELECT COUNT(*) - COUNT(DISTINCT *) as duplicatas
        FROM read_csv_auto('{arquivo_csv}')
    """).fetchone()[0]

def check_nulos(arquivo_csv, colunas_obrigatorias):
    """Verifica campos obrigatórios vazios."""
    cols = ', '.join(f"SUM(CASE WHEN {c} IS NULL THEN 1 ELSE 0 END) as nulos_{c}"
                     for c in colunas_obrigatorias)
    return duckdb.sql(f"SELECT {cols} FROM read_csv_auto('{arquivo_csv}')").fetchdf()
```
Integrar ao portão de publicação (chamar antes de mover `extracted → public`).

### FASE 2 — Pandera schemas (branch: `claude/pandera-schema`)
```bash
uv add pandera
```
Criar `tools/qa/schemas/` com schema por fonte:

```python
# tools/qa/schemas/schema_siconfi.py
import pandera as pa

municipio_despesas = pa.DataFrameSchema({
    "cod_ibge":        pa.Column(str,   pa.Check.str_matches(r"^\d{7}$")),
    "exercicio":       pa.Column(int,   pa.Check.isin(range(2018, 2027))),
    "conta":           pa.Column(str,   nullable=False),
    "valor":           pa.Column(float, pa.Check.ge(0)),
})
```
Prioridade de schemas: SICONFI → TCE-SP → FNS → PNCP
Integrar em `tools/qa/validate_on_ingest.py` — chamado automaticamente na ingestão.

### FASE 3 — Hash de mudança de fonte (junto com `claude/linhagem-publica`)
Adicionar `registrar_hash()` em `pipelines/utils.py` (ver handoff coleta):
```python
import hashlib, json, os
from datetime import datetime, timezone

def registrar_hash(arquivo_path, url_fonte):
    sha256 = hashlib.sha256(open(arquivo_path,'rb').read()).hexdigest()
    hash_file = arquivo_path + '.hash.json'
    historico = json.load(open(hash_file)) if os.path.exists(hash_file) else {"historico":[]}
    ultimo = historico["historico"][-1]["sha256"] if historico["historico"] else None
    if ultimo == sha256:
        return False  # não mudou
    historico["historico"].append({
        "sha256": sha256, "url": url_fonte,
        "data": datetime.now(timezone.utc).isoformat()
    })
    json.dump(historico, open(hash_file,'w'), indent=2)
    return True  # mudou — logar alerta
```

---

## Fluxo de validação completo (target)
```
arquivo chega em data/raw/
  ↓ registrar_hash() — mudança detectada? logar
  ↓ Pandera — tipo/formato/range corretos?
  ↓ DuckDB — totais batem? duplicatas? nulos?
  ↓ Opus revisa relatório e aprova
  ↓ promover para data/extracted/ → data/public/
  ↓ gerar .provenance.json público
```

## Restrições
- DuckDB é complemento — não substituir pandas onde funciona
- Schemas Pandera são código versionado — commitar em `tools/qa/schemas/`
- Falha de schema: arquivo fica em `data/raw/` com flag `SCHEMA_FAILED`, não avança
- `qa_lacunas_sorocaba.py` existente: manter funcionando, refatorar depois
