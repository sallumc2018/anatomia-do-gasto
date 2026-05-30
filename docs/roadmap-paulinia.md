# Roadmap Paulinia

## Estado inicial

Paulinia entrou na fila publica de municipios como segunda cidade de expansao, ainda sem dados publicados no site.

Arquivos de partida:

- `data/manifests/municipios_pipeline.csv`
- `data/manifests/paulinia_seed_sources.csv`
- `data/manifests/paulinia_100_auditavel.csv`

## Fontes iniciais

| Fonte | Uso esperado | Status |
| --- | --- | --- |
| Prefeitura - Dados Abertos | Catalogo oficial e inventario de datasets | A verificar |
| TCE-SP Receitas | Receita municipal 2020-2026 | A verificar |
| TCE-SP Despesas | Despesa municipal 2020-2026 | A verificar |
| Camara - Despesas | Execucao legislativa | A verificar |
| Camara - Portal SMARAPD | Transparencia legislativa auxiliar | A verificar |
| SICONFI | RREO, RGF e DCA pelo IBGE 3536505 | A verificar |
| PNCP | Contratos, licitacoes e atas | A verificar |

## Ordem de trabalho

1. Parametrizar extratores federais/estaduais existentes para municipio `paulinia` e IBGE `3536505`.
2. Testar TCE-SP receitas/despesas antes de qualquer scraper municipal.
3. Inventariar portais proprios da Prefeitura e Camara.
4. Criar `data/extracted/paulinia` apenas com saidas mecanicas auditaveis.
5. Promover para `data/public/paulinia` somente apos QA e manifestos.

## Regra de publicacao

Paulínia segue a mesma regra de Sorocaba:

- `data/raw` e `data/extracted` nao sao publicacao.
- `data/validated` so vira `data/public` apos QA local e decisao explicita.
- O site deve ler apenas `data/public`.

## Meta Linked Data

A expansao de Paulinia deve nascer com URIs estaveis para municipio, datasets e distribuicoes no catalogo Linked Data. Enquanto nao houver CSV publicado, Paulinia aparece apenas nos manifestos de planejamento, nao no catalogo publico de datasets.
