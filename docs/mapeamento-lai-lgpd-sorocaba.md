# Mapeamento 100% LAI e LGPD — Sorocaba/SP
> **Versão:** v1.0 · **Data base:** 2026-06-09
> **Autores:** Catão (Segurança e LGPD) & Frontino (Cobertura LAI e e-SIC)
> **Escopo:** Regulamentação de cruzamentos e publicação de 55 fontes de dados de Sorocaba (2020-2026)

---

## 1. Mapeamento de 100% das Regras da LGPD para o Setor Público

A Lei Geral de Proteção de Dados (Lei 13.709/2018 - LGPD) aplica-se ao tratamento de dados pessoais por pessoas jurídicas de direito público, com regras específicas voltadas ao atendimento de sua finalidade pública, na persecução do interesse público e com o objetivo de executar competências legais ou cumprir atribuições legais do serviço público (Art. 23).

### 1.1. Bases Legais Principais no Setor Público (Art. 7º e Art. 23)
1. **Cumprimento de Obrigação Legal ou Regulatória (Art. 7º, II):** O tratamento é obrigatório por determinação legal. No âmbito financeiro municipal, isso engloba a LRF (LC 101/2000), a LAI (Lei 12.527/2011), a Lei de Licitações (Lei 14.133/2021) e leis orçamentárias (PPA, LDO, LOA).
2. **Execução de Políticas Públicas (Art. 7º, III):** Tratamento necessário pela administração pública para a execução de políticas públicas previstas em leis e regulamentos ou respaldadas em contratos, convênios ou instrumentos congêneres.
3. **Legítimo Interesse da Administração (Art. 10):** Limita-se ao apoio e promoção de atividades da administração pública, desde que não prevaleçam direitos e liberdades fundamentais do titular. Não costuma ser a base principal para divulgação em portais de transparência, prevalecendo a obrigação legal.

### 1.2. Princípios Fundamentais Aplicados à Transparência Pública (Art. 6º)
- **Finalidade (Inciso I):** O tratamento de dados no projeto *Anatomia do Gasto* tem por finalidade exclusiva o controle social, a prestação de contas (*accountability*) e o combate ao desperdício ou desvios de recursos públicos.
- **Necessidade / Minimização (Inciso III):** Limitação do tratamento ao mínimo necessário para a realização de suas finalidades, com abrangência dos dados pertinentes, proporcionais e não excessivos em relação às finalidades do tratamento.
- **Livre Acesso (Inciso IV):** Garantia, aos titulares, de consulta facilitada e gratuita sobre a forma e a duração do tratamento, bem como sobre a integralidade de seus dados pessoais.
- **Qualidade dos Dados (Inciso V):** Garantia, aos titulares, de exatidão, clareza, relevância e atualização dos dados, de acordo com a necessidade e para o cumprimento da finalidade de seu tratamento.
- **Segurança e Prevenção (Incisos VII e VIII):** Utilização de medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou difusão.

### 1.3. Conflito Aparente LAI × LGPD: Enunciados da CGU e ANPD
A Controladoria-Geral da União (CGU) e a Autoridade Nacional de Proteção de Dados (ANPD) firmaram entendimentos sobre a ponderação entre o direito fundamental de acesso à informação (LAI) e o direito fundamental à privacidade (LGPD):
- **Enunciado CGU nº 01/2023 (Remuneração de Servidores):** A divulgação dos nomes e da remuneração bruta/líquida de servidores públicos no Portal de Transparência é legítima e de interesse público (conforme decisão do STF no Tema 225), mas devem ser preservados dados pessoais como CPF, RG, dados bancários, descontos pessoais (ex. pensão alimentícia, planos de saúde, parcelas de empréstimo consignado ou mensalidades de sindicatos).
- **Enunciado CGU nº 02/2023 (Dados de Solicitantes LAI):** A identidade dos cidadãos que protocolam pedidos de acesso à informação (e-SIC) é protegida e não deve ser disponibilizada ao público em geral.
- **Enunciado CGU nº 03/2023 (Beneficiários de Programas Sociais):** É pública a listagem de beneficiários de programas de transferência de renda (como Bolsa Família e auxílios municipais) devido ao interesse em evitar fraudes e desvios. Porém, detalhes íntimos como vulnerabilidade de saúde específica ou deficiências não devem ser destacados de forma nominativa.
- **Enunciado CGU nº 04/2023 (Dados Sensíveis de Saúde):** Prontuários médicos, diagnósticos, laudos de exames e receitas médicas em processos de judicialização de medicamentos são dados pessoais sensíveis (Art. 5º, II da LGPD) e protegidos por sigilo de 100 anos (Art. 31 da LAI), sendo proibida a publicação identificada.

