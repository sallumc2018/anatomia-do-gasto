# Roadmap Sorocaba 100%

Este documento mostra onde estamos, onde queremos chegar e o que falta fazer para o Anatomia do Gasto cobrir o máximo oficialmente disponível sobre o dinheiro público ligado a Sorocaba.

## Objetivo final

Transformar todo dado financeiro oficial, rastreável e legalmente publicável sobre Sorocaba em:

1. dado bruto preservado;
2. dado extraído;
3. dado validado;
4. dado publicado;
5. página clara no site;
6. resposta encontrável pelo usuário e pelo Théo.

## Regras de trabalho

- `data/raw`: fonte bruta oficial baixada, nunca publicada diretamente.
- `data/extracted`: extração mecânica, ainda não publicada.
- `data/validated`: dado conferido localmente, ainda não publicado automaticamente.
- `data/public`: única fonte que o site pode ler.
- Dado ausente não é zero.
- Toda página precisa mostrar fonte, período, escopo, limitação e última atualização.
- Nenhum arquivo grande entra no Git.
- Nenhum dado novo entra em `data/public` sem validação local e decisão explícita.

## Onde estamos

| Frente | Estado atual | Evidência |
|---|---|---|
| Saúde | Publicado 2020-2025 | `data/public/sorocaba/saude` |
| Educação | Publicado 2020-2025 | `data/public/sorocaba/educacao` |
| Segurança | Publicado 2020-2025 | `data/public/sorocaba/seguranca` |
| Transporte | Publicado 2020-2025, com limitação de subfunção | `data/public/sorocaba/transporte` |
| Orçamento por função | Publicado 2020-2025 | `data/public/sorocaba/executivo` |
| Receita agregada | Publicado 2020-2025 | `data/public/sorocaba/receita` |
| Saúde fiscal | Publicado 2020-2025 | `data/public/sorocaba/fiscal` |
| Fornecedores Prefeitura | 2020, 2021 e 2024 extraídos e validados localmente; 2021 saneado em `data/validated`, ainda não publicado | `data/manifests/validacao_execucao_sorocaba.csv` |
| Fornecedores agregados | 2020 e 2024 agregados em `data/validated`; ainda não publicados | `data/manifests/validacao_fornecedores_agregado_sorocaba.csv` |
| Arquivos grandes | 13 arquivos inventariados; nenhum baixado automaticamente | `data/manifests/arquivos_grandes_execucao_sorocaba.csv` |
| Fontes oficiais | 55 itens inventariados | `data/manifests/inventario_fontes_sorocaba.csv` |
| Auditoria de cobertura | 216 arquivos locais mapeados; 124 publicados; 71 extraídos não publicados | `data/manifests/auditoria_cobertura_sorocaba.csv` |
| Théo | Guia local determinístico criado; IA externa ainda não implementada | botão global no site e bloco `/#theo` |

## Mapa das trilhas

### 1. Dinheiro que entra

Perguntas que precisa responder:

- Quanto Sorocaba arrecadou?
- Quanto veio de impostos próprios?
- Quanto veio da União?
- Quanto veio do Estado?
- Quanto veio de convênios, emendas e transferências especiais?

Checklist:

- [x] Receita agregada via SICONFI/RREO 2020-2025.
- [ ] Balancetes mensais de receita da Prefeitura.
- [ ] Registro analítico da receita orçamentária.
- [ ] Transferências federais por Portal da Transparência Federal.
- [ ] FNS/SUS por repasse.
- [ ] FNDE/SIOPE por programa.
- [ ] ICMS/IPVA e repasses estaduais.
- [ ] Página consolidada: "De onde vem o dinheiro".
- [ ] Théo responde: "Quanto entrou em Sorocaba em um ano?".

Critério de pronto:

- Totais anuais batem entre fonte local, SICONFI e fonte setorial quando houver.
- Toda diferença fica documentada.

### 2. Dinheiro autorizado e gasto

Perguntas que precisa responder:

- Para onde foi o dinheiro?
- O orçamento aprovado foi executado?
- Quanto foi empenhado, liquidado e pago?
- Quais áreas cresceram ou caíram?

Checklist:

- [x] Orçamento por função 2020-2025.
- [x] Execução por saúde, educação, segurança e transporte.
- [x] Despesa orçamentária 2020 e 2024 extraída e validada com fornecedor.
- [ ] Despesa orçamentária 2022 e 2023, com arquivos grandes; 2021 extraído e validado localmente em `data/validated`.
- [ ] Registro de empenhos.
- [ ] Despesa extraorçamentária.
- [ ] Restos a pagar.
- [ ] Página consolidada: "O dinheiro foi autorizado ou pago?".
- [ ] Théo explica diferença entre dotação, empenho, liquidação e pagamento.

Critério de pronto:

