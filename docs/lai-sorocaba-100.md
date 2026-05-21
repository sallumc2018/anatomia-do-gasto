# Pedidos LAI - Sorocaba 100

Data de referencia: 2026-05-21.

Este arquivo prepara pedidos de acesso a informacao para fontes que ainda nao
possuem prova completa de disponibilidade publica no projeto. Ele nao registra
protocolo real; apos envio, registrar numero, data e resposta no manifesto.

Modelo base:

```text
Solicito, com fundamento na Lei 12.527/2011, acesso em formato aberto
CSV, XLSX ou JSON, ou alternativamente PDF pesquisavel, aos dados abaixo
referentes ao municipio de Sorocaba/SP no periodo de 2020 a 2026.
Solicito tambem dicionario de campos, data de atualizacao e fonte primaria.
```

## Prefeitura - orcamento - ppa

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: ppa (orcamento)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Inventario de links por ano ainda precisa ser confirmado no portal; coletor dedicado nao existe.
- Proximo passo apos resposta: inventariar_links_por_ano

Texto especifico:

```text
Solicito os dados de ppa relativos a orcamento de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - orcamento - ldo

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: ldo (orcamento)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Inventario de links por ano ainda precisa ser confirmado no portal; coletor dedicado nao existe.
- Proximo passo apos resposta: inventariar_links_por_ano

Texto especifico:

```text
Solicito os dados de ldo relativos a orcamento de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - orcamento - loa

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: loa (orcamento)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario oficial e roadmap Sorocaba 100
- Bloqueio atual: Extracao de programas, acoes e valores ainda nao esta fechada; coletor dedicado nao existe.
- Proximo passo apos resposta: extrair_programas_acoes_e_valores

Texto especifico:

```text
Solicito os dados de loa relativos a orcamento de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - receita - registro_analitico_receita_orcamentaria

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: registro_analitico_receita_orcamentaria (receita)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: O extrator_receita.py cobre RREO agregado; registro analitico municipal ainda nao tem extrator dedicado.
- Proximo passo apos resposta: baixar_e_extrair

Texto especifico:

```text
Solicito os dados de registro_analitico_receita_orcamentaria relativos a receita de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - receita - registro_analitico_receita_extraorcamentaria

- Prioridade: media
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: registro_analitico_receita_extraorcamentaria (receita)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem extrator dedicado no repo.
- Proximo passo apos resposta: baixar_e_extrair

Texto especifico:

```text
Solicito os dados de registro_analitico_receita_extraorcamentaria relativos a receita de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - receita - balancetes_receita

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: balancetes_receita (receita)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Fonte mensal ainda nao mapeada por link.
- Proximo passo apos resposta: inventariar_links_por_mes

Texto especifico:

```text
Solicito os dados de balancetes_receita relativos a receita de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - despesa - registro_analitico_despesa_orcamentaria

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: registro_analitico_despesa_orcamentaria (despesa)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario oficial e roadmap Sorocaba 100
- Bloqueio atual: Dados publicados ate 2025; 2026 depende de fonte anual.
- Proximo passo apos resposta: baixar_2021_2023_e_normalizar

Texto especifico:

```text
Solicito os dados de registro_analitico_despesa_orcamentaria relativos a despesa de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - despesa - registro_analitico_despesa_extraorcamentaria

- Prioridade: media
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: registro_analitico_despesa_extraorcamentaria (despesa)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem extrator dedicado no repo.
- Proximo passo apos resposta: baixar_e_extrair

Texto especifico:

```text
Solicito os dados de registro_analitico_despesa_extraorcamentaria relativos a despesa de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - fornecedores - conta_corrente_fornecedor

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: conta_corrente_fornecedor (fornecedores)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario oficial e roadmap Sorocaba 100
- Bloqueio atual: Dados publicados ate 2025; 2026 depende de fonte anual.
- Proximo passo apos resposta: baixar_2021_2023_e_publicar_apos_validacao

Texto especifico:

