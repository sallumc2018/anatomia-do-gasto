# Reenvio de Pedidos LAI via Fala.BR / TCE-SP — 2026-07-11

**Contexto:** os 4 pedidos LAI enviados por e-mail direto a `fala.br@sorocaba.sp.gov.br`
em 20/06/2026 (LAI-1 a LAI-4) voltaram todos com resposta padrão em 22/06/2026: desde
28/02/2025 a Prefeitura de Sorocaba só aceita pedidos LAI pelo sistema oficial Fala.BR
(falabr.cgu.gov.br) — e-mail direto não é mais protocolado. O pedido ao TCE-SP também
não avançou: a Ouvidoria pediu abertura de chamado formal no SIC próprio do TCE-SP.
Este documento traz os textos prontos e o passo a passo de reenvio pelos canais corretos.

**Confirmação de que o Fala.BR funciona:** o pedido anterior protocolado por esse canal
(protocolo `03959.2026.000152-74`, dados SEFAZ) foi respondido em 09/06/2026 com 7 PDFs
cobrindo 2020 a maio/2026. O canal entrega dado real quando usado corretamente.

---

## Como enviar — não existe envio em lote

O Fala.BR (e o SIC do TCE-SP) são formulários web, um pedido por vez. Não há importação
em lote nem API pública de peticionamento para cidadão comum — cada manifestação exige
login e preenchimento manual. Não tem como automatizar o envio em si; dá pra otimizar
preparando todos os textos antes (feito abaixo) e enviando os 4 em sequência, na mesma
sessão logada, pra não perder tempo entre um e outro.

### Passo a passo — Fala.BR (LAI-1 a LAI-4, destino: Prefeitura de Sorocaba)

1. Acesse **https://falabr.cgu.gov.br**.
2. Faça login com conta **gov.br** (nível bronze já é suficiente). Sem login não dá pra
   acompanhar o protocolo depois.
3. Clique em **"Registrar Pedido de Acesso à Informação"**.
4. No campo de órgão destinatário, busque **"Prefeitura Municipal de Sorocaba"** (já está
   cadastrada no sistema — foi ela quem respondeu o pedido de 09/06).
5. Cole o texto do pedido no campo **"Descrição do Pedido"** (limite ~2.000 caracteres —
   os 4 textos abaixo já estão dentro do limite).
6. Não precisa anexar arquivo.
7. Envie. O sistema gera um **número de protocolo** (formato `NNNNN.2026.NNNNNN-NN`) —
   anote cada um.
8. Repita para os outros 3 pedidos, no mesmo login.
9. Depois de enviar os 4, me avise os protocolos (ou cole aqui) que eu atualizo
   `data/manifests/lai_pedidos.csv` com data de protocolo, número e status.

### Passo a passo — TCE-SP (LAI-6, dados AUDESP)

1. Acesse **https://www.tce.sp.gov.br/ouvidoria/sic**.
2. Abra um novo chamado / pedido de acesso à informação (não usa Fala.BR, é sistema
   próprio do TCE-SP).
3. Cole o texto do pedido (abaixo).
4. Envie e anote o número de protocolo gerado.

### AGEM Sorocaba — sem ação agora

O pedido enviado em 20/06/2026 para `agemsorocaba@sp.gov.br` ainda não tem resposta.
Está dentro do prazo legal (20 dias corridos + 10 de prorrogação = até ~19/07/2026).
Não precisa reenviar ainda — só reforçar se passar do prazo sem resposta nem
justificativa de prorrogação.

---

## LAI-1 — Sorocaba/Prefeitura — Remuneração de Servidores

Com fundamento na Lei Federal nº 12.527/2011 (LAI) e no Decreto Municipal nº 20.814/2012
de Sorocaba, solicito a disponibilização da folha de pagamento de servidores municipais
efetivos, comissionados, celetistas e estagiários de Sorocaba.

