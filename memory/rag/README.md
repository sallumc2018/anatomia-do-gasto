# Local RAG Index

The public RAG index is generated locally from `memory/registry.csv`.

Generated files are not committed:

```text
.local/rag/anatomia_public.sqlite
```

## Build

```powershell
python tools/memory/audit-memory-scope.py
python tools/memory/build-rag-index.py --check
python tools/memory/build-rag-index.py
```

## Query

```powershell
python tools/memory/query-rag.py --agent orquestrador --query "fluxo para completar dados faltantes" --limit 5
```

Default search is hybrid:

- SQLite FTS5 for lexical precision.
- Local TF-IDF vectors with cosine scoring for vector retrieval.
- Authority-aware reranking that favors `canonical` sources.

To force lexical fallback only:

```powershell
python tools/memory/query-rag.py --agent orquestrador --query "fluxo de dados" --mode fts
```

## Rule

The index is a retrieval aid. It does not replace direct file reads before code,
data, publication, deployment, or infrastructure changes.