```text
Solicito os dados de conta_corrente_fornecedor relativos a fornecedores de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - fornecedores - conta_corrente_restos_a_pagar_por_fornecedor

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: conta_corrente_restos_a_pagar_por_fornecedor (fornecedores)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Dados publicados ate 2025; 2026 depende de fonte anual.
- Proximo passo apos resposta: baixar_e_extrair

Texto especifico:

```text
Solicito os dados de conta_corrente_restos_a_pagar_por_fornecedor relativos a fornecedores de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - bancario - conta_corrente_bancario

- Prioridade: media
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: conta_corrente_bancario (bancario)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: avaliar_campos_publicaveis

Texto especifico:

```text
Solicito os dados de conta_corrente_bancario relativos a bancario de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - contabilidade - livro_caixa

- Prioridade: media
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: livro_caixa (contabilidade)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: baixar_para_validacao_cruzada

Texto especifico:

```text
Solicito os dados de livro_caixa relativos a contabilidade de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - contabilidade - livro_diario

- Prioridade: media
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: livro_diario (contabilidade)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: baixar_para_validacao_cruzada

Texto especifico:

```text
Solicito os dados de livro_diario relativos a contabilidade de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - contabilidade - livro_razao

- Prioridade: media
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: livro_razao (contabilidade)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: baixar_para_validacao_cruzada

Texto especifico:

```text
Solicito os dados de livro_razao relativos a contabilidade de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - fiscal - rreo

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: rreo (fiscal)
- Formato desejado: pdf_api em formato aberto quando disponivel
- Evidencia local: inventario oficial e roadmap Sorocaba 100
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: cruzar_portal_local_com_siconfi

Texto especifico:

```text
Solicito os dados de rreo relativos a fiscal de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - fiscal - rgf

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: rgf (fiscal)
- Formato desejado: pdf_api em formato aberto quando disponivel
- Evidencia local: inventario oficial e roadmap Sorocaba 100
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: cruzar_portal_local_com_siconfi

Texto especifico:

```text
Solicito os dados de rgf relativos a fiscal de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - saude - relatorios_lrf_saude

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: relatorios_lrf_saude (saude)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: data/public e data/manifests/datasets.csv
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: manter_atualizacao

Texto especifico:

```text
Solicito os dados de relatorios_lrf_saude relativos a saude de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - educacao - relatorios_aplicacao_ensino

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: relatorios_aplicacao_ensino (educacao)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: data/public e data/manifests/datasets.csv
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: manter_atualizacao

Texto especifico:

```text
Solicito os dados de relatorios_aplicacao_ensino relativos a educacao de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - obras - obras_publicas

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: obras_publicas (obras)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Obras exigem cruzamento por objeto e TCE-SP; se portal municipal nao publicar lista completa, preparar LAI.
- Proximo passo apos resposta: inventariar_e_cruzar_contratos

Texto especifico:

```text
Solicito os dados de obras_publicas relativos a obras de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - contratos - contratos_e_aditivos

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: contratos_e_aditivos (contratos)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Contratos pre-PNCP precisam do portal municipal ou LAI.
- Proximo passo apos resposta: inventariar_links_e_campos

Texto especifico:

```text
Solicito os dados de contratos_e_aditivos relativos a contratos de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - compras - licitacoes

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: licitacoes (compras)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Licitacoes pre-PNCP precisam do portal municipal ou LAI.
- Proximo passo apos resposta: inventariar_e_cruzar_pncp

Texto especifico:

```text
Solicito os dados de licitacoes relativos a compras de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - atos - jornal_oficial

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://noticias.sorocaba.sp.gov.br/jornal-do-municipio/
- Dado solicitado: jornal_oficial (atos)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem coletor dedicado no repo.
- Proximo passo apos resposta: criar_indice_por_data_e_assunto

Texto especifico:

```text
Solicito os dados de jornal_oficial relativos a atos de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - pessoal - remuneracao_servidores

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: remuneracao_servidores (pessoal)
- Formato desejado: html_csv_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Pode exigir decisao de publicabilidade e minimizacao.
- Proximo passo apos resposta: inventariar_formato_e_campos