Informações solicitadas, para cada ano do período 2020 a 2026 (ou o mais completo
disponível):

1. Lista de servidores com: nome completo, matrícula, cargo/função, órgão/secretaria,
vínculo (efetivo/comissionado/CLT/estagiário), remuneração bruta, descontos e
remuneração líquida, por mês de competência — em formato CSV ou XLSX (não PDF).

2. Caso o dado nominal completo envolva restrição LGPD para determinadas categorias,
aceita-se como alternativa o total consolidado mensal por secretaria e tipo de vínculo
(sem identificação individual).

Justificativa: esses dados são utilizados para produção de conteúdo de controle social
no portal Anatomia do Gasto (anatomiadogasto.ong.br), de acesso público e gratuito. A
análise de conformidade com o limite de despesa de pessoal da LRF (60% da RCL) requer o
detalhamento por função e vínculo. Os dados do SICONFI disponibilizam apenas
totalizadores; a granularidade da folha é essencial para a análise setorial.

Caso os dados já estejam disponíveis em portal de transparência ativo de Sorocaba,
solicito a indicação da URL de acesso direto.

Atenciosamente,
Alexandre Sallum Cunha
contato@anatomiadogasto.ong.br

*(≈1.150 caracteres)*

---

## LAI-2 — Sorocaba/Prefeitura — Contratos e Aditivos

Com fundamento na Lei Federal nº 12.527/2011, solicito a relação de contratos firmados
pela Prefeitura Municipal de Sorocaba e seus órgãos no período de 2020 a 2026.

Informações solicitadas (por contrato):
- Número do contrato e número do processo licitatório de origem
- Data de assinatura e vigência (início e fim)
- Objeto do contrato (descrição sucinta)
- CNPJ e razão social do contratado
- Valor inicial contratado
- Valor total com aditivos (se houver), com datas dos aditivos
- Secretaria/órgão contratante
- Modalidade licitatória ou fundamento legal de dispensa/inexigibilidade

Formato solicitado: CSV, XLSX ou JSON. Documentos PDF são aceitos como segunda opção
apenas se não houver formato estruturado disponível.

Justificativa: o Portal Nacional de Contratações Públicas (PNCP) cobre contratos
publicados a partir de 01/04/2022 (vigência da Lei nº 14.133/2021). Para construção de
série histórica completa (2020-2026), os contratos de 2020 e 2021 precisam ser obtidos
diretamente do município. O Anatomia do Gasto (anatomiadogasto.ong.br) é portal de
controle social de acesso gratuito que já publica dados de Sorocaba e utiliza esses
dados exclusivamente para fins de transparência pública.

Atenciosamente,
Alexandre Sallum Cunha
contato@anatomiadogasto.ong.br

*(≈1.180 caracteres)*

---

## LAI-3 — Sorocaba/Prefeitura — PPA, LDO, Licitações 2020-2021 e Obras Públicas

Com fundamento na Lei nº 12.527/2011, formulo pedido consolidado sobre planejamento,
licitações históricas e obras em Sorocaba:

Item A — Plano Plurianual (PPA) 2018-2021 e 2022-2025: arquivo estruturado (CSV/XLSX)
contendo programas, ações, metas físicas e financeiras anualizadas de cada PPA. Se
disponível apenas em PDF, solicito indicação da URL de publicação oficial de cada
documento.

Item B — Lei de Diretrizes Orçamentárias (LDO) 2020 a 2026: arquivo estruturado com
metas fiscais e prioridades por exercício, ou URL dos PDFs publicados no Diário Oficial
de Sorocaba para cada LDO.

Item C — Licitações, dispensas e inexigibilidades 2020-2021: relação de processos do
período jan/2020 a mar/2022 com número do processo, modalidade, objeto, valor estimado,
CNPJ do vencedor e resultado. O PNCP (Lei 14.133/2021) cobre apenas a partir de
01/04/2022; os processos anteriores precisam ser obtidos diretamente do município.

