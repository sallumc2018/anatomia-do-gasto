# Bug Crítico — Receitas de Saúde Exibidas Erradas em Todos os Anos

Data: 2026-05-07
Severidade: **ALTA** — dado público errado na tela para todos os usuários

---

## O que estava errado

O parser `parseRevenueCSV` em `apps/web/lib/data.ts` lia as colunas por **posição fixa** (fields[0], fields[1], ...).

O CSV de saúde (`receitas_base_saude_sorocaba_{ano}.csv`) gerado pelo extrator de saúde tem `Fonte_PDF` na **posição 1** (segunda coluna):

```
Quadrimestre, Fonte_PDF, Proprios_Previsao, Proprios_Arrecadado, ..., Minimo_Saude_Arrecadado, Percentual_Aplicado_Liquidado
[0]           [1]        [2]                [3]                        [11]                     [12]
```

O parser esperava que `fields[11]` fosse `percentual_aplicado_liquidado`, mas com o deslocamento de 1 causado pelo `Fonte_PDF` não esperado, o campo [11] era `Minimo_Saude_Arrecadado` — um valor monetário de ~R$ 455 milhões.

Resultado: **"% aplicado"** exibia **"455.430.317,47%"** em vez de **"22,60%"**.

Todos os outros campos também estavam deslocados:
- `total_base_arrecadado` recebia `Total_Base_Previsao` (correto por coincidência de magnitude, mas dado errado)
- `proprios_previsao` recebia 0 (parseBrNumber do nome do arquivo → NaN → 0)
- etc.

---

## Escopo do impacto

- Todos os anos de **saúde** (2020, 2021, 2022, 2023, 2024, 2025): **AFETADOS**
- Todos os anos de **educação** (2020–2025): **não afetados** — nesses CSVs, `Fonte_PDF` está na última coluna, fora dos índices esperados pelo parser

Páginas afetadas:
- Homepage (`/`) — card de saúde: % aplicado e Receitas da área errados
- `/saude` — landing page: qualquer métrica derivada de `loadRevenueData`
- `/saude/relatorio/[ano]` — seção de receitas: valores errados
- `/saude/comparativo` — série histórica: percentuais errados 2020–2025

---

## A correção

`parseRevenueCSV` em `apps/web/lib/data.ts` foi reescrita para ser **orientada a cabeçalho**: lê a primeira linha, mapeia nome → índice, depois usa esses índices para cada linha de dados.

Aceita qualquer posição de `Fonte_PDF` e qualquer ordem de colunas. Suporta tanto `Minimo_Saude_*` quanto `Minimo_Educacao_*` no mesmo parser.

---

## O que o Codex precisa validar

### 1. Por que o CSV de saúde tem `Fonte_PDF` na posição 1?

O CSV de educação tem `Fonte_PDF` na última coluna. O CSV de saúde tem na segunda coluna. Isso provavelmente aconteceu porque o extrator de saúde (`extrator_saude.py`) foi atualizado para incluir `Fonte_PDF` antes da refatoração de colunas.

**Pergunta:** o extrator de saúde deve ser corrigido para colocar `Fonte_PDF` como última coluna (igual à educação), e todos os CSVs de saúde regenerados? Ou deixamos o parser do frontend orientado a cabeçalho (mais robusto de qualquer forma)?

### 2. Verificar o extrator de saúde

```bash
head -1 data/public/sorocaba/saude/saida/receitas_base_saude_sorocaba_2025.csv
```

Confirmar que a coluna `Percentual_Aplicado_Liquidado` existe e tem o valor correto (deve ser ~22%).

### 3. Validar visualmente no localhost

Com o servidor rodando em `http://localhost:3000`:
- Homepage: card de saúde deve mostrar "% aplicado: 22,60%" (não centenas de milhões)
- `/saude/relatorio/2025`: receitas devem mostrar valores coerentes
- `/saude/comparativo`: coluna MDE deve mostrar percentuais entre 15% e 30%

### 4. Verificar se outros parsers em `data.ts` têm o mesmo padrão frágil

`parseCSV` (despesas), `parseRREODespesasCSV`, `parseRREOReceitasCSV` — todos leem por posição.

Se algum CSV correspondente tiver colunas em ordem diferente do esperado pelo parser, o mesmo bug pode existir.

**Sugestão:** converter todos para header-based, ou pelo menos auditar que a ordem das colunas nos CSVs está travada com a ordem dos parsers.

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `apps/web/lib/data.ts` | `parseRevenueCSV` reescrita com header-based parsing + helper `splitCsvLine` extraído |

Nenhum CSV foi alterado — o bug era exclusivamente no frontend.