### 1.4. Categorias de Dados no Contexto Financeiro Municipal
Para fins operacionais e de tratamento interno no projeto, classificamos os dados em cinco níveis de risco LGPD:
1. **Dados de Pessoas Jurídicas (CNPJ, Razão Social):** Sem restrições de LGPD (não se aplica a pessoas jurídicas). Risco Zero.
2. **Dados de Agentes Públicos (Prefeito, Secretários, Vereadores):** Nomes e cargos públicos são públicos por natureza. Remuneração institucional é pública. CPF e contatos são protegidos. Risco Baixo.
3. **Dados de Credores Individuais (Pessoas Físicas - CPF):** Contratados autônomos, estagiários, ou pessoas beneficiárias de pagamentos individuais. O nome e o valor recebido são públicos (prestação de contas), mas o CPF deve ser mascarado (`***.999.***-**`) e dados bancários omitidos. Risco Médio.
4. **Dados Pessoais de Beneficiários e Usuários (Estudantes, Pacientes):** Nomes e CPFs contidos em notas fiscais ou ordens de pagamento que revelem tratamentos de saúde ou matrículas escolares específicas. Risco Alto.
5. **Dados Sensíveis (Saúde, Judicialização de Medicamentos, Menores):** Prontuários, procedimentos cirúrgicos individualizados, assistência a crianças e adolescentes. Risco Crítico.

---

## 2. Mapeamento de 100% dos Dados Públicos da LAI (Obrigatórios por Lei)

A Lei de Acesso à Informação (Lei 12.527/2011) estabelece a obrigatoriedade de disponibilização de dados em formato aberto (Art. 8º, § 2º) e divide a transparência em duas frentes:
- **Transparência Ativa:** Divulgação obrigatória, contínua e independente de solicitações nos portais de transparência.
- **Transparência Passiva (e-SIC):** Acesso fornecido sob demanda, por meio de protocolo formal, no prazo máximo de 20 dias (prorrogável por mais 10).

### 2.1. Requisitos Legais dos Portais Municipais (LAI e LRF)
De acordo com o Art. 8º da LAI e Art. 48 da LRF, o município de Sorocaba é obrigado a publicar ativamente:
1. Estrutura organizacional, competências, telefones, endereços e horários de atendimento;
2. Receita orçamentária prevista e arrecadada;
3. Despesa orçamentária fixada, empenhada, liquidada e paga de forma em tempo real (atualização diária);
4. Licitações abertas, em andamento e homologadas (com editais e atas);
5. Contratos e aditivos celebrados;
6. Demonstrativos fiscais (RREO e RGF) em formato pesquisável;
7. Remuneração detalhada dos servidores e agentes políticos;
8. Repasses para convênios e parcerias com entidades sem fins lucrativos (MROSC - Lei 13.019/2014);
9. Obras públicas municipais (andamento, valores e executoras).

---

## 3. Matriz de Interseção LAI × LGPD por Dataset (55 Fontes)

Abaixo está o mapeamento exaustivo das 55 fontes curadas para Sorocaba/SP, combinando a obrigação de disponibilização sob a LAI com o tratamento de privacidade exigido pela LGPD:

