---
id: 2026-05-29-claude-para-codex-coleta-massiva-resultado
date: 2026-05-29
agent: Claude Code para Codex
status: active
visibility: public
---

# Handoff - Resultado da coleta massiva Sorocaba (sessao 29/05)

## Resumo executivo

Sessao de coleta intensiva com validacao de todos os dados publicados. Sem erros encontrados
nos CSVs que o site le. Dois bloqueios tecnicos documentados.

## O que foi coletado e esta em data/extracted (pronto para QA)

### Urbes contratos (OCR - NOVO)
- contratos_outros_ocr.csv: 47 PDFs -> 3858 linhas (100% OCR ok)
- contratos_receitas_ocr.csv: 91 PDFs -> 7065 linhas (100% OCR ok)
- contratos_transporte_ocr.csv: 39 PDFs -> 2486 linhas (100% OCR ok)
- Total: 177/177 PDFs, 13409 linhas, campos: numero_contrato, cnpj, valor, data_assinatura
- Path: data/extracted/sorocaba/urbes/

### SICONFI fiscal (16.979 linhas - NOVO)
- rreo_receita_orcamentaria_sorocaba_2020_2025.csv: 2791 linhas (Anexo 01)
- rreo_saude_siconfi_sorocoba_2020_2025.csv: 6778 linhas (Anexo 02)
- rreo_pessoal_siconfi_sorocaba_2020_2025.csv: 1036 linhas (Anexo 06)
- rreo_restos_siconfi_sorocaba_2020_2025.csv: 400 linhas (Anexo 07)
- rreo_receitas_previdenciarias_sorocaba_2020_2025.csv: 2533 linhas (Anexo 03)
- rreo_metas_fiscais_sorocaba_2020_2025.csv: 791 linhas (Anexo 04)
- dca_balanco_orcamentario_sorocaba_2020_2025.csv: 1079 linhas
- dca_demonstrativo_variacao_sorocaba_2020_2025.csv: 1573 linhas
- Path: data/extracted/sorocaba/fiscal/saida/

### SICONFI fiscal publicado hoje em data/public/fiscal/saida/
- rgf_pessoal_sorocaba_2020_2025.csv: 6 linhas (pessoal como % RCL)
- rgf_divida_sorocaba_2020_2025.csv: 6 linhas
- rgf_rcl_sorocaba_2020_2025.csv: 6 linhas (IPTU/ISS/ITBI por ano)
- rgf_rcl_capital_sorocoba_2020_2025.csv: 6 linhas
- rgf_divida_detalhada_sorocaba_2020_2025.csv: 6 linhas
- Estes ja estao em data/public; precisam de pagina no site (Vitruvio)

### FUNSERV (15.243 linhas - NOVO)
- funserv_apr_sorocaba_2020_2026.csv: 71 linhas (mov. financeiras mensais; 66 com valor)
- funserv_atuarial_sorocaba_2015_2025.csv: 1188 linhas (PDFs texto extraido)
- funserv_balanco_previdenciario_ate_2018.csv: 4886 linhas
- funserv_balanco_saude_ate_2018.csv: (similar, path: data/extracted/sorocaba/funserv/)
- funserv_governanca_sorocaba_2019_2026.csv: (extraido)
- NOTA: portal FUNSERV retorna 404 para 2019-2025 balancoes e rentabilidade -> LAI

### Camara documentos orcamentarios (EXPANDIDO)
- camara_prestacao_sorocaba.csv: 7 PDFs (2017-2023), anos=['2017','2018','2019','2020','2021','2022','2023']
- camara_lrf_sorocaba.csv: anos=['2017','2023','2024','2025'] (2018-2022 nao disponíveis no portal)
- camara_ldo_sorocaba.csv: anos=['2017','2024','2025','2026','2027']
- camara_ppa_sorocaba.csv: anos=['2017','2021','2026']
- Path: data/extracted/sorocaba/camara/{prestacao,lrf,ldo,ppa,metas}/

### TCE-SP (ATUALIZADO)
- alertas_sorocaba.csv: 7 alertas (comunicados de inconformidade LRF)
- alertas_sdg_2025_sorocaba.csv: 4 alertas SDG 2025 (bimestres 2/3/4/5)
- links_relevantes_tce_sorocaba.csv: 660 links
- inventario_pdfs_contas_anuais.csv: 318 PDFs inventariados (auditoria)
- Path: data/extracted/sorocaba/tce/

### SAAE pessoal (JA PUBLICADO por Codex)
- saae_pessoal_cargos_amostra_sorocaba_2026.csv em data/public/sorocoba/autarquias/saae/pessoal/
- NOTA: SAAE contratos/despesas/licitacoes/obras capturados como paineis de filtro (nao dados)
  - Requerem interacao especializada no TDAPortal para extrair dados reais

### Rreo Receita publicado hoje em data/public (via Codex)
- camara_documentos_orcamentarios_sorocaba_2017_2027.csv (19 registros, ja em data/public)

## Validacao dos dados publicados (CONFIRMADO SEM ERROS)

Executado verificacao completa dos CSVs lidos pelo site:
- executivo: TOTAL row filtrado corretamente (SKIP_DISPLAY); liquidado 2024=R$5.1bi (OK)
- saude: filtra quadrimestre Q3 corretamente; TOTAL_ROW presente 2020-2025 (OK)
- educacao: idem saude; TOTAL_ROW Q3 presente (OK)
- fornecedores: campos presentes, valores coerentes (2024: R$3.89bi credito)
- empenhos: anos 2020-2025 cobertos, 203k registros estruturados (OK)

## Bloqueios tecnicos confirmados

### Bloqueio 1: Remuneracao servidores municipais Prefeitura de Sorocaba
Portal: transparencia.sorocaba.sp.gov.br (TDAPortal GeneXus, ID 418)
Dado confirmado: 13.661 funcionarios em 2024, filtros por secretaria 2020-2026
Problema: GeneXus carrega dados via multiplas chamadas AJAX encadeadas com sessao temporaria.
Os JSONs capturados (sorocoba_rh_json_1.json e _2.json em data/extracted/sorocoba/execucao/)
tem areas de dados com 12 chars (placeholder vazio). Os dados reais chegam em chamadas
subsequentes que expiram antes da captura.
Resolucao recomendada: spider GeneXus dedicado que intercepte TODAS as requests (incluindo
as menores) e correlacione por AreaId. Ver baixar_saae_dados_abertos.py como referencia de
padrão de interacao com TDAPortal (funciona para SAAE pessoal via page IDs especificos).
Alternativa: LAI formal para relatorio de pessoal (ja tem pedido protocolado).

### Bloqueio 2: FUNSERV balancoes 2019-2025 e rentabilidade
Portal FUNSERV reestruturou e todas as URLs retornam 404.
3 entradas adicionadas ao lai_pedidos.csv em 29/05.

## Proximo passo para Codex (quando limite voltar)

1. Validar os dados coletados (QA): especialmente Urbes OCR (campo contrato/valor/cnpj),
   SICONFI RREO multiplos anexos, FUNSERV APR.
2. Decidir publicacao de cada dataset: cada um precisa gate explicito do usuario.
3. Atualizar lacunas.ts e calc_score.py com itens novos (instrucoes em handoff anterior).
4. Considerar spider GeneXus para remuneracao (ver parametros acima).

## Restricoes (como sempre)
- Sem commit, push, deploy, npm install, publicacao sem gate explicito
- Validacao obrigatoria antes de data/public
