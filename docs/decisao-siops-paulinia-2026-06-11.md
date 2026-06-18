# Decisão SIOPS - Paulínia - 2026-06-11

Decisão para o MVP Paulínia: o proxy SICONFI (RREO anexo02 + despesas_executivo por função saúde)
é suficiente para não bloquear a frente não-LAI.

Base local validada:

- `data/public/paulinia/executivo/saida/despesas_executivo_paulinia_{ano}.csv` — despesas por função
- `data/public/paulinia/receita/saida/receitas_paulinia_{ano}.csv` — receitas
- 6 anos (2020-2025) via API SICONFI

O SIOPS federal direto permanece útil como fonte setorial independente, mas não será tratado como
bloqueio automático enquanto:

- os arquivos SICONFI cobrirem 2020-2025 com despesas de saúde desagregadas por função;
- o manifesto indicar claramente que SIOPS direto foi diferido;
- nenhuma publicação declarar que a base federal direta SIOPS foi coletada.

Analogia: mesma decisão tomada para Sorocaba em 2026-06-02
(docs/decisao-siops-sorocaba-2026-06-02.md).

Próximo uso recomendado do SIOPS direto: validação independente de ASPS (aplicação mínima em saúde),
receitas/despesas setoriais e indicadores constitucionais antes de ampliar análises públicas de saúde
de Paulínia.