Texto especifico:

```text
Solicito os dados de remuneracao_servidores relativos a pessoal de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Prefeitura - precatórios - precatorios

- Prioridade: media
- Periodo: 2020-2026
- Fonte inicial: https://fazenda.sorocaba.sp.gov.br/transparencia/
- Dado solicitado: precatorios (precatórios)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: inventariar_e_cruzar_rgf

Texto especifico:

```text
Solicito os dados de precatorios relativos a precatórios de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## SICONFI - contabilidade - msc

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://www.gov.br/conecta/catalogo/apis/siconfi-extratos-das-declaracoes-contabeis
- Dado solicitado: msc (contabilidade)
- Formato desejado: api em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem coletor MSC dedicado no repo.
- Proximo passo apos resposta: verificar_disponibilidade_sorocaba

Texto especifico:

```text
Solicito os dados de msc relativos a contabilidade de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## SIOPE - educacao - receitas_despesas_educacao

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope/relatorios-municipais
- Dado solicitado: receitas_despesas_educacao (educacao)
- Formato desejado: sistema em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: baixar_relatorios_sorocaba

Texto especifico:

```text
Solicito os dados de receitas_despesas_educacao relativos a educacao de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## FNDE - educacao - repasses_programas

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://www.gov.br/fnde/pt-br
- Dado solicitado: repasses_programas (educacao)
- Formato desejado: sistema em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: mapear_pdde_pnae_pnate_fundeb

Texto especifico:

```text
Solicito os dados de repasses_programas relativos a educacao de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Portal_Transparencia_Federal - transferencias - transferencias_para_sorocaba

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://portaldatransparencia.gov.br/transferencias
- Dado solicitado: transferencias_para_sorocaba (transferencias)
- Formato desejado: api_html em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Requer PORTAL_TRANSPARENCIA_KEY ativa.
- Proximo passo apos resposta: coletar_por_ente_e_cnpj

Texto especifico:

```text
Solicito os dados de transferencias_para_sorocaba relativos a transferencias de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## PNCP - compras - licitacoes_contratos_atas

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://www.gov.br/pncp/pt-br
- Dado solicitado: licitacoes_contratos_atas (compras)
- Formato desejado: api em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Coletar em janelas pequenas para evitar rate limit.
- Proximo passo apos resposta: coletar_por_cnpj_e_termos

Texto especifico:

```text
Solicito os dados de licitacoes_contratos_atas relativos a compras de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Camara - pessoal - subsidios_e_remuneracao

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://www.camarasorocaba.sp.gov.br/
- Dado solicitado: subsidios_e_remuneracao (pessoal)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario oficial e roadmap Sorocaba 100
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: validar_subsidios_e_beneficios

Texto especifico:

```text
Solicito os dados de subsidios_e_remuneracao relativos a pessoal de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Camara - contratos - contratos_despesas_gabinete

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://www.camarasorocaba.sp.gov.br/
- Dado solicitado: contratos_despesas_gabinete (contratos)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Contratos e demais despesas ainda precisam ser separados de gabinete.
- Proximo passo apos resposta: inventariar_contratos_e_despesas

Texto especifico:

```text
Solicito os dados de contratos_despesas_gabinete relativos a contratos de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Camara - legislativo - projetos_leis_votacoes

- Prioridade: alta
- Periodo: 2020-2026
- Fonte inicial: https://sorocaba.camarasempapel.com.br/
- Dado solicitado: projetos_leis_votacoes (legislativo)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario oficial e roadmap Sorocaba 100
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: indexar_materias_com_impacto_fiscal

Texto especifico:

```text
Solicito os dados de projetos_leis_votacoes relativos a legislativo de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Camara - emendas - emendas_impositivas

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://servicos.sorocaba.sp.gov.br/cepa_publico/#/emendas
- Dado solicitado: emendas_impositivas (emendas)
- Formato desejado: html em formato aberto quando disponivel
- Evidencia local: coleta operacional detectada em data/extracted/sorocaba/cepa/saida/cepa_manifest_coleta.json; ainda nao publicada
- Bloqueio atual: Coleta interna existente precisa validacao semantica antes de publicar.
- Proximo passo apos resposta: mapear_autor_destino_empenho_pagamento

