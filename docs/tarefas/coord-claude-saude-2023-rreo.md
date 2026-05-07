# Tarefa Para Claude - Saude 2023 RREO

Data: 2026-05-07

## Problema Objetivo

Os arquivos publicados de saude 2023 abaixo **nao** trazem `Fonte_PDF` nem `Fonte_URL` no cabecalho:

- `data/public/sorocaba/saude/saida/rreo_despesas_saude_sorocaba_2023.csv`
- `data/public/sorocaba/saude/saida/rreo_receitas_sus_sorocaba_2023.csv`

O mesmo problema aparece em `data/validated` para esses dois arquivos.

## O Que Isso Significa

- o problema **nao parece ser do frontend**;
- o problema **nao parece ser da politica de publicacao**;
- o problema parece ser de **versao de dados publicada/validada desatualizada**.

Hoje, o script `pipelines/extrator_rreo_sus.py` ja escreve `Fonte_PDF` em:

- `salvar_despesas()`
- `salvar_receitas()`

Ou seja: a ausencia de `Fonte_PDF` nos CSVs de 2023 sugere que esses arquivos foram gerados antes da versao atual do extrator, ou que 2023 nao foi regenerado/republicado depois da melhoria.

## Hipotese Principal

O caso de saude 2023 e diferente do caso de educacao 2023:

- educacao 2023 parece ter um problema real de formato/fonte em parte dos PDFs;
- saude 2023, no RREO, parece ser **stale output** nas camadas `validated/public`, nao necessariamente falha atual do extrator.

## Verificacao Minima Esperada

1. Reprocessar 2023 com `pipelines/extrator_rreo_sus.py`
2. Conferir se a nova saida gerada inclui `Fonte_PDF`
3. Se incluir, comparar com os CSVs atuais em `data/validated` e `data/public`
4. Atualizar a trilha correta sem publicar nada automaticamente

## Resultado Esperado

Os dois CSVs de saude 2023 abaixo devem passar a ter `Fonte_PDF`:

- `data/public/sorocaba/saude/saida/rreo_despesas_saude_sorocaba_2023.csv`
- `data/public/sorocaba/saude/saida/rreo_receitas_sus_sorocaba_2023.csv`

Se houver qualquer quebra real de parsing em 2023, registrar explicitamente:

- qual quadrimestre falhou;
- se o PDF existe em `data/raw`;
- se o problema esta no texto extraido;
- se precisa ajuste de parsing ou apenas regeneracao.

## Atualizacao 2026-05-07 - Educacao 2023 T3

Verificacao local no PDF bruto `data/raw/sorocaba/educacao/entrada/2023-3-trimestre-relatorios-de-aplicacao-no-ensino.pdf`:

- a coluna de `DOTACAO ATUALIZADA` aparece como `*` para `TOTAL`, `Ensino Fundamental` e `Educacao Infantil`;
- o proprio PDF traz a nota:
  - `(*) Valores nao informados considerando que na Lei Orcamentaria, a discriminacao da despesa, quanto a sua natureza, foi elaborada por categoria economica, grupo de natureza de despesa e modalidade de ...`

Conclusao:

- a ausencia de dotacao no T3 de 2023 **nao e falha do extrator**;
- a UI pode e deve explicar essa lacuna como limite da fonte oficial;
- mas isso **nao resolve sozinho** a consistencia dos CSVs.

### Ponto ainda em aberto na educacao 2023

O arquivo publico:

- `data/public/sorocaba/educacao/saida/receitas_base_educacao_sorocaba_2023.csv`

continua com a linha do quadrimestre `3` zerada em todas as colunas, embora o PDF bruto mostre valores de receita no periodo.

Portanto, a educacao 2023 **ainda nao esta 100% correta** enquanto esse CSV de receitas do T3 permanecer zerado.

### Outro ponto em aberto

Os CSVs publicos e validados de educacao 2023 ainda estao sem `Fonte_PDF` no cabecalho:

- `data/public/sorocaba/educacao/saida/despesas_educacao_sorocaba_2023.csv`
- `data/public/sorocaba/educacao/saida/receitas_base_educacao_sorocaba_2023.csv`
- `data/validated/sorocaba/educacao/saida/despesas_educacao_sorocaba_2023.csv`
- `data/validated/sorocaba/educacao/saida/receitas_base_educacao_sorocaba_2023.csv`

Para fechar educacao 2023 de forma auditavel, faltam:

1. corrigir a linha de receitas do T3 2023;
2. regenerar `validated/public` com `Fonte_PDF`;
3. alinhar manifesto e texto publico a esse estado final.