Item D — Obras públicas 2020-2026: relação de obras em execução e concluídas com
identificação da obra, endereço/bairro, valor contratado, valor executado até a data,
percentual de conclusão e secretaria responsável.

Formato desejado: CSV, XLSX ou JSON para dados estruturados. PDFs são aceitos como
segunda opção.

Justificativa: o Anatomia do Gasto (anatomiadogasto.ong.br) publica dados públicos de
Sorocaba para fins de controle social. Os itens acima completam o mapeamento de fontes
disponíveis; os dados orçamentários de execução já estão publicados via
SICONFI/Tesouro Nacional.

Atenciosamente,
Alexandre Sallum Cunha
contato@anatomiadogasto.ong.br

*(≈1.550 caracteres)*

---

## LAI-4 — Sorocaba/Prefeitura — Receita e Despesa Extraorçamentária

Com fundamento na Lei nº 12.527/2011, solicito os seguintes registros analíticos
extraorçamentários de Sorocaba:

1. Registro analítico de receita extraorçamentária (2020 a 2026): lançamentos por
natureza contábil, data, valor e unidade gestora responsável — formato CSV ou XLSX.

2. Registro analítico de despesa extraorçamentária (2020 a 2026): lançamentos por
natureza (retenções de INSS, ISS, IRRF, cauções, depósitos em garantia etc.), data,
valor e fornecedor de origem — formato CSV ou XLSX.

Justificativa: esses registros são necessários para reconciliação da execução
financeira com o fluxo de caixa declarado nos demonstrativos do SICONFI (RREO Anexos 1
e 2). A receita e despesa extraorçamentária movimentam recursos que não aparecem nos
demonstrativos orçamentários; sem eles, a análise de transparência fiscal fica
incompleta. O dado é produzido no sistema contábil municipal e não está disponível nos
portais públicos atuais de Sorocaba.

Atenciosamente,
Alexandre Sallum Cunha
contato@anatomiadogasto.ong.br

*(≈1.020 caracteres)*

---

## LAI-6 — TCE-SP — Dados AUDESP de Sorocaba (canal: SIC próprio, não Fala.BR)

Com fundamento na Lei nº 12.527/2011 e na Resolução SDG-51/2020 (dados abertos TCE-SP),
solicito:

Informações solicitadas: os dados estruturados transmitidos pelo Município de Sorocaba
ao sistema AUDESP nos exercícios de 2020 a 2025, especificamente:

1. Tabelas de empenhos, liquidações e pagamentos consolidadas por exercício (módulo
Execução Orçamentária)
2. Tabelas de receita arrecadada (módulo Receitas)
3. Balancetes mensais de receita e despesa

Formato: estruturado (CSV, XML ou JSON) conforme disponível no sistema AUDESP. Não é
necessário conteúdo de auditoria — apenas os dados de execução transmitidos pelo ente
municipal.

Justificativa: o portal AUDESP (transparencia.tce.sp.gov.br) não disponibiliza os dados
de submissão municipal em formato aberto para consulta pública, apenas em dashboards
agregados. Os dados já são transmitidos obrigatoriamente pelo município; o TCE-SP atua
como custodiante e pode disponibilizá-los. O Anatomia do Gasto (anatomiadogasto.ong.br)
é portal público de controle social de acesso gratuito.

Atenciosamente,
Alexandre Sallum Cunha
contato@anatomiadogasto.ong.br

*(≈1.130 caracteres — inclui a ressalva de que já consultei o Portal de Transparência
Municipal do TCESP e o dado não está lá em formato aberto, respondendo de antemão à
sugestão que a Ouvidoria já deu)*

---

## Depois de enviar

Me passe os protocolos gerados (Fala.BR e TCE-SP) que eu registro em
`data/manifests/lai_pedidos.csv` com data de protocolo e status `protocolado`, e atualizo
o `STATUS.md` do projeto.
