# Handoff Sonnet → Opus — Extração Sorocaba (2026-06-01)

**De:** Sessão Sonnet (extração mecânica)  
**Para:** Sessão Opus (validação + publicação)  
**Branch:** codex/institutional-audit-data-catalog  
**Data:** 2026-06-01

---

## O que foi feito

### ✅ Tarefa 1 — Urbes contratos/licitações (OCR)
- **Arquivos:** `data/extracted/sorocaba/urbes/` (junction → G: drive)
- 177 PDFs já estavam extraídos via OCR Tesseract (cache hit):
  - `contratos_contratos_outros_ocr.csv` — 47 regs, ok=47, erros=0
  - `contratos_contratos_receitas_ocr.csv` — 91 regs, ok=91, erros=0
  - `contratos_contratos_transporte_ocr.csv` — 39 regs, ok=39, erros=0
  - Versões `_reparsed.csv` também presentes (campos estruturados)
- **Status manifest:** já publicado no `data/public/sorocaba/transporte/urbes/saida/` como índices OCR
- **Ação Opus:** verificar se os campos `numero_contrato`, `cnpj`, `valor`, `data_assinatura` têm cobertura suficiente para exibição pública; se sim, flipar status dos índices

### ✅ Tarefa 2 — Registro Analítico da Receita
- **BLOCKER permanente:** Sorocaba não publica o "Livro Registro Analítico da Receita"
- Comprovado: URL padrão (mesmo schema da Despesa) retorna 301→302 em loop (arquivo inexistente)
- Receita do portal SICONFI (RREO Anexo 01) já está publicada em `data/public/sorocaba/receita/`
- **Ação Opus:** registrar no manifesto como gap permanente ("não publicado pelo município")

### ✅ Tarefa 3 — Contratos pré-2022 (2020–2021)
- **Arquivo:** `data/extracted/sorocaba/contratos/licitacoes_sorocaba_2020_2021.csv`
  - 1.078 registros, campos: id, codigo_processo, modalidade, descricao_objeto, situacao, data_abertura
  - **Gap:** fornecedor, valor, vigência **não estão na API** — só nos PDFs individuais
- **Script de download de PDFs:** `pipelines/baixar_contratos_legados_playwright.py --fonte licitacoes --baixar`
  - Requer Playwright; ~1.078 processos; risco OOM em lote grande
  - Índice JSON já em: `data/raw/sorocaba/contratos/legados/2020-2021/indice_licitacoes.json`
- Obras: `data/extracted/sorocaba/contratos/obras_sorocaba.csv` — 69 registros, publicado
- **Ação Opus:** decidir se publica CSV sem fornecedor/valor ou aguarda extração de PDFs

### ✅ Tarefa 4 — Câmara contratos/licitações
- **BLOCKER:** Portal `arquivos_publicos.html` retorna 403 até para Playwright no root
- Categorias mapeadas (7): gabinete, ldo, loa, lrf, metas, ppa, prestacao — **sem contratos**
- PNCP: Câmara Municipal de Sorocaba não publica contratos no PNCP
- **Ação Opus:** registrar como gap no manifesto + considerar e-SIC para inventário de contratos

### ✅ Tarefa 5 — Controle externo: alertas SDG + TCE
**5a. PDFs SDG 2025 extraídos:**
- **Arquivo:** `data/extracted/sorocaba/controle_externo/alertas_sdg_texto_2025_sorocaba.csv`
- 81 páginas, ~147K chars, texto nativo (PDF não-scaneado), qualidade excelente
- Cobre os 4 comunicados SDG (bimestres 2, 3, 4, 5 de 2025)
- Resolve pendência registrada em `alertas_sdg_2025_sorocaba.csv` (campo `observacao` dizia "extracao textual integral do PDF pendente")
- **Ação Opus:** (1) verificar se texto contém os incisos I e V para Sorocaba, (2) extrair trechos relevantes para publicação, (3) flipar observação no CSV público

**5b. Alertas analíticos 2020-2024:**
- **Gap:** TCE-SP só disponibiliza CSV analítico do ano 2019 (open data congelado em 2019)
- Para 2020-2024 não há equivalente em CSV aberto — seria necessário SDG comunicados anuais
- **Arquivo gerado:** `alertas_analitico_sorocaba_2020_2024.csv` — apenas header (0 registros esperado)
- **Ação Opus:** registrar gap; alternativa seria raspar comunicados SDG anuais (2020-2024) do TCE-SP se existirem

---

## Pendências que precisam de Playwright (pós-Sonnet)

| Tarefa | Script | Risco |
|---|---|---|
| PDFs individuais de contratos 2020-2021 | `baixar_contratos_legados_playwright.py --fonte licitacoes --baixar` | OOM em lote; ~1.078 PDFs |
| Categorias novas Câmara | `descobrir_camara_categorias.py` | Root 403; improvável sem mudança no portal |

---

## Arquivos entregues para validação Opus

```
data/extracted/sorocaba/
  urbes/
    contratos_contratos_outros_ocr.csv       (47 regs)
    contratos_contratos_outros_reparsed.csv  (47 regs)
    contratos_contratos_receitas_ocr.csv     (91 regs)
    contratos_contratos_receitas_reparsed.csv (91 regs)
    contratos_contratos_transporte_ocr.csv   (39 regs)
    contratos_contratos_transporte_reparsed.csv (39 regs)
  contratos/
    licitacoes_sorocaba_2020_2021.csv        (1078 regs)
    obras_sorocaba.csv                       (69 regs)
  controle_externo/
    alertas_sdg_texto_2025_sorocaba.csv      (81 págs, 147K chars)
    alertas_analitico_sorocaba_2020_2024.csv (0 regs — gap confirmado)
```

---

## Scripts novos commitados

- `pipelines/descobrir_camara_categorias.py` — Playwright para mapear IDs do portal Câmara
- `pipelines/extrair_alertas_sdg_tce.py` — extração pdfplumber + filtro alertas analítico

## Junction restaurada

A junction `data/extracted → G:\Meu Drive\Omega-data\extracted` estava quebrada (target não existia). Criado o diretório `G:\Meu Drive\Omega-data\extracted\sorocaba\` para restaurar o acesso. Verificar se o G: está montado antes de rodar qualquer script que grave em extracted.