| # | Área | Dataset / Tipo de Dado | Obrigação LAI (Tipo) | Nível Risco LGPD | Presença Dados Pessoais | Estratégia de Coleta Interna (100% LAI) | Política de Exibição Pública (Site / UI) |
|---|---|---|---|---|---|---|---|
| **01** | Orçamento | Plano Plurianual (PPA) | Ativa | Nenhum | Nenhuma | Baixar PDF do portal oficial | Pode resumir no site; sem restrições. |
| **02** | Orçamento | Lei de Diretrizes Orcamentárias (LDO) | Ativa | Nenhum | Nenhuma | Baixar PDF do portal oficial | Pode resumir no site; sem restrições. |
| **03** | Orçamento | Lei Orcamentária Anual (LOA) | Ativa | Nenhum | Nenhuma | Baixar PDF do portal oficial | Pode resumir no site; sem restrições. |
| **04** | Orçamento | Audiências Públicas do Orçamento | Ativa | Baixo | Nomes em atas | Coletar atas e anotações | Exibir atas sanitizadas (excluir CPFs/RGs se houver). |
| **05** | Receita | Registro Analítico Receita Orçamentária | Ativa | Baixo | CPFs de contribuintes individuais (IPTU/ISS) | Coletar bruto via LAI (cruzamento) | Exibir de forma agregada; ocultar CPFs de pessoas físicas. |
| **06** | Receita | Registro Analítico Receita Extraorçamentária | Ativa | Médio | CPFs de garantias e depósitos judiciais | Coletar bruto via LAI (cruzamento) | Exibir agregadamente por tipo de receita; mascarar CPFs. |
| **07** | Receita | Balancetes de Receita (Mensal) | Ativa | Nenhum | Nenhuma | Coletar bruto via LAI (cruzamento) | Exibir livremente por subfunção/origem agregada. |
| **08** | Despesa | Registro de Empenhos | Ativa (LRF) | Médio | Nomes/CPFs de fornecedores PF | Coletar completo via extrator/LAI | Ocultar CPFs de PF; manter apenas nomes institucionais. |
| **09** | Despesa | Registro Analítico Despesa Orçamentária | Ativa (LRF) | Médio | Nomes/CPFs de servidores/credores PF | Coletar completo via extrator/LAI | Mascarar CPFs; agrupar despesas por elemento de despesa. |
| **10** | Despesa | Registro Analítico Despesa Extraorçamentária | Ativa (LRF) | Médio | Nomes/CPFs em devoluções/cauções | Coletar bruto via LAI (cruzamento) | Exibir apenas de forma agregada. |
| **11** | Fornecedores | Conta Corrente Fornecedor (Agregado) | Ativa (LRF) | Médio | Nomes e CPFs de fornecedores PF | Coletar completo via extrator/LAI | Exibir perfil do fornecedor; mascarar CPFs PF. |
| **12** | Fornecedores | Restos a Pagar por Fornecedor | Ativa (LRF) | Médio | Nomes e CPFs de credores de restos | Coletar completo via extrator/LAI | Exibir no perfil do fornecedor; mascarar CPFs PF. |
| **13** | Bancário | Conta Corrente Bancária Municipal | Passiva | Alto | Nomes/CPFs em transferências bancárias | Coletar bruto via LAI (conciliação interna) | **Não exibir na UI.** Uso estritamente interno. |
| **14** | Contabilidade | Livro Caixa | Passiva | Médio | Nomes/CPFs em fluxos diários menores | Coletar bruto via LAI (conciliação interna) | **Não exibir na UI.** Uso estritamente interno. |
| **15** | Contabilidade | Livro Diário | Passiva | Alto | Todos os fatos contábeis e CPFs | Coletar bruto via LAI (conciliação interna) | **Não exibir na UI.** Uso estritamente interno. |
| **16** | Contabilidade | Livro Razão | Passiva | Alto | Detalhamento por conta e CPF | Coletar bruto via LAI (conciliação interna) | **Não exibir na UI.** Uso estritamente interno. |
| **17** | Fiscal | Relatório Resumido Execução Orçamentária | Ativa | Nenhum | Nenhuma | Coletar via API SICONFI | Pode resumir no site; sem restrições. |
| **18** | Fiscal | Relatório de Gestão Fiscal (RGF) | Ativa | Nenhum | Nenhuma | Coletar via API SICONFI | Pode resumir no site; sem restrições. |
| **19** | Saúde | Relatórios LRF Saúde | Ativa | Nenhum | Nenhuma | Coletar PDF oficial | Pode resumir no site; sem restrições. |
| **20** | Educação | Relatórios Aplicação Ensino | Ativa | Nenhum | Nenhuma | Coletar PDF oficial | Pode resumir no site; sem restrições. |
| **21** | Obras | Obras Públicas | Ativa | Baixo | Engenheiros/Fiscais responsáveis (PF) | Coletar via PNCP/TCE/LAI | Exibir obras públicas, localizações e valores; ocultar PII. |
| **22** | Contratos | Contratos e Aditivos | Ativa | Médio | Nomes e CPFs de contratados PF | Coletar via PNCP/LAI | Mostrar objeto, valor e vigência; mascarar CPF de PF. |
| **23** | Compras | Licitações municipais | Ativa | Baixo | Representantes comerciais (PF) | Coletar via PNCP/LAI | Mostrar objeto, vencedores e valores; ocultar PII. |
| **24** | Atos | Jornal Oficial do Município | Ativa | Baixo | Servidores nomeados, licenças | Baixar PDFs e indexar | Exibir link oficial e índice; sem perfilar pessoas físicas. |
| **25** | Pessoal | Remuneração dos Servidores | Ativa | Médio | Nomes e remunerações de servidores | Coletar bruto via LAI (cruzamento) | Exibir de forma agregada por cargo; sem rankings nominais. |
| **26** | Precatórios | Precatórios Judiciais | Ativa | Alto | Titulares dos precatórios (Pessoas Físicas) | Coletar via TCE/TJSP/LAI | Transparência agregada; evitar perfilamento nominal de credor. |
| **27** | SICONFI | Relatório Resumido Execução Orçamentária | Federal | Nenhum | Nenhuma | Coletar via API SICONFI | Pode resumir no site; sem restrições. |
| **28** | SICONFI | Relatório de Gestão Fiscal (RGF) | Federal | Nenhum | Nenhuma | Coletar via API SICONFI | Pode resumir no site; sem restrições. |
| **29** | SICONFI | Declaração de Contas Anuais (DCA) | Federal | Nenhum | Nenhuma | Coletar via API SICONFI | Pode resumir no site; sem restrições. |
| **30** | SICONFI | Matriz de Saldos Contábeis (MSC) | Federal | Nenhum | Nenhuma | Coletar via API SICONFI | Uso interno para validação e conciliação de receitas/despesas. |
| **31** | SIOPS | Receitas e Despesas em Saúde (SIOPS) | Federal | Nenhum | Nenhuma | Coletar via FNS/SIOPS | Pode resumir no site; sem restrições. |
| **32** | FNS | Repasses Federais SUS | Federal | Nenhum | Nenhuma | Coletar via API FNS | Pode resumir no site; sem restrições. |
| **33** | SIOPE | Receitas e Despesas Educação (SIOPE) | Federal | Nenhum | Nenhuma | Coletar via FNDE/SIOPE | Pode resumir no site; sem restrições. |
| **34** | FNDE | Repasses Programas Educacionais | Federal | Nenhum | Nenhuma | Coletar via API FNDE | Pode resumir no site; sem restrições. |
| **35** | PT Federal | Transferências da União para o Município | Federal | Nenhum | Nenhuma | Coletar via Portal da Transparência | Pode resumir no site; sem restrições. |
| **36** | Transferegov | Convênios e Instrumentos Federais | Federal | Nenhum | Nenhuma | Coletar via Transferegov | Pode resumir no site; sem restrições. |
| **37** | PNCP | Licitações, Contratos e Atas no PNCP | Federal | Nenhum | Nenhuma | Coletar via API PNCP | Pode resumir no site; sem restrições. |
| **38** | TCE_SP | Contas Anuais e Pareceres Prévios | Ativa | Nenhum | Nenhuma | Coletar via TCE-SP | Exibir pareceres e relatórios de auditoria oficiais. |
| **39** | AUDESP | Dados Enviados ao TCE-SP (Audesp) | Ativa | Baixo | Responsáveis pelo envio | Coletar via API Transparência TCE | Uso interno para cruzamento de dados de execução orçamentária. |
| **40** | Câmara | Execução Orçamentária do Legislativo | Ativa | Nenhum | Nenhuma | Coletar via site da Câmara/TCE | Pode resumir no site; sem restrições. |
| **41** | Câmara | Subsídios e Remuneração de Vereadores | Ativa | Baixo | Nomes e valores dos subsídios | Coletar bruto via site/LAI | Exibir nomes e valores recebidos (STF Tema 225). |
| **42** | Câmara | Contratos e Despesas de Gabinete | Ativa | Médio | Fornecedores de gabinete e verba | Coletar via site/LAI | Exibir despesas agregadas por tipo e vereador; mascarar CPF PF. |
| **43** | Câmara | Projetos de Lei e Votações | Ativa | Baixo | Autores de PLs e votações | Coletar via site da Câmara | Exibir projetos com impacto fiscal e votações nominais. |
| **44** | Câmara | Emendas Impositivas | Ativa | Baixo | Autores (Vereadores) das emendas | Coletar via CEPA/Câmara | Exibir de forma completa (Vereador, Objeto, Valor, Destino). |
| **45** | Urbes | Relação Mensal de Despesas | Ativa | Médio | Fornecedores PF da empresa pública | Coletar PDFs de despesas mensais | Exibir índice de despesas estruturado; mascarar CPFs. |
| **46** | Urbes | Contratos e Compras Diretas | Ativa | Médio | Contratados individuais PF | Coletar via Playwright/OCR | Omitir texto bruto OCR; publicar índice estruturado e mascarado. |
| **47** | Urbes | Remuneração do Transporte Público | Ativa | Nenhum | Nenhuma | Coletar via portal da Urbes | Exibir valores de subsídios e receitas tarifárias agregadas. |
| **48** | Urbes | Contratos de Concessão de Transporte | Ativa | Nenhum | Nenhuma | Coletar via portal da Urbes | Exibir contratos das concessionárias (PJ); sem restrições. |
| **49** | SAAE | Receitas e Despesas do SAAE | Ativa | Baixo | Credores institucionais e servidores | Coletar via dados abertos/TCE | Exibir execução orçamentária do SAAE de forma estruturada. |
| **50** | SAAE | Licitações, Contratos e Obras do SAAE | Ativa | Baixo | Fiscais e engenheiros (PF) | Coletar via dados abertos/LAI | Mostrar contratos da autarquia; sem dados pessoais na UI. |
| **51** | SAAE | Remuneração e Folha de Pagamento (RH) | Ativa | Médio | Nomes e salários de servidores SAAE | Coletar bruto via LAI (cruzamento) | Exibir estatísticas agregadas por cargo; evitar lista nominal. |
| **52** | FUNSERV | Balanços, Receitas e Despesas | Ativa | Baixo | Servidores aposentados (credores) | Coletar via portal/TCE | Exibir de forma consolidada o balanço do RPPS. |
| **53** | FUNSERV | Avaliação Atuarial | Ativa | Nenhum | Nenhuma | Coletar via portal/LAI | Exibir texto atuarial e projeções de déficit de forma agregada. |
| **54** | FUNSERV | Investimentos e Rentabilidade (APR) | Ativa | Nenhum | Nenhuma | Coletar via portal/LAI | Exibir carteira de investimentos da previdência de Sorocaba. |
| **55** | AGEM | Receitas e Despesas (AGEM Sorocaba) | Passiva | Nenhum | Nenhuma | Coletar via portal/LAI | Exibir apenas se houver relação financeira direta com Sorocaba. |