- Cada linha de despesa publicada precisa ter ano, fonte, fase da despesa, classificação e limitação clara.

### 3. Quem recebeu dinheiro público

Perguntas que precisa responder:

- Quem recebeu?
- Quanto recebeu?
- Por qual órgão?
- Em qual ano?
- É folha, fundo público, entidade, empresa ou movimentação interna?

Checklist:

- [x] Conta corrente fornecedor 2020 extraída.
- [x] Conta corrente fornecedor 2021 extraída.
- [x] Conta corrente fornecedor 2024 extraída.
- [x] Agregação validada 2020 e 2024.
- [ ] Conta corrente fornecedor 2022 e 2023.
- [ ] Restos a pagar por fornecedor 2021-2024.
- [ ] Curadoria dos maiores recebedores.
- [ ] Classificação: folha, fundo, ente público, entidade sem fins lucrativos, empresa privada, movimentação interna, a classificar.
- [ ] Página: "Quem recebeu".
- [ ] Busca por fornecedor.
- [ ] Théo responde: "Quem recebeu dinheiro público?".

Critério de pronto:

- Ranking não pode misturar folha, fundos e fornecedores privados sem etiqueta clara.
- Todo recebedor relevante precisa ter fonte e ano.

### 4. Compras, contratos e licitações

Perguntas que precisa responder:

- Qual contrato existe?
- Quem venceu?
- Quanto era o valor inicial?
- Teve aditivo?
- Foi pago quanto?
- Está ligado a qual despesa?

Checklist:

- [ ] Inventariar contratos da Prefeitura.
- [ ] Inventariar licitações da Prefeitura.
- [ ] Coletar PNCP por CNPJ/órgão/termos.
- [ ] Cruzar contrato com empenho, liquidação e pagamento.
- [ ] Separar contrato ativo, encerrado, aditado e cancelado.
- [ ] Página: "Contratos".
- [ ] Théo responde: "Esse contrato foi pago?".

Critério de pronto:

- Contrato publicado precisa ter objeto, fornecedor, vigência, valor e fonte.

### 5. Obras

Perguntas que precisa responder:

- Quais obras existem?
- Quanto custam?
- Quem executa?
- Quanto já foi pago?
- Estão atrasadas?

Checklist:

- [ ] Inventariar obras públicas da Prefeitura.
- [ ] Cruzar obras com contratos.
- [ ] Cruzar contratos com empenhos e pagamentos.
- [ ] Buscar obras no TCE-SP e PNCP.
- [ ] Página: "Obras".
- [ ] Théo responde: "Quanto custou essa obra?".

Critério de pronto:

- Não publicar situação de obra sem data de consulta e fonte.

### 6. Câmara e vereadores

Perguntas que precisa responder:

- Quanto custa a Câmara?
- Quanto ganha cada vereador?
- Quanto custa cada gabinete?
- Quais emendas cada vereador indicou?
- O dinheiro da emenda foi pago?

Checklist:

- [x] Página inicial da Câmara.
- [x] Subsídios principais mapeados.
- [ ] Orçamento e execução detalhada da Câmara.
- [ ] Contratos da Câmara.
- [ ] Despesas de gabinete.
- [ ] Emendas impositivas por vereador.
- [ ] Cruzar emenda com empenho, liquidação e pagamento.
- [ ] Página: "Vereadores e emendas".
- [ ] Théo responde: "O que meu vereador fez com dinheiro público?".

Critério de pronto:

- Separar subsídio, verba de gabinete, contrato, emenda e produção legislativa.

### 7. Autarquias e empresas públicas

Órgãos prioritários:

- Urbes;
- SAAE;
- FUNSERV;
- AGEM, somente no que tiver relação clara com Sorocaba.

Checklist:

- [ ] Urbes: relação mensal de despesas.
- [ ] Urbes: contratos de transporte.
- [ ] Urbes: remuneração do transporte público.
- [ ] SAAE: receitas, despesas, contratos e obras.
- [ ] FUNSERV: balanços, avaliação atuarial, investimentos e despesas.
- [ ] AGEM: verificar se há dado diretamente ligado a Sorocaba.
- [ ] Páginas específicas ou cards dentro de "Serviços".

Critério de pronto:

- Cada órgão precisa ter escopo próprio, para não misturar com a Prefeitura.

### 8. Controle externo e validação

Perguntas que precisa responder:

- O TCE-SP apontou problemas?
- As contas foram aprovadas?
- Houve alerta fiscal?
- O dado local bate com fonte independente?

Checklist:

- [ ] TCE-SP: contas, pareceres e alertas.
- [ ] AUDESP: dados enviados ao Tribunal.
- [ ] SICONFI: RREO/RGF/DCA/MSC.
- [ ] SIOPS e SIOPE como validação setorial.
- [ ] Página: "Auditoria dos dados".
- [ ] Théo informa grau de confiança e lacunas.

