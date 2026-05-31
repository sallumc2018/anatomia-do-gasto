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
| SICONFI | RREO, RGF e DCA pelo IBGE 3536505 | ✅ EXTRAÍDO (81 CSVs, 2020-2025) |
| PNCP | Contratos, licitacoes e atas | 🔄 Parcial (PNCP API 403; transporte 2022 OK via API) |

## Ordem de trabalho

1. ✅ Parametrizar extratores federais/estaduais existentes para municipio `paulinia` e IBGE `3536505`.
   - 17 pipelines adaptados; 81 CSVs em data/extracted/paulinia (2026-05-31)
   - Cobertura: receita, despesa executivo, pessoal, divida, RPPS, seguranca, transporte, saude, transferencias federais
2. Testar TCE-SP receitas/despesas (adaptar baixar_tce_sorocaba.py → baixar_tce_paulinia.py).
3. Inventariar portais proprios da Prefeitura e Camara.
4. data/extracted/paulinia ja existe com saidas mecanicas auditaveis do SICONFI.
5. Promover para data/public/paulinia somente apos QA completo e manifestos.

## Pendencias tecnicas

- `sefaz_sp` de Paulinia: None em paths.py — descobrir no portal fazenda.sp.gov.br
- `cnpj_prefeitura` de Paulinia: None em paths.py — necessario para PNCP
- Script TCE-SP para Paulinia: adaptar baixar_tce_sorocaba.py (mesma API, slug URL diferente)
- Script prefeitura Paulinia: novo, a partir de inventario do portal dados-abertos
- Script camara Paulinia: novo, portal SMARAPD (transparencia-cmpaulinia.smarapd.com.br)

## Regra de publicacao

Paulínia segue a mesma regra de Sorocaba:

- `data/raw` e `data/extracted` nao sao publicacao.
- `data/validated` so vira `data/public` apos QA local e decisao explicita.
- O site deve ler apenas `data/public`.

## Meta Linked Data

A expansao de Paulinia deve nascer com URIs estaveis para municipio, datasets e distribuicoes no catalogo Linked Data. Enquanto nao houver CSV publicado, Paulinia aparece apenas nos manifestos de planejamento, nao no catalogo publico de datasets.
