# Metodologia de Auditoria

## Objetivo

Para cada agente político, responder:

1. Qual a remuneração oficial? (entrada — de onde vem)
2. Quanto ele destinou em emendas para a saúde? (saída — para onde vai)
3. Qual o destino final dessas emendas? (entidade, objeto, status)
4. Quanto foi efetivamente pago vs. apenas empenhado?
5. Quais as lacunas de transparência que impedem o rastreamento completo?

## Princípios

- **Rastreamento de todas as entradas e saídas**: cada fluxo financeiro deve ser mapeado do contribuinte até a ponta final e do erário até a conta do agente.
- **Armazenamento eterno**: os dados são coletados retroativamente (até onde as fontes permitirem) e daqui para frente, sem descarte. Cada coleta gera uma série temporal.
- **Impossibilidade declarada**: quando um dado não puder ser obtido, a auditoria publica o motivo e a tentativa feita (ex.: "pedido de LAI protocolado em XX/XX/XXXX, ainda sem resposta").
- **Ranking positivo/negativo**: cada ação rastreável alimenta indicadores que permitem comparar agentes ao longo do tempo.

## Fluxo de Verificação

1. **Coleta automatizada** (scripts Python, GitHub Actions):
   - Extração de APIs e CSVs oficiais.
   - Armazenamento em `dados/brutos/<ano>/<mes>/` com timestamp.

2. **Tratamento** (scripts `pandas`):
   - Normalização de nomes, CNPJs, datas.
   - Consolidação de múltiplas fontes em um único dataset unificado.

3. **Cruzamento**:
   - Para cada emenda, verificar se consta em ao menos duas fontes oficiais.
   - Divergências > 5% entre fontes geram flag de alerta.

4. **Cálculo de indicadores**:
   - Taxa de execução = pago / empenhado.
   - Concentração = % do total destinado às 3 maiores entidades.
   - Pendência = total em restos a pagar / total empenhado.

5. **Ranking**:
   - Indicadores agregados por parlamentar em cada exercício.
   - Exemplos de critérios positivos: alta taxa de execução, distribuição entre múltiplas entidades, transparência proativa.
   - Exemplos de critérios negativos: emendas não pagas, concentração excessiva, entidade com CNPJ irregular, ausência de dados.

## Armazenamento Eterno

- Os dados brutos e tratados são versionados no repositório, organizados por ano e mês.
- Scripts de coleta retroativa buscam exercícios anteriores sempre que novas fontes se tornam acessíveis.
- Nenhum dado é sobrescrito; cada atualização gera uma nova versão com data de coleta.

## Auditoria de Salários

- Comparar subsídio bruto declarado com a lei de fixação.
- Quando disponível, comparar com contracheque detalhado (via LAI).
- Publicar a diferença, se houver, e a fonte de cada valor.

## Periodicidade

- Remunerações: coleta mensal.
- Emendas: coleta trimestral com possibilidade de acionamento manual.
- Relatório público semestral com comparativo consolidado e ranking atualizado.