# Handoff — Orquestrador → /pipeline
# Tarefa: Obras públicas + Contratos 2020-2021 + Precatórios

**Data:** 2026-05-22
**Score atual de Sorocaba:** 71.1%
**Impacto esperado desta tarefa:** +3–4pp (dimensão contratos, lacuna CRÍTICA obras + alta contratos)

---

## Contexto geral

A dimensão **Contratos** (peso 20%) está em 57.1% — a maior lacuna absoluta (−8.6pp).
Os três itens pendentes nesta dimensão são:

| Item | Status atual | anosPossiveis | anosCobertos |
|------|-------------|---------------|--------------|
| Obras públicas | lacuna | 6 | 0 |
| Contratos 2020-2021 | lacuna | 2 | 0 |
| Precatórios e RPVs | lacuna | 6 | 0 |

Fonte da verdade do score: `apps/web/lib/lacunas.ts`

---

## Tarefa 1 — Obras públicas (CRÍTICA, maior impacto)

### Fonte
**PNCP** — Portal Nacional de Contratações Públicas.
O pipeline `pipelines/gerar_pncp_publicacao.py` já extrai *compras e atas* do PNCP.
Obras são uma **modalidade diferente** na mesma API.

**Endpoint PNCP para obras de Sorocaba:**
```
GET https://pncp.gov.br/api/pncp/v1/orgaos/45285407000155/compras
  ?dataInicial=20230101&dataFinal=20261231
  &modalidadeId=1   # 1=Concorrência (obras), 5=Pregão (compras)
  &pagina=1&tamanhoPagina=500
```

CNPJ Sorocaba (Prefeitura): `45.285.407/0001-55`

Modalidades relevantes para obras:
- `1` = Concorrência
- `3` = Tomada de preços
- `8` = Leilão
- `12` = Concorrência — obras especiais

### O que extrair por obra
`numero`, `objeto`, `modalidade`, `valor_total_estimado`, `situacao`,
`data_publicacao`, `data_assinatura`, `vigencia_inicio`, `vigencia_fim`,
`orgao_cnpj`, `orgao_nome`

### Saída esperada
`data/public/sorocaba/contratos/saida/obras_pncp_sorocaba_2023_2026.csv`

### Atualização lacunas.ts
```typescript
// item "Obras públicas"
status: "parcial",       // era "lacuna" — PNCP só cobre a partir de 2023
anosPossiveis: 3,        // 2023, 2024, 2025 — ajustar conforme cobertura real
anosCobertos: 3,
```

---

## Tarefa 2 — Contratos e licitações 2020-2021

### Fonte
Portal de Transparência de Sorocaba (antes do PNCP, lei antiga):
`https://fazenda.sorocaba.sp.gov.br/transparencia`

### Estratégia
1. Inventariar a seção de contratos no portal para 2020 e 2021
2. Se acessível via requests normais → `/pipeline`
3. Se retornar 403/WAF → abrir novo handoff para `/playwright`

### Campos a extrair
`ano`, `numero_contrato`, `objeto`, `contratada`, `cnpj`, `valor`, `data_assinatura`,
`vigencia_inicio`, `vigencia_fim`, `modalidade_licitacao`

### Saída esperada
`data/public/sorocaba/contratos/saida/contratos_portal_sorocaba_2020_2021.csv`

### Atualização lacunas.ts
```typescript
// item "Contratos e licitações anteriores a 2022"
status: "publicado",
anosCobertos: 2,
```

---

## Tarefa 3 — Precatórios e RPVs

### Fonte
**CNJ** — Painel de Precatórios:
`https://painel-estatistica.stg.cloud.cnj.jus.br/precatorios`

**Portal de Sorocaba** — pode ter quadro de precatórios próprio:
`https://fazenda.sorocaba.sp.gov.br/transparencia` (buscar "precatórios" ou "RPV")

### O que coletar
- Número do precatório, credor, valor atualizado, tribunal de origem, ano de expedição, situação (pendente/pago)
- Série histórica 2020-2025 se disponível

### Saída esperada
`data/public/sorocaba/contratos/saida/precatorios_sorocaba_2020_2025.csv`

Colunas mínimas: `ano`, `numero`, `credor`, `valor_atualizado`, `situacao`, `tribunal`

### Atualização lacunas.ts
```typescript
// item "Precatórios e RPVs"
status: "publicado",     // ou "parcial" se cobertura parcial
anosPossiveis: 6,
anosCobertos: 6,         // ajustar conforme disponibilidade
```

---

## Sequência recomendada

1. Obras PNCP (mais estruturado, API conhecida)
2. Precatórios CNJ (painel público, sem autenticação)
3. Contratos 2020-2021 (testar requests primeiro; se 403 → abrir handoff playwright)

---

## Validação

Para cada CSV gerado:
```bash
python -c "
import pandas as pd
for f in ['obras_pncp_sorocaba_2023_2026.csv', 'contratos_portal_sorocaba_2020_2021.csv', 'precatorios_sorocaba_2020_2025.csv']:
    try:
        df = pd.read_csv(f'data/public/sorocaba/contratos/saida/{f}')
        print(f'OK {f}: {len(df)} linhas')
    except FileNotFoundError:
        print(f'SKIP {f}: nao gerado')
"
```

Após publicar: `python c:/tmp/calc_score.py` — contratos deve subir de 57.1%.

---

## Handoff de volta

Commit + push + `vercel deploy --prod --yes`.
Atualizar `memory/handoffs/2026-05/cobertura-sorocaba.md` com novo score.
Se contratos 2020-2021 retornar 403 → criar `handoff-contratos-legados-playwright.md`.
