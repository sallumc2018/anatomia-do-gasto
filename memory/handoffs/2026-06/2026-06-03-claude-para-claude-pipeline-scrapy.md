# Handoff: Migração de pipeline para Scrapy + rows
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Claude Sonnet + Codex (sessão dedicada de pipeline)
**Decisão:** aprovada por Alexandre Sallum em 2026-06-03
**Branch a criar:** `claude/pipeline-scrapy-migration`

---

## Decisão arquitetural

Substituir os 17 scripts de coleta ad-hoc por arquitetura Scrapy + rows, baseada
no padrão do Querido Diário (okfn-brasil/querido-diario).

**Por que é melhor que o atual:**
- Deduplicação automática por checksum — não baixa o que já existe
- Coleta incremental por data (`start_date` por spider) — só o que falta
- Organização automática: `municipio_id/ano/arquivo.ext`
- Detecção automática de extensão (PDF, XLSX, etc.)
- Pipeline em camadas: filtragem → metadados → download → registro
- `rows` como camada de leitura uniforme (mesma API para PDF/XLSX/CSV/HTML)
- Monitor de portais incluso — alerta quando URL muda ou retorna erro

**O que NÃO muda:**
- Portão Opus antes de publicar (DECISIONS.md)
- Estrutura `data/raw → data/extracted → data/public`
- `datasets.csv` como manifesto
- Playwright para portais com WAF (PNCP, etc.)

---

## Referência: padrão do Querido Diário (lido em 2026-06-03)

Repositório: `okfn-brasil/querido-diario`
Arquitetura confirmada via GitHub MCP:

```
data_collection/
  gazette/
    spiders/          ← um arquivo por município
    pipelines.py      ← GazetteDateFilteringPipeline + DefaultValuesPipeline
                         + QueridoDiarioFilesPipeline + SQLDatabasePipeline
    middlewares.py
    monitors.py
    settings.py
```

Pipeline chave do `pipelines.py` (já lido, não ler de novo):
- `GazetteDateFilteringPipeline` — descarta itens antes de `start_date`
- `DefaultValuesPipeline` — adiciona `territory_id`, `scraped_at`
- `QueridoDiarioFilesPipeline` — download com checksum, organiza por `territory_id/date/`
- `SQLDatabasePipeline` — persiste no banco, pula `uptodate` (já existente)

Biblioteca `turicas/rows` — plugin_pdf.py (36KB, mais sofisticado que pdfplumber direto).
Interface: `rows.import_from_pdf(arquivo)` — mesma API para todos os formatos.

---

## Scripts atuais a migrar (17 scripts em tools/data/)

Prioridade de migração (do mais simples ao mais complexo):

| Script | Município | Complexidade | Depende de |
|---|---|---|---|
| `baixar_tce_sorocaba.py` | Sorocaba | Baixa | requests + pandas |
| `baixar_tce_paulinia.py` | Paulínia | Baixa | mesmo padrão |
| Scripts SICONFI | Ambos | Baixa | API REST simples |
| Scripts FNS | Ambos | Média | API com paginação |
| Scripts PNCP | Ambos | Alta | Playwright (manter separado) |

**Regra:** scripts que usam Playwright NÃO migrar para Scrapy agora — manter como estão.

---

## O que fazer na sessão de migração

1. `git checkout main && git checkout -b claude/pipeline-scrapy-migration`
2. Instalar Scrapy via uv (não npm): `uv add scrapy rows`
3. Criar estrutura `tools/pipeline/` com:
   - `spiders/sorocaba.py` (primeiro)
   - `pipelines.py` (adaptado do QD, sem S3, com G: drive local)
   - `settings.py`
4. Testar spider do Sorocaba com `--dry-run` ou `HTTPCACHE_ENABLED=True`
5. Validar que arquivos resultantes batem com o que já existe em `data/raw/`
6. Só então migrar os demais scripts

## Restrições
- NÃO rodar `npm install` — worm ativo
- Usar `uv add scrapy rows` para dependências
- NÃO tocar em scripts Playwright durante esta migração
- Commit só após validação local dos dados gerados
- Portão Opus antes de qualquer promoção para `data/public`