Critério de pronto:

- Nenhuma análise sensível sem fonte independente ou declaração explícita de limitação.

## Checklist operacional por fase

### Fase 1 — preservar

- [x] Inventário de fontes oficiais.
- [x] Manifesto de arquivos grandes.
- [x] Downloader com proteção contra arquivo grande.
- [x] Download em streaming para `.part`.
- [x] Inventário local de tamanho/SHA256.
- [x] Definir pasta de backup fora do repo para PDFs grandes.
- [x] Baixar primeiro arquivo grande crítico: despesa orçamentária 2021.
- [x] Gerar SHA256 após download.

### Fase 2 — extrair

- [x] Extrator fornecedor.
- [x] Extrator despesa orçamentária.
- [x] Extrator fatiado com checkpoint para despesa grande.
- [x] Testar extração no PDF grande de 2021.
- [x] Calibrar parser vertical de 2021 para cobrir todos os candidatos de data do PDF.
- [x] Juntar lotes fatiados não se aplica ao parser vertical integral de 2021.
- [x] Sanear divergências de 2021 contra fornecedor + empenho em `data/validated`.
- [x] Validar contagem e cobertura do PDF.

### Fase 3 — validar

- [x] Validação 2020 fornecedor + despesa.
- [x] Validação 2024 fornecedor + despesa.
- [x] Agregação validada 2020 e 2024.
- [x] Matriz local de cobertura de PDFs, CSVs, JSONs e manifests.
- [x] Todos os arquivos em `data/public` têm padrão registrado em `data/manifests/datasets.csv`.
- [ ] Curadoria dos maiores recebedores.
- [ ] Classificação dos recebedores.
- [ ] Comparar totais com SICONFI/RREO.
- [ ] Registrar divergências.

### Fase 4 — publicar

- [ ] Copiar somente dados aprovados para `data/public`.
- [ ] Atualizar `data/manifests/datasets.csv`.
- [ ] Criar página "Quem recebeu".
- [ ] Criar página "Contratos".
- [ ] Criar página "Obras".
- [ ] Adicionar perguntas correspondentes na home.
- [ ] Ensinar o Théo a apontar para essas páginas.

### Fase 5 — cobrar lacunas

- [ ] Gerar lista de dados não localizados.
- [ ] Preparar pedidos e-SIC/LAI.
- [ ] Preparar pedidos à Câmara, Urbes, SAAE e FUNSERV.
- [ ] Registrar data de consulta e resposta.
- [ ] Publicar página "Lacunas conhecidas".

## Próximas 10 ações recomendadas

1. Definir uma pasta de acervo fora do repo para PDFs grandes.
2. Baixar e processar os arquivos grandes de 2022 e 2023 com a mesma política de checkpoint e validação.
3. Curar os 50 maiores recebedores de 2024.
4. Criar um dataset validado de ranking de recebedores.
5. Criar a página "Quem recebeu".
6. Conectar essa página à home, busca e Théo.

## Comandos úteis

Listar arquivo grande sem baixar:

```powershell
python pipelines\baixar_fontes_execucao.py --ano 2021 --documento despesa_orcamentaria --apenas-listar
```

Baixar um arquivo grande com limite explícito:

```powershell
python pipelines\baixar_fontes_execucao.py --ano 2021 --documento despesa_orcamentaria --permitir-grandes --max-mb 1000
```

Inventariar arquivos grandes locais:

```powershell
python pipelines\inventariar_arquivos_grandes.py --calcular-hash
```

Extrair um lote de páginas:

```powershell
python pipelines\extrair_despesa_orcamentaria_fatiada.py --ano 2021 --inicio-pagina 1 --lote-paginas 250 --max-lotes 1
```

Validar rastro tradicional:

```powershell
python pipelines\testes\verificar_rastro_execucao.py --ano 2021
```

Validar extração vertical de 2021:

```powershell
python pipelines\validar_extracao_despesa_vertical.py --ano 2021
```

Validar o CSV saneado de 2021:

```powershell
python pipelines\validar_extracao_despesa_vertical.py --ano 2021 --despesa-csv data\validated\sorocaba\execucao\saida\despesa_orcamentaria_sorocaba_2021.csv
```

## Definição de 100%

Sorocaba 100% não significa que todos os dados estarão magicamente disponíveis em formato perfeito.

Significa que:

- toda fonte oficial foi inventariada;
- todo arquivo disponível foi preservado ou marcado para coleta;
- todo dado extraído passou por validação;
- toda publicação tem fonte e limitação;
- toda ausência tem evidência e pedido de informação preparado;
- toda pergunta importante do cidadão tem uma página, uma resposta do Théo ou uma lacuna declarada.
