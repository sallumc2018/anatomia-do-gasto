# Handoff: Adotar DuckDB para QA de dados
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Claude Sonnet (sessão de QA/validação)
**Decisão:** aprovada por Alexandre NeoLogos em 2026-06-03
**Branch a criar:** `claude/duckdb-qa`

---

## Decisão

Substituir scripts de QA ad-hoc em pandas por DuckDB para validação de dados
antes do portão Opus (`data/extracted → data/public`).

---

## Por que DuckDB

**Problema atual:** pandas carrega CSVs inteiros na memória. Com 8GB RAM e
120+ CSVs (~377k registros em Paulínia), scripts de QA travam ou ficam lentos.
Cada verificação exige script customizado.

**Com DuckDB:**
- SQL direto em CSV/Parquet/JSON sem importação, sem banco, sem memória extra
- Streaming — consulta arquivos de qualquer tamanho sem carregar tudo
- ~100ms por query
- Integrado com pandas (`duckdb.query(...).df()`)
- Sem servidor, sem instalação de banco

---

## Exemplos de uso direto no projeto

```python
import duckdb

# Conferir total de despesa por ano (cruza múltiplos CSVs)
duckdb.sql("""
    SELECT ano, SUM(valor_liquidado) as total
    FROM 'data/raw/paulinia/despesa/**/*.csv'
    GROUP BY ano ORDER BY ano
""").show()

# Verificar divergência TCE vs SICONFI (o problema dos R$7,2M de 2022)
duckdb.sql("""
    SELECT fonte, ano, SUM(valor) as total
    FROM read_csv_auto(['data/raw/paulinia/tce_2022.csv',
                        'data/raw/paulinia/siconfi_2022.csv'],
                       filename=true)
    GROUP BY fonte, ano
""").show()

# Detectar duplicatas antes de publicar
duckdb.sql("""
    SELECT id_empenho, COUNT(*) as ocorrencias
    FROM 'data/extracted/paulinia/empenhos_2022.csv'
    GROUP BY id_empenho HAVING COUNT(*) > 1
""").show()
```

---

## O que fazer na sessão

1. `git checkout main && git checkout -b claude/duckdb-qa`
2. `uv add duckdb` (não npm)
3. Criar `tools/qa/duckdb_checks.py` com funções padrão:
   - `check_totals(municipio, ano)` — soma por fonte e compara
   - `check_duplicates(arquivo)` — detecta linhas duplicadas
   - `check_nulls(arquivo, colunas_obrigatorias)` — verifica campos vazios
   - `check_range(arquivo, coluna, min, max)` — valores fora do esperado
4. Integrar ao portão Opus: antes de flipar status `extracted → public`,
   rodar `duckdb_checks.py` e exibir resultado para aprovação
5. Documentar em `docs/qa-pipeline.md`

---

## Restrições
- `uv add duckdb` — não pip, não npm
- NÃO substituir pandas onde já funciona — DuckDB é complemento para queries e QA
- Resultados de QA vão para `memory/token-economy/` como economia auditável
- Portão Opus continua obrigatório — DuckDB agiliza, não substitui a revisão humana
