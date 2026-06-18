# Handoff Claude(Sonnet) → Opus — Paulínia: coleta encerrada, QA pendente
**Data:** 2026-05-31  
**De:** Claude Sonnet  
**Para:** Claude Opus (QA + publicação)

---

## Coleta concluída — o que existe em data/extracted/paulinia/

| Fonte | Arquivos | Registros | Período | Status |
|---|---|---|---|---|
| SICONFI (receita/despesa/fiscal/RGF/RREO) | 81 CSVs | — | 2020-2025 | ✅ extraído |
| FNS repasses SUS | 7 CSVs | ~100/ano | 2020-2025 | ✅ extraído |
| Transferências federais | 5 CSVs | convênios | 2021-2025 | ✅ (2020=vazio real) |
| Transferências estaduais SP | 8 CSVs | 85 linhas | 2020-2026 | ✅ (sefaz_sp=5137) |
| TCE-SP alertas | 2 CSVs | 16 alertas | 2019 | ✅ |
| TCE-SP contas anuais | inventário CSV | 318 PDFs | 2002-2024 | ✅ inventariado |
| TCE-SP despesas granular | 6 CSVs | **364.803** | 2020-2025 | ✅ extrator_tce_transparencia.py |
| TCE-SP receitas granular | 6 CSVs | **8.202** | 2020-2025 | ✅ extrator_tce_transparencia.py |
| PNCP contratos/atas/compras | 10 CSVs | **3.895** | 2023-2026 | ✅ (CNPJ=45751435000106) |

**Total: ~120 CSVs, ~377k registros granulares.**

## O que ficou pendente (portais próprios — SPAs, precisam de Playwright)

- **Prefeitura transparência**: `https://paulinia.sp.gov.br/transparencia` — SPA, 200 mas sem conteúdo estático. Imperva Incapsula. Pode ter despesas/receitas próprias (além do TCE).
- **Câmara despesas**: `https://www.camarapaulinia.sp.gov.br/despesas/` — SPA, 200.
- **Câmara SMARAPD**: `https://transparencia-cmpaulinia.smarapd.com.br/` — SPA Angular, 200. CSP restritivo.

**Avaliação:** Com TCE-SP granular (364k despesas), o valor marginal dos portais próprios é baixo para publicação inicial. Podem ser coletados em iteração futura.

## Scripts criados/adaptados nesta sessão

- `pipelines/extrator_tce_transparencia.py` — **novo**: consolida JSONs mensais TCE em CSVs anuais
- `pipelines/baixar_pncp_playwright.py` — parametrizado via CFG (CNPJ + MUNICIPIO)
- `pipelines/paths.py` — `sefaz_sp="5137"`, `cnpj_prefeitura="45751435000106"`

## Destaques editoriais para Plínio/publicação

- **Pessoal 2020: 59.5% da RCL** — acima do limite LRF (54%). Causou rejeição das contas pelo TCE-SP.
- Pessoal voltou a subir: 50.1% (2024), 52.3% (2025).
- Receita cresceu 110% em 5 anos (R$1.4B → R$3.0B) — REPLAN/Petrobras sustenta ICMS-cota.
- Dívida baixa (8–25% RCL) — problema é gasto corrente, não dívida.
- TCE alertas: 15 alertas na Prefeitura + 1 na Câmara (todos de 2019).
- PNCP: 318 contratos + 1.409 atas + 1.440 compras (2023-2026).

## Próximo passo para Opus

1. **QA dos dados extraídos** — validar consistência entre SICONFI e TCE-SP granular
2. **Decisão de promoção** a `data/public/paulinia/` (regra do portão: só Opus decide)
3. **Página `/paulinia` no site** — reutilizar componentes de Sorocaba
4. **Hierarquia nacional** no `/mapa-interativo` (agora com 2 municípios publicados)
5. Interpretação editorial (Plínio) das contas 2020 rejeitadas

## Referência rápida

- paths.py: `ibge=3536505`, `sefaz_sp=5137`, `cnpj_prefeitura=45751435000106`
- `gerar_qa_manifest.py` só roda após promover para `data/public/`
- Commits desta sessão: prefixo `[Claude]`