---

## 4. Diretrizes de Segurança de Dados e Anonimização para "Anatomia do Gasto"

Para garantir que o projeto cumpra a LGPD sem abrir mão do controle social e do mapeamento 100% de dados, definimos o seguinte protocolo técnico:

### 4.1. Governança das Camadas de Dados
```
[e-SIC / Portal] ➔ data/raw (Local/Drive) ➔ data/extracted (Local/Drive) ➔ data/validated (Local/Drive)
                                                                                  │ (Check LGPD / Minimização)
                                                                                  ▼
[Git Público / Site] ◀───────────────────────────────────────────────────── data/public (Publicado/Sanitizado)
```

1. **Camadas Internas (`data/raw`, `data/extracted`, `data/validated`):**
   - Contêm 100% dos dados coletados sob a LAI, inclusive com detalhes brutais de PII (CPFs de autônomos, detalhes de empenhos, etc.).
   - Armazenadas exclusivamente no Google Drive de forma privada (`G:\Meu Drive\02-Profissional\03-Big-Data-Fiscal-Data\raw`).
   - **NUNCA** são comitadas ou expostas no GitHub do projeto. O `.gitignore` protege ativamente estas pastas.
2. **Camada Pública (`data/public`):**
   - Alimenta o site do projeto.
   - Contém apenas dados sanitizados e validados.
   - PII é eliminada ou mascarada durante a etapa de promoção de `validated` para `public`.

