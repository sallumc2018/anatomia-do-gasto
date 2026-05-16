# Notas de Coleta — Sorocaba Grupo B

Investigações realizadas em 2026-05-15 sobre fontes externas ao SICONFI/RREO.

---

## B1 — DCA Câmara Municipal (2020–2021)

**Objetivo:** Verificar se o SICONFI possui dados da Câmara Municipal de Sorocaba
separados da Prefeitura para os anos 2020 e 2021.

**Endpoint investigado:**
```
GET https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca?an_exercicio={ano}&id_ente=3552205
```

**Resultados:**
- DCA 2020: 1796 registros, `instituicao = "Prefeitura Municipal de Sorocaba - SP"` apenas
- DCA 2021: 1863 registros, idem
- DCA 2022: 1896 registros, idem

**Conclusão:**
A Câmara Municipal de Sorocaba **não possui ID SICONFI independente**. O único ente
registrado para o IBGE 3552205 é a Prefeitura (esfera M). Os dados da Câmara não estão
disponíveis via DCA/SICONFI de forma separada.

**Alternativa para LOA da Câmara:**
Valores confirmados via PDFs oficiais:
- LOA 2021: R$ 59.988.000,00
- LOA 2022: R$ 69.213.000,00

**Realizado 2020–2021 da Câmara:**
Não disponível via SICONFI. Disponível em prestações de contas publicadas pela própria
Câmara (Resolução TCE-SP). Coleta requer acesso manual ao portal da Câmara ou pedido via LAI.

**Próximo passo:** Solicitar via LAI ou acessar manualmente o portal
`https://camarasorocaba.sp.gov.br/transparencia/prestacao-de-contas`.

---

## B2 — Verba de Gabinete por Vereador

**Objetivo:** Obter valores individuais de verba de gabinete por vereador para o
mandato 2025–2028, a partir do portal da Câmara Municipal.

**URL investigada:**
```
https://www.camarasorocaba.sp.gov.br/transparencia
```

**Resultado:**
- HTTP 403 Forbidden para todas as rotas testadas:
  - `/transparencia`
  - `/transparencia/remuneracao`
  - `/transparencia/verbas-de-representacao`
  - `/vereadores`
- O site bloqueia requisições programáticas (User-Agent de script)

**Alternativas identificadas:**
1. **Acesso manual via navegador**: O portal publica os dados em HTML, acessíveis
   interativamente. Requer Selenium/Playwright para automação.
2. **Resolução da Câmara**: A Resolução que fixa subsídios e verbas de gabinete para
   a 19ª Legislatura (jan/2025) deve estar publicada no Diário Oficial da Câmara.
3. **LAI**: Pedido formal de informação conforme Lei 12.527/2011.

**Dado já disponível:** Subsídio bruto (R$ 18.900,00 presidente / R$ 18.000,00 demais)
já capturado em `data/public/auditoria/agentes.json`.

**Dado faltante:** Verba de gabinete individual por vereador (valor mensal por parlamentar
para custeio do escritório/assessoria). Estimativa pública: entre R$ 5.000 e R$ 15.000/mês
por vereador (variável conforme Resolução).

**Próximo passo:** Acessar `https://www.camarasorocaba.sp.gov.br/transparencia` via
navegador e capturar os valores de verba de gabinete manualmente ou via Playwright.

---

## B3 — Funcionalismo Municipal (Salários Individuais)

**Objetivo:** Obter dados nominais ou estatísticos de remuneração dos servidores
públicos municipais de Sorocaba.

**URLs investigadas:**
```
https://www.sorocaba.sp.gov.br/transparencia/servidores/   → 404
https://transparencia.sorocaba.sp.gov.br/                  → redireciona para login.aspx
https://transparencia.sorocaba.sp.gov.br/servidores        → requer autenticação
```

**Resultado:**
- Portal `transparencia.sorocaba.sp.gov.br` exige autenticação (login/senha).
- Não é possível acessar dados programaticamente sem credenciais.
- Sem dados de folha individual disponíveis para download público.

**Alternativa já implementada — RGF Anexo 01 (agregado):**
O `extrator_rgf_pessoal.py` já coleta os totais de despesas com pessoal via SICONFI:
- `pessoal_sorocaba_{2020..2025}.csv` em `data/extracted/sorocaba/fiscal/saida/`
- Campos: Pessoal_Bruto, Pessoal_Ativo, Pessoal_Inativo, Pessoal_Liquido, DTP_pct_RCL

**Dado faltante:** Remuneração por servidor/cargo (headcount, média salarial por categoria,
evolução do efetivo). Necessário para análise de composição do funcionalismo.

**Próximas opções:**
1. **LAI (mais confiável):** Pedido formal solicitando planilha de folha de pagamento
   anonimizada por cargo/nível salarial (sem dados nominais, conforme LGPD).
2. **CGU — Portal da Transparência federal:** Verificar se há convênios/repasses que
   incluam dados de pessoal de Sorocaba (improvável para municípios sem repasse federal direto).
3. **RAIS (MTE):** Dados de vínculos empregatícios por município, disponíveis via
   `basedosdados.org` com defasagem de ~2 anos. Útil para série histórica de headcount.

**Dado disponível via RAIS/Base dos Dados:**
Vínculos ativos no setor público municipal em Sorocaba — headcount e massa salarial
com granularidade por CBO. Acesso via BigQuery público (sem login necessário).

---

## Resumo de Cobertura