Texto especifico:

```text
Solicito os dados de emendas_impositivas relativos a emendas de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Urbes - transporte - relacao_mensal_despesas

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://www.urbes.com.br/transparencia/index
- Dado solicitado: relacao_mensal_despesas (transporte)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Normalizacao pendente.
- Proximo passo apos resposta: baixar_e_extrair

Texto especifico:

```text
Solicito os dados de relacao_mensal_despesas relativos a transporte de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Urbes - transporte - remuneracao_transporte_publico

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://www.urbes.com.br/transparencia/index
- Dado solicitado: remuneracao_transporte_publico (transporte)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Extrair serie mensal antes de publicar.
- Proximo passo apos resposta: extrair_series

Texto especifico:

```text
Solicito os dados de remuneracao_transporte_publico relativos a transporte de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## Urbes - transporte - contratos_concessao_transporte

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://urbes.com.br/transparencia/contratos-transporte
- Dado solicitado: contratos_concessao_transporte (transporte)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Baixar contratos e aditivos, depois cruzar com pagamentos.
- Proximo passo apos resposta: baixar_contratos_e_aditivos

Texto especifico:

```text
Solicito os dados de contratos_concessao_transporte relativos a transporte de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## SAAE - saneamento - receitas_despesas

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://www.saaesorocaba.com.br/transparencia/
- Dado solicitado: receitas_despesas (saneamento)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Requer Playwright e captura do endpoint de dados abertos.
- Proximo passo apos resposta: inventariar_downloads

Texto especifico:

```text
Solicito os dados de receitas_despesas relativos a saneamento de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## SAAE - saneamento - licitacoes_contratos_obras

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://www.saaesorocaba.com.br/transparencia/
- Dado solicitado: licitacoes_contratos_obras (saneamento)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Requer Playwright e normalizacao semantica.
- Proximo passo apos resposta: inventariar_e_cruzar_pncp

Texto especifico:

```text
Solicito os dados de licitacoes_contratos_obras relativos a saneamento de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## FUNSERV - previdencia - balancos_receitas_despesas

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://funservsorocaba.sp.gov.br/transparencia/portal-da-transpar%C3%AAncia
- Dado solicitado: balancos_receitas_despesas (previdencia)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Normalizacao pendente.
- Proximo passo apos resposta: inventariar_downloads

Texto especifico:

```text
Solicito os dados de balancos_receitas_despesas relativos a previdencia de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## FUNSERV - previdencia - avaliacao_atuarial

- Prioridade: critica
- Periodo: 2020-2026
- Fonte inicial: https://www.funservsorocaba.sp.gov.br/administracao-e-planejamento/transparencia-publica/avaliacao-atuarial
- Dado solicitado: avaliacao_atuarial (previdencia)
- Formato desejado: pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Extrair serie atuarial antes de publicar.
- Proximo passo apos resposta: baixar_series

Texto especifico:

```text
Solicito os dados de avaliacao_atuarial relativos a previdencia de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```

## AGEM - metropolitano - receitas_despesas

- Prioridade: baixa
- Periodo: 2020-2026
- Fonte inicial: https://www.agemsorocaba.sp.gov.br/habit_ag_sorocaba/transparencia/receitas%20e%20despesas
- Dado solicitado: receitas_despesas (metropolitano)
- Formato desejado: html_pdf em formato aberto quando disponivel
- Evidencia local: inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade
- Bloqueio atual: Sem automacao dedicada no repo.
- Proximo passo apos resposta: verificar_relacao_com_sorocaba

Texto especifico:

```text
Solicito os dados de receitas_despesas relativos a metropolitano de Sorocaba/SP,
com cobertura de 2020 a 2026, contendo no minimo identificador do registro,
data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,
fonte original e eventuais documentos vinculados. Caso a informacao nao exista
ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e
do orgao responsavel pela guarda do dado.
```