### 4.2. Técnicas de Sanitização de Dados Pessoais na Promoção para `public`
- **Mascaramento de CPF:** Todo CPF identificado em credores, empenhos ou despesas deve ser processado e convertido para o formato `***.999.***-**`.
  - *Regex de Mascaramento:* `re.sub(r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b', lambda m: f"***.{m.group()[4:7]}.***-**", texto)`
- **Sanitização de OCR:** No processamento de textos extraídos por OCR de contratos da Urbes e SAAE, remover qualquer ocorrência de assinaturas digitalizadas ou dados sensíveis que não pertençam ao objeto do contrato.
- **Isolamento de Dados de Saúde:** Despesas do SAAE e FUNSERV que contenham nomes e medicamentos em reembolsos de saúde devem ser totalmente omitidas no nível individual e somadas em contas de despesa agregadas ("Despesa com Saúde do Servidor").
- **Exclusão de Dados Bancários:** Excluir colunas contendo número de agência e conta corrente bancária em qualquer exportação para a pasta `public`.

### 4.3. Regras de Interface e UX (UI Policies)
- **pode_resumir:** O dataset pode ser usado em gráficos, mapas, agregadores e cards estatísticos gerais.
- **resumir_sem_pessoa:** Exibe estatísticas sobre o dataset, mas impede a criação de perfis de pessoas físicas ou o rastreio nominal.
- **agregar_sem_perfil_pessoal:** Exibe a lista de transações mas substitui o nome de credores individuais (Pessoas Físicas) pela string `"Credor Pessoa Física Mascarada"` e seu respectivo CPF mascarado.
- **nao_exibir_ate_promocao:** Bloqueia a leitura do arquivo pela interface Next.js caso o arquivo correspondente não esteja presente fisicamente na pasta `data/public/`.

---
*Fim do documento. Auditável pelas rotinas de escopo e testes do projeto.*
