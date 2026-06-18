# Handoff — /playwright → /pipeline
# Tarefa: Contratos, Licitações 2020-2021 + Obras Públicas de Sorocaba

**Data:** 2026-05-22
**Status:** Concluído (índice JSON salvo; PDFs não baixados ainda)

---

## Feito

### 1. Obras Municipais
- **Portal:** `https://apps.sorocaba.sp.gov.br/das/obras/`
- **API:** `GET /das/obras/geojson/` → JSON direto (sem JS, sem 403)
- **Descoberta:** 352 features GeoJSON = 69 obras únicas (multi-geometria por obra)
- **Anos dos contratos:** 2022-2025 (os CPLs têm anos 2020-2022 em vários casos)
- **Para filtrar obras por CPL 2020-2021:** usar campo `cpl` com `xxx/2021` ou `xxx/2020`

### 2. Licitações / Contratos 2020-2021
- **Portal:** `https://api.sorocaba.sp.gov.br/pub-consulta/`
- **API:** `GET /pub-consulta/api/publicacao?page={N}` → 10 itens/página, 718 páginas, 7180 total
- **Registros de 2020-2021 concentrados nas páginas 450-718**
- **Scan realizado:** páginas 450-718 completo + amostra 1-449 (zero registros de 2020-2021)
- **PDFs de cada licitação:** `GET /api/publicacao/{id}/anexo/{anexo_id}` → PDF direto

**Descoberta crítica:** O `fazenda.sorocaba.sp.gov.br/transparencia` **NÃO tem seção de Contratos/Licitações** — é portal de documentos fiscais da SEFAZ (LRF, RREO, DCA, etc.) com 27 categorias. O sistema correto é o `pub-consulta`.

---

## Saída

```
data/raw/sorocaba/contratos/
├── obras/
│   ├── obras_sorocaba.geojson         (386 KB, 352 features, 69 obra_ids)
│   └── obras_sorocaba_detalhes.json   (337 KB, 352 registros com empresa, CNPJ, valor)
└── legados/
    └── 2020-2021/
        └── indice_licitacoes.json     (842 KB, 1000 registros)
```

---

## Validação

### Obras
- 352 features GeoJSON (multi-geometria), 69 obra_ids únicos
- 351/352 com `empresa_contratada`, 260/352 com `valor_contrato`
- Campos extras extraídos do HTML: `empresa_contratada`, `cnpj`, `percentual_concluido`, `valor_contrato`, `endereco`, `descricao`, `quantidade`, `status`

### Licitações
- **1000 registros** | 401 de 2020 | 599 de 2021
- Distribuição por modalidade:
  - Pregão Eletrônico: 540
  - Compra Eletrônica: 209
  - Dispensa de Licitação: 118
  - Inexigibilidade: 55
  - Concorrência: 33
- IDs válidos para download de PDF (ex: id=5932, 5854, 5959, 5249, 5594)
- Processos exemplo: `000591/2020`, `000256/2021`
- Cada licitação tem lista de anexos via `GET /api/publicacao/{id}/anexo`
- PDFs acessíveis via `GET /api/publicacao/{id}/anexo/{anexo_id}` (requer browser Playwright)

---

## Bloqueios / Limitações

1. **pub-consulta API via JS fetch**: sempre retorna 10 itens/página independente de `itens_per_page`; requer browser Playwright para manter sessão TLS
2. **pub-consulta API sem filtro de ano**: a API ignora parâmetros `ano`, `anoPublicacao`, etc. no servidor. Filtragem feita localmente pelo campo `anoPublicacao`
3. **PDFs não baixados**: 1000 licitações × múltiplos PDFs (editais, contratos, atas, etc.) = potencialmente gigabytes. Usar `--baixar --limite-mb 5` seletivamente
4. **fazenda.sorocaba SEFAZ**: portal correto para documentos fiscais, mas NÃO para contratos de licitação. Seções 01-27 são todos documentos da Secretaria de Fazenda

---

## Como usar o script para download de PDFs

```bash
# Listar obras (sem baixar)
python pipelines\baixar_contratos_legados_playwright.py --fonte obras --apenas-listar

# Baixar obras (GeoJSON + detalhes HTML)
python pipelines\baixar_contratos_legados_playwright.py --fonte obras

# Baixar PDFs de licitações (limite de 5 MB por arquivo)
python pipelines\baixar_contratos_legados_playwright.py --fonte licitacoes --baixar --limite-mb 5

# Indexar sem baixar PDFs
python pipelines\baixar_contratos_legados_playwright.py --fonte licitacoes
```

**Nota técnica no script**: A coleta do índice de licitações (sem `--baixar`) já está implementada no script, mas requer escanear 718 páginas (páginas 450-718 são as relevantes para 2020-2021). A lógica atual detecta automaticamente o `pageCount` real.

---

## Próximos Passos para /pipeline

### Obras
- **Extrair e publicar**: `obras_sorocaba_detalhes.json` já tem dados estruturados (empresa, CNPJ, valor, endereço, percentual concluído)
- **Deduplicar por `obra_id`** antes de publicar (352 registros → 69 obras únicas)
- Para obras com CPL 2020-2021: filtrar `cpl` campo onde o ano (após "/") é 2020 ou 2021

### Licitações
- **Opção A (mais leve)**: usar o `indice_licitacoes.json` diretamente como tabela de licitações 2020-2021, sem baixar PDFs
- **Opção B (mais completo)**: baixar PDFs seletivamente e usar pdfplumber para extrair dados de contratos firmados

### Estrutura de saída esperada
```
data/public/sorocaba/contratos/saida/
├── licitacoes_sorocaba_2020_2021.csv   (do índice JSON)
└── obras_sorocaba.csv                  (das obras detalhes)
```

### Atualização de lacunas.ts (após publicação)
```typescript
// Contratos/Licitações 2020-2021
status: "publicado",
anosCobertos: 2,
fonte: "pub-consulta API + Playwright",

// Obras públicas
status: "publicado",
anosCobertos: 4,  // contratos 2022-2025, CPLs de vários anos
nota: "Portal obras não filtra por ano; 69 obras únicas disponíveis",
```

---

## APIs mapeadas (para referência futura)

| Endpoint | Descrição |
|---|---|
| `https://apps.sorocaba.sp.gov.br/das/obras/geojson/` | GeoJSON de todas as obras (352 features) |
| `https://apps.sorocaba.sp.gov.br/das/obras/{N}/` | Detalhe de cada obra (HTML) |
| `https://api.sorocaba.sp.gov.br/pub-consulta/api/publicacao?page={N}` | Lista de publicações (10/página) |
| `https://api.sorocaba.sp.gov.br/pub-consulta/api/publicacao/{id}/anexo` | Anexos de uma publicação |
| `https://api.sorocaba.sp.gov.br/pub-consulta/api/publicacao/{id}/anexo/{anexo_id}` | Download do PDF |
| `https://api.sorocaba.sp.gov.br/pub-consulta/api/publicacao/modalidade` | Modalidades disponíveis |
| `https://api.sorocaba.sp.gov.br/pub-consulta/api/publicacao/grupoStatus` | Status disponíveis |