| Bloco | Dado | Status | Fonte |
|-------|------|--------|-------|
| B1 | LOA Câmara 2021–2022 | **Disponível** | PDFs Câmara |
| B1 | Realizado Câmara 2020–2021 | **Pendente** | LAI ou portal Câmara |
| B2 | Subsídios vereadores | **Disponível** | `agentes.json` (Resolução jan/2025) |
| B2 | Verba de gabinete individual | **Pendente** | Portal Câmara (acesso manual/Playwright) |
| B3 | Despesas pessoal (agregado) | **Disponível** | `pessoal_sorocaba_{ano}.csv` (RGF A01) |
| B3 | Headcount/remuneração individual | **Pendente** | LAI ou RAIS/Base dos Dados |

---

## B4 — Fornecedores e Pagamentos da Prefeitura

**Objetivo:** reconstruir a trilha "quem recebeu dinheiro público" usando os livros
contábeis oficiais da Prefeitura.

**Fonte oficial:**
```
https://fazenda.sorocaba.sp.gov.br/transparencia/
```

**Documentos priorizados:**
- Livro Conta Corrente de Fornecedor
- Livro Registro Analítico da Despesa Orçamentária
- Livro Conta Corrente de Restos a Pagar Analítico por Fornecedor
- Livro Registro de Empenho

**Estado local em 2026-05-15:**
- 2020:
  - fornecedor baixado e extraído: 59.340 registros
  - despesa orçamentária baixada e extraída: 37.133 registros
  - validação local: 37.133/37.133 linhas de despesa com par em fornecedor + nota de empenho
- 2021:
  - fornecedor baixado e extraído: 69.089 registros
  - despesa orçamentária baixada: 941.441.883 bytes
  - SHA256: `c078dbf866ec82883834026c8682e9b80f7fc972a70940d55fd560edf68a00f4`
  - cópia de acervo: `C:\Omega\04_Acervo_Dados\Sorocaba\raw\execucao\livros_contabeis\livro_registro_analitico_despesa_orcamentaria_2021.pdf`
  - despesa orçamentária extraída com parser vertical: 9.365 registros
  - cobertura do PDF: 9.365/9.365 candidatos de data
  - registros com campos de identificação herdados da tabela visual: 4.875
  - extração mecânica, após normalização de identificadores: 9.155/9.365 registros cruzam contra fornecedor + nota de empenho
  - saneamento validado em `data/validated`: 210 registros corrigidos por correspondência única no livro de fornecedores
  - cobertura do CSV saneado contra fornecedor + nota de empenho: 9.365/9.365
  - status: validado localmente em `data/validated`; ainda não publicado em `data/public`
- 2024:
  - fornecedor baixado e extraído: 82.253 registros
  - despesa orçamentária baixada e extraída: 47.597 registros
  - validação local: 47.597/47.597 linhas de despesa com par em fornecedor + nota de empenho

**Arquivos locais:**
- Brutos: `data/raw/sorocaba/execucao/livros_contabeis/{ano}/`
- Extraídos: `data/extracted/sorocaba/execucao/saida/`
- Validação do rastro: `data/manifests/validacao_execucao_sorocaba.csv`
- Validação da agregação: `data/manifests/validacao_fornecedores_agregado_sorocaba.csv`
- Agregados validados: `data/validated/sorocaba/execucao/saida/fornecedores_agregado_sorocaba_{ano}.csv`

**Observações técnicas:**
- `data/raw` e `data/extracted` não são publicação.
- Nenhum dado desta frente foi copiado para `data/public`.
- Os anos 2022 e 2023 têm livros principais acima de 900 MB ou 1,2 GB; a coleta deve ser feita com estratégia de arquivo grande, checkpoint e validação por amostragem antes de extração integral.
- O ranking bruto de fornecedor precisa de curadoria antes de publicação: há entradas de folha, fundos, Prefeitura e movimentações internas que não devem ser tratadas automaticamente como "fornecedor privado".
- Arquivos grandes oficiais estão inventariados em `data/manifests/arquivos_grandes_execucao_sorocaba.csv`.
- O inventário local com tamanho e SHA256 é gerado por `pipelines/inventariar_arquivos_grandes.py`; ele não baixa arquivos.
- A extração fatiada de despesa orçamentária é feita por `pipelines/extrair_despesa_orcamentaria_fatiada.py`, com CSV por lote e checkpoint em `data/extracted`.
- O PDF de despesa orçamentária de 2021 usa layout verticalizado/colunado diferente dos PDFs pequenos. O parser específico é `pipelines/extrator_despesa_orcamentaria_vertical.py`.
- A validação formal do parser vertical é `pipelines/validar_extracao_despesa_vertical.py`; ela grava `data/manifests/validacao_despesa_vertical_sorocaba_2021.csv` e falha intencionalmente enquanto houver divergência impeditiva.
- O saneamento formal da despesa orçamentária é `pipelines/sanear_despesa_orcamentaria.py`; ele grava em `data/validated` e registra método/original dos campos alterados.

**Agregação validada:**
- Script: `pipelines/agregar_fornecedores_execucao.py`
- 2020: 59.340 movimentos agregados em 3.094 recebedores; soma de créditos e débitos bate com o CSV extraído.
- 2024: 82.253 movimentos agregados em 5.060 recebedores; soma de créditos e débitos bate com o CSV extraído.

**Próximo passo:** curar a classificação dos maiores recebedores antes da publicação:
folha, fundo, entidade pública, entidade sem fins lucrativos, empresa privada,
movimentação interna ou a classificar.
