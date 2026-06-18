# Visualizações e Rankings

## 1. Tabela de Perfis

Cada agente político tem uma linha com:
- Nome, cargo, partido.
- Remuneração bruta (último mês disponível, com fonte).
- Total destinado em emendas de saúde (exercício atual).
- Total pago.
- Taxa de execução.
- Pendências (restos a pagar).
- Nota do ranking.

Filtros: cargo, partido, status.

## 2. Grafo de Fluxo Financeiro

- Nós: Contribuinte → União/Estado/Município → Parlamentar → Entidade/Projeto.
- Arestas rotuladas com valores e status (pago, pendente).
- Cores: verde (pago), amarelo (empenhado), vermelho (restos a pagar).
- Ferramenta: NetworkX + PyVis (HTML estático).

## 3. Painel Comparativo de Fontes

- Gráfico de barras sobrepostas comparando valores de uma mesma emenda segundo fontes diferentes.
- Barras tracejadas indicam divergências.

## 4. Ranking Positivo e Negativo

### Objetivo
Criar um placar dinâmico que ranqueie os parlamentares com base em critérios objetivos, permitindo ao cidadão ver rapidamente quem está no topo e quem está na base.

### Critérios Positivos (contribuem para subir no ranking)
- Alta taxa de execução das emendas (≥ 80% pago).
- Distribuição das emendas entre múltiplas entidades (≥ 3 entidades diferentes).
- Emendas para entidades com CNPJ ativo e regular.
- Transparência proativa: dados completos disponíveis sem necessidade de LAI.

### Critérios Negativos (contribuem para descer no ranking)
- Emendas com taxa de execução baixa (< 30% pago após 6 meses).
- Concentração elevada (> 50% em uma única entidade).
- Entidade beneficiada com CNPJ inapto, suspenso ou baixado.
- Dados ausentes ou que exigiram LAI não respondida.
- Emendas não pagas que viraram restos a pagar sem justificativa pública.

### Exibição
- Lista vertical de parlamentares, do melhor para o pior, com selos (🟢🟡🔴).
- Cada parlamentar pode ser expandido para ver o detalhamento dos critérios.
- O ranking é histórico: versões anteriores ficam arquivadas para comparação temporal.

## 5. Narrativa Gerada por IA

- A partir dos dados estruturados, um LLM gera parágrafos explicativos.
- Ex.: "Em 2025, o vereador X destinou R$ Y mil para Z entidades. Desse total, R$ W mil foram pagos até dezembro. O parlamentar sobe no ranking devido à alta taxa de execução e à distribuição entre 4 entidades."
- O texto é revisado antes da publicação.

## 6. Linha do Tempo

- Visualização cronológica mês a mês da liberação de pagamentos, por parlamentar.
- Útil para identificar atrasos ou concentração pré-eleitoral.

## 7. Dados Abertos

- Todos os CSVs/JSONs subjacentes estarão disponíveis para download.