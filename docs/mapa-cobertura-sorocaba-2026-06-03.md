# Mapa de Cobertura — Sorocaba 2020-2025

> **Versão:** 2026-06-03 · **Fonte de verdade:** `data/manifests/sorocaba_100_auditavel.csv` (manifesto curado, 55 fontes) + `data/manifests/sorocaba/mapa_cobertura.csv` (derivado, 57 linhas).
> **Padrão:** CER (Chão / Evidência / Rastro). Dado ausente não é zero.

Este documento responde, de forma auditável, a duas perguntas:
1. Quanto dos dados de Sorocaba já está publicado?
2. Quanto falta — e o que é alcançável **sem pedido formal de LAI**?

---

## Chão (o que estamos medindo)

O universo são **55 fontes** de dados públicos inventariadas para Sorocaba no período **2020-2025**, mais **2 ausências comprovadas na fonte**. Cada fonte é classificada em um de três níveis de acesso:

| Nível | O que significa | Fontes |
|---|---|---|
| **1 — Sem LAI** | Obtível sem protocolar pedido formal de informação | **37** |
| **2 — LAI necessário** | Só acessível via pedido formal (Lei de Acesso à Informação) | **18** |
| **3 — Ausência comprovada** | O dado **não existe** na fonte (provado, não presumido) | **2** |

---

## Evidência (os números, hoje)

### Nível 1 — Sem LAI (37 fontes)

| status | qtd | leitura |
|---|---|---|
| `publicado` | 12 | completo, no ar |
| `publicado_parcial` | 13 | cobertura/proxy publicada; granularidade fina ainda pendente |
| `parcial` | 9 | coletado em parte; falta tratar/publicar |
| `coletado_pendente_validacao` | 3 | dado em mãos (ou quase); falta validar ou recoletar |

- **Já publicado (completo + parcial): 25 / 37 = 68% do universo sem-LAI.**
- **Falta sem LAI: 12 fontes** (9 `parcial` + 3 `coletado_pendente_validacao`).

### Nível 2 — LAI necessário (18 fontes)
Dependem de pedido formal. Não são alcançáveis por coleta/scraping. Incluem, por exemplo, séries mensais detalhadas e o realizado da Câmara 2020-2021.

### Nível 3 — Ausência comprovada na fonte (2)
| fonte | período | prova |
|---|---|---|
| PNCP — contratos/atas/compras | 2020-2021 | `data/extracted/sorocaba/pncp/diagnosticos/pncp_sorocaba_cobertura_anos_2026-06-03.json` — PNCP só tem registros a partir de 2022 (ramp Lei 14.133/2021) |
| LOA — lei orçamentária | 2020-2021 | `docs/roadmap-sorocaba-100.md` + `/lacunas` — confirmado inexistente |

---

## Rastro (o que "100%" significa, sem inflar)

Há **três tetos diferentes**, e é desonesto confundi-los:

1. **100% sem-LAI** = fechar as 13 fontes do Nível 1 que faltam. Atingível por execução (coleta, extração, validação, publicação), **no nível de granularidade que cada fonte abre publicamente**.
2. **100% de profundidade** ≠ 100% sem-LAI. Vários itens chegam a `publicado_parcial` porque a parte fina (série mensal, realizado da Câmara 2020-21) está **atrás de LAI**.
3. **100% de Sorocaba** = 55/55 com os 18 LAI **resolvidos** (deferidos, extraídos, publicados) **ou** documentados como recusa/ausência. Mais a ressalva de que o inventário de 55 é o mapa conhecido — não prova de que cobre a cidade inteira (ver tarefa futura: "o que falta além dos 55").

**Afirmação pública sustentável hoje:**
> Publicamos a cobertura pública de Sorocaba 2020-2025 acessível sem pedido formal de LAI, no maior nível de granularidade que cada fonte disponibiliza abertamente. As lacunas restantes estão documentadas e ou dependem de LAI, ou são ausências comprovadas na fonte.

---

## As 12 fontes que faltam sem LAI (A3 concluída em 2026-06-03)

**Bloco A — dado em mãos, validar/autorizar:**
1. AUDESP · dados enviados ao TCE → identificar acesso público
2. SAAE · licitações/contratos/obras → autorizar publicação cautelosa
3. ~~TCE-SP · contas e pareceres~~ → **inventário de 20 pareceres publicado (2026-06-03)**; extração de conteúdo dos PDFs segue pendente (publicado_parcial)

**Bloco B — recoleta + extração:**
4. Urbes · relação mensal de despesas → recoletar (raw ausente) + QA
5. Urbes · remuneração transporte → recoletar (raw ausente) + QA
6. Prefeitura · despesa registro analítico → baixar 2021-2023 + normalizar
7. SIOPS · saúde → coletar direto (validação independente)
8. Prefeitura · LOA programas/ações/valores → extrair
9. Câmara · contratos/despesas gabinete → inventariar
10. Câmara · projetos de lei/votações → indexar matérias com impacto fiscal

**Bloco C — inventário/normalização:**
11. Prefeitura · LOA audiências públicas → inventariar anexos
12. Câmara · subsídios e remuneração → validar
13. SAAE · remuneração RH → inventariar formato

---

*Derivado do manifesto curado por uma sessão Claude Opus em 2026-06-03. Reproduzível a partir de `data/manifests/sorocaba/mapa_cobertura.csv`. Proveniência: ver `memory/provenance/changes.csv`.*
