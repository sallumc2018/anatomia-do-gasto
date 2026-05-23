# Operacao Sorocaba 100

Data de referencia: 2026-05-23.

Objetivo: fechar Sorocaba primeiro como 100% auditavel, depois preservar
brutos disponiveis e so entao preparar publicacao mediante validacao e
autorizacao explicita.

## Artefatos gerados

- Manifesto auditavel: `data/manifests/sorocaba_100_auditavel.csv`
- Pedidos LAI preparados: `docs/lai-sorocaba-100.md`
- Fonte base: `data/manifests/inventario_fontes_sorocaba.csv`
- Log de execucao inicial: `data/manifests/sorocaba_100_execucao_2026-05-21.csv`

## Resumo

- Fontes inventariadas: 55
- Status auditavel: {'coletado_pendente_validacao': 2, 'lai_necessario': 20, 'parcial': 30, 'publicado': 3}
- Prioridades: {'alta': 28, 'baixa': 1, 'critica': 17, 'media': 9}
- Frentes criticas nao publicadas: 16

## Gates

- Nao gravar em `data/public` sem autorizacao explicita.
- Usar `ANATOMIA_RAW_ROOT` para brutos grandes.
- Registrar bloqueio quando API, Playwright ou fonte oficial falhar.
- Dados ausentes permanecem ausentes; nao converter ausencia em zero.

## Ordem operacional

1. Rodar coleta bruta apenas das fontes com `script_existente` diferente de `a_criar`.
2. Atualizar manifests de coleta com tamanho, data, origem, metodo e bloqueio.
3. Validar semanticamente cada serie antes de qualquer promocao.
4. Preparar publicacao por lote, com `verificar_publicacao.py --strict` e `check-scope-gates.py`.

## Frentes criticas nao publicadas

- Prefeitura / despesa / registro_analitico_despesa_orcamentaria: parcial; pipelines/extrator_despesa_orcamentaria.py; baixar_2021_2023_e_normalizar
- Prefeitura / fornecedores / conta_corrente_fornecedor: parcial; pipelines/agregar_fornecedores_execucao.py; baixar_2021_2023_e_publicar_apos_validacao
- Prefeitura / fornecedores / conta_corrente_restos_a_pagar_por_fornecedor: parcial; pipelines/agregar_restos_a_pagar.py; baixar_e_extrair
- Prefeitura / obras / obras_publicas: lai_necessario; pipelines/baixar_pncp_sorocaba.py; inventariar_e_cruzar_contratos
- Prefeitura / contratos / contratos_e_aditivos: lai_necessario; pipelines/baixar_pncp_sorocaba.py; inventariar_links_e_campos
- SICONFI / contabilidade / msc: lai_necessario; a_criar; verificar_disponibilidade_sorocaba
- Portal_Transparencia_Federal / transferencias / transferencias_para_sorocaba: parcial; pipelines/baixar_transferencias_federais.py; coletar_por_ente_e_cnpj
- PNCP / compras / licitacoes_contratos_atas: parcial; pipelines/baixar_pncp_sorocaba.py; coletar_por_cnpj_e_termos
- Camara / contratos / contratos_despesas_gabinete: parcial; pipelines/baixar_camara_playwright.py; inventariar_contratos_e_despesas
- Urbes / transporte / relacao_mensal_despesas: parcial; pipelines/baixar_urbes_transparencia.py; baixar_e_extrair
- Urbes / transporte / remuneracao_transporte_publico: parcial; pipelines/baixar_urbes_playwright.py; extrair_series
- Urbes / transporte / contratos_concessao_transporte: parcial; pipelines/baixar_urbes_playwright.py; baixar_contratos_e_aditivos
- SAAE / saneamento / receitas_despesas: parcial; pipelines/baixar_saae_dados_abertos.py; inventariar_downloads
- SAAE / saneamento / licitacoes_contratos_obras: parcial; pipelines/baixar_saae_dados_abertos.py; inventariar_e_cruzar_pncp
- FUNSERV / previdencia / balancos_receitas_despesas: parcial; pipelines/baixar_funserv.py; inventariar_downloads
- FUNSERV / previdencia / avaliacao_atuarial: parcial; pipelines/baixar_funserv.py; baixar_series
