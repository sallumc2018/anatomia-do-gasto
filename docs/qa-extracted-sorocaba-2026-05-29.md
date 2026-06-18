# QA extracted Sorocaba - 2026-05-29

Escopo: `data/extracted/sorocaba/{urbes,fiscal,funserv,camara,tce}`.

Regra: este relatorio nao autoriza publicacao. Qualquer promocao para `data/public` exige QA especifico, manifestos e gate explicito.

Nota Camara: os arquivos classificados como LDO/metas no recorte da Camara sao atas de audiencias publicas ou documentos legislativos relacionados. Eles nao substituem as LDOs/metas oficiais completas da Prefeitura/Executivo.

## Resumo

| Area | OK | Warn | Fail |
| --- | ---: | ---: | ---: |
| urbes | 5 | 0 | 0 |
| fiscal | 50 | 0 | 0 |
| funserv | 7 | 1 | 0 |
| camara | 12 | 0 | 0 |
| tce | 11 | 0 | 0 |

## Problemas e avisos

- `data/extracted/sorocaba/funserv/inventario_funserv_documentos.csv`: **warn**; issues=stale_legacy_inventory_no_data_rows; notes=legado_2026-05-23; fora_do_pacote_extraido_2026-05-29

## Inventario resumido

- `data/extracted/sorocaba/urbes/contratos_contratos_outros_ocr.csv`: csv, rows=47, columns=10, status=ok
- `data/extracted/sorocaba/urbes/contratos_contratos_receitas_ocr.csv`: csv, rows=91, columns=10, status=ok
- `data/extracted/sorocaba/urbes/contratos_contratos_transporte_ocr.csv`: csv, rows=39, columns=10, status=ok
- `data/extracted/sorocaba/urbes/inventario_urbes_transparencia.csv`: csv, rows=171, columns=11, status=ok
- `data/extracted/sorocaba/urbes/resumo_urbes_transparencia.csv`: csv, rows=3, columns=4, status=ok
- `data/extracted/sorocaba/fiscal/saida/dca_balanco_orcamentario_sorocaba_2020_2025.csv`: csv, rows=1078, columns=12, status=ok
- `data/extracted/sorocaba/fiscal/saida/dca_demonstrativo_variacao_sorocaba_2020_2025.csv`: csv, rows=1572, columns=12, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_detalhada_sorocaba_2020.csv`: csv, rows=1, columns=23, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_detalhada_sorocaba_2021.csv`: csv, rows=1, columns=23, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_detalhada_sorocaba_2022.csv`: csv, rows=1, columns=23, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_detalhada_sorocaba_2023.csv`: csv, rows=1, columns=23, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_detalhada_sorocaba_2024.csv`: csv, rows=1, columns=23, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_detalhada_sorocaba_2025.csv`: csv, rows=1, columns=23, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_sorocaba_2020.csv`: csv, rows=1, columns=16, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_sorocaba_2021.csv`: csv, rows=1, columns=16, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_sorocaba_2022.csv`: csv, rows=1, columns=16, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_sorocaba_2023.csv`: csv, rows=1, columns=16, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_sorocaba_2024.csv`: csv, rows=1, columns=16, status=ok
- `data/extracted/sorocaba/fiscal/saida/divida_sorocaba_2025.csv`: csv, rows=1, columns=16, status=ok
- `data/extracted/sorocaba/fiscal/saida/natureza_despesa_sorocaba_2020.csv`: csv, rows=1, columns=9, status=ok
- `data/extracted/sorocaba/fiscal/saida/natureza_despesa_sorocaba_2021.csv`: csv, rows=1, columns=9, status=ok
- `data/extracted/sorocaba/fiscal/saida/natureza_despesa_sorocaba_2022.csv`: csv, rows=1, columns=9, status=ok
- `data/extracted/sorocaba/fiscal/saida/natureza_despesa_sorocaba_2023.csv`: csv, rows=1, columns=9, status=ok
- `data/extracted/sorocaba/fiscal/saida/natureza_despesa_sorocaba_2024.csv`: csv, rows=1, columns=9, status=ok
- `data/extracted/sorocaba/fiscal/saida/natureza_despesa_sorocaba_2025.csv`: csv, rows=1, columns=9, status=ok
- `data/extracted/sorocaba/fiscal/saida/pessoal_sorocaba_2020.csv`: csv, rows=1, columns=13, status=ok
- `data/extracted/sorocaba/fiscal/saida/pessoal_sorocaba_2021.csv`: csv, rows=1, columns=13, status=ok
- `data/extracted/sorocaba/fiscal/saida/pessoal_sorocaba_2022.csv`: csv, rows=1, columns=13, status=ok
- `data/extracted/sorocaba/fiscal/saida/pessoal_sorocaba_2023.csv`: csv, rows=1, columns=13, status=ok
- `data/extracted/sorocaba/fiscal/saida/pessoal_sorocaba_2024.csv`: csv, rows=1, columns=13, status=ok
- `data/extracted/sorocaba/fiscal/saida/pessoal_sorocaba_2025.csv`: csv, rows=1, columns=13, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_capital_sorocaba_2020.csv`: csv, rows=1, columns=10, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_capital_sorocaba_2021.csv`: csv, rows=1, columns=10, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_capital_sorocaba_2022.csv`: csv, rows=1, columns=10, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_capital_sorocaba_2023.csv`: csv, rows=1, columns=10, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_capital_sorocaba_2024.csv`: csv, rows=1, columns=10, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_capital_sorocaba_2025.csv`: csv, rows=1, columns=10, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_sorocaba_2020.csv`: csv, rows=1, columns=19, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_sorocaba_2021.csv`: csv, rows=1, columns=19, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_sorocaba_2022.csv`: csv, rows=1, columns=19, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_sorocaba_2023.csv`: csv, rows=1, columns=19, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_sorocaba_2024.csv`: csv, rows=1, columns=19, status=ok
- `data/extracted/sorocaba/fiscal/saida/rcl_sorocaba_2025.csv`: csv, rows=1, columns=19, status=ok
- `data/extracted/sorocaba/fiscal/saida/rpps_sorocaba_2020.csv`: csv, rows=1, columns=8, status=ok
- `data/extracted/sorocaba/fiscal/saida/rpps_sorocaba_2021.csv`: csv, rows=1, columns=8, status=ok
- `data/extracted/sorocaba/fiscal/saida/rpps_sorocaba_2022.csv`: csv, rows=1, columns=8, status=ok
- `data/extracted/sorocaba/fiscal/saida/rpps_sorocaba_2023.csv`: csv, rows=1, columns=8, status=ok
- `data/extracted/sorocaba/fiscal/saida/rpps_sorocaba_2024.csv`: csv, rows=1, columns=8, status=ok
- `data/extracted/sorocaba/fiscal/saida/rpps_sorocaba_2025.csv`: csv, rows=1, columns=8, status=ok
- `data/extracted/sorocaba/fiscal/saida/rreo_metas_fiscais_sorocaba_2020_2025.csv`: csv, rows=791, columns=16, status=ok
- `data/extracted/sorocaba/fiscal/saida/rreo_pessoal_siconfi_sorocaba_2020_2025.csv`: csv, rows=1036, columns=16, status=ok
- `data/extracted/sorocaba/fiscal/saida/rreo_receita_orcamentaria_sorocaba_2020_2025.csv`: csv, rows=2791, columns=16, status=ok
- `data/extracted/sorocaba/fiscal/saida/rreo_receitas_previdenciarias_sorocaba_2020_2025.csv`: csv, rows=2533, columns=16, status=ok
- `data/extracted/sorocaba/fiscal/saida/rreo_restos_siconfi_sorocaba_2020_2025.csv`: csv, rows=400, columns=16, status=ok
- `data/extracted/sorocaba/fiscal/saida/rreo_saude_siconfi_sorocaba_2020_2025.csv`: csv, rows=6778, columns=16, status=ok
- `data/extracted/sorocaba/funserv/funserv_apr_sorocaba_2020_2026.csv`: csv, rows=71, columns=10, status=ok
- `data/extracted/sorocaba/funserv/funserv_atuarial_sorocaba_2015_2025.csv`: csv, rows=18, columns=5, status=ok
- `data/extracted/sorocaba/funserv/funserv_balanco_previdenciario_ate_2018.csv`: csv, rows=178, columns=5, status=ok
- `data/extracted/sorocaba/funserv/funserv_balanco_saude_ate_2018.csv`: csv, rows=192, columns=5, status=ok
- `data/extracted/sorocaba/funserv/funserv_governanca_sorocaba_2019_2026.csv`: csv, rows=66, columns=5, status=ok
- `data/extracted/sorocaba/funserv/inventario_funserv_documentos.csv`: csv, rows=0, columns=11, status=warn
- `data/extracted/sorocaba/funserv/inventario_funserv_paginas.csv`: csv, rows=21, columns=3, status=ok
- `data/extracted/sorocaba/funserv/resumo_funserv.json`: json, rows=5, columns=None, status=ok
- `data/extracted/sorocaba/camara/gabinete/saida/despesas_gabinete_camara_sorocaba_2020.csv`: csv, rows=237, columns=9, status=ok
- `data/extracted/sorocaba/camara/gabinete/saida/despesas_gabinete_camara_sorocaba_2021.csv`: csv, rows=247, columns=9, status=ok
- `data/extracted/sorocaba/camara/gabinete/saida/despesas_gabinete_camara_sorocaba_2022.csv`: csv, rows=239, columns=9, status=ok
- `data/extracted/sorocaba/camara/gabinete/saida/despesas_gabinete_camara_sorocaba_2023.csv`: csv, rows=235, columns=9, status=ok
- `data/extracted/sorocaba/camara/gabinete/saida/despesas_gabinete_camara_sorocaba_2024.csv`: csv, rows=242, columns=9, status=ok
- `data/extracted/sorocaba/camara/gabinete/saida/despesas_gabinete_camara_sorocaba_2025.csv`: csv, rows=302, columns=9, status=ok
- `data/extracted/sorocaba/camara/gabinete/saida/despesas_gabinete_camara_sorocaba_2026.csv`: csv, rows=76, columns=9, status=ok
- `data/extracted/sorocaba/camara/ldo/camara_ldo_sorocaba.csv`: csv, rows=5, columns=7, status=ok
- `data/extracted/sorocaba/camara/lrf/camara_lrf_sorocaba.csv`: csv, rows=4, columns=6, status=ok
- `data/extracted/sorocaba/camara/metas/camara_metas_sorocaba.csv`: csv, rows=2, columns=7, status=ok
- `data/extracted/sorocaba/camara/ppa/camara_ppa_sorocaba.csv`: csv, rows=3, columns=6, status=ok
- `data/extracted/sorocaba/camara/prestacao/camara_prestacao_sorocaba.csv`: csv, rows=7, columns=6, status=ok
- `data/extracted/sorocaba/tce/alertas/alertas_sdg_2025_sorocaba.csv`: csv, rows=4, columns=9, status=ok
- `data/extracted/sorocaba/tce/alertas/alertas_sdg_2025_sorocaba.resumo.json`: json, rows=7, columns=None, status=ok
- `data/extracted/sorocaba/tce/alertas/alertas_sorocaba.csv`: csv, rows=7, columns=5, status=ok
- `data/extracted/sorocaba/tce/alertas/alertas_sorocaba.resumo.json`: json, rows=11, columns=None, status=ok
- `data/extracted/sorocaba/tce/contas_anuais/inventario_pdfs_contas_anuais.csv`: csv, rows=318, columns=7, status=ok
- `data/extracted/sorocaba/tce/contas_anuais/inventario_pdfs_contas_anuais.resumo.json`: json, rows=3, columns=None, status=ok
- `data/extracted/sorocaba/tce/inventario_fontes_tce_sorocaba.csv`: csv, rows=15, columns=12, status=ok
- `data/extracted/sorocaba/tce/links_relevantes_tce_sorocaba.csv`: csv, rows=660, columns=4, status=ok
- `data/extracted/sorocaba/tce/resumo_coleta_tce_sorocaba.json`: json, rows=9, columns=None, status=ok
- `data/extracted/sorocaba/tce/transparencia/amostras_api_transparencia.csv`: csv, rows=12, columns=13, status=ok
- `data/extracted/sorocaba/tce/transparencia/amostras_api_transparencia.resumo.json`: json, rows=5, columns=None, status=ok
