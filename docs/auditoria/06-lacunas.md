# Lacunas e Impossibilidades

Este documento cataloga tudo que **ainda não conseguimos auditar** e o que é **estruturalmente impossível** de rastrear.

## 1. Remuneração Líquida Real

- **Situação:** apenas salário bruto disponível.
- **O que falta:** contracheque detalhado com descontos, vantagens pessoais e benefícios indiretos.
- **Motivo:** portais publicam apenas o bruto. A lei não obriga a divulgação do líquido nominal de agentes políticos.
- **Ação:** pedido de LAI para a Câmara Municipal de Sorocaba solicitando espelho de contracheque dos vereadores.

## 2. Gastos de Gabinete Detalhados

- **Situação:** verba de gabinete publicada como valor global; nomes de assessores e salários individuais nem sempre disponíveis.
- **Motivo:** depende da política de transparência de cada órgão.
- **Ação:** solicitar via LAI a relação nominal de assessores e respectivas remunerações.

## 3. Execução Financeira de Cota Parlamentar (Estadual e Federal)

- **Situação:** teto da cota é conhecido, mas a execução detalhada por município/despesa não é pública na granularidade necessária.
- **Motivo:** sistemas de transparência legislativa publicam dados agregados ou por gabinete, não por localidade do gasto.
- **Ação:** solicitar via LAI às respectivas casas legislativas.

## 4. Vínculos Societários e Familiares (Câmara 2)

- **Situação:** não implementado.
- **Motivo:** requer base de dados de pessoas físicas e jurídicas, além de validação jurídica.
- **Ação:** parceria com UFSCar; enquanto isso, scripts básicos de cruzamento CNPJ × TSE.

## 5. Secretários Municipais

- **Excluídos do escopo por definição.**
- **Motivo:** são cargos comissionados, não eleitos. A auditoria foca em agentes políticos com poder de emenda própria. O orçamento executado pela secretaria é auditado indiretamente via execução orçamentária da saúde.

## 6. Subprefeitos

- **Inexistentes em Sorocaba.**
- **Motivo:** o município não tem subprefeituras. Em expansão futura para outras cidades, serão incluídos.

## 7. Gastos Pessoais do Subsídio

- **Impossibilidade estrutural:** o subsídio é verba de natureza pessoal. A lei não exige que o agente político preste contas de como gasta seu salário.
- **O que fazemos:** registramos o valor bruto recebido. Se houver suspeita de enriquecimento ilícito, isso é competência dos órgãos de controle (MP, TCU), não desta plataforma.

## 8. Atualização em Tempo Real

- **Situação:** dados coletados em ciclos, com defasagem.
- **Motivo:** muitas fontes não oferecem APIs de consulta instantânea; dependem de CSVs atualizados periodicamente.
- **Ação:** migrar para GitHub Actions com coleta diária onde possível; para as demais, registrar a data da última atualização no site.