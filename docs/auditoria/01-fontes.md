# Fontes de Dados

## Fontes Primárias (oficiais)

| Fonte | URL / Acesso | O que fornece | Periodicidade |
|---|---|---|---|
| Portal da Transparência de Sorocaba | https://transparencia.sorocaba.sp.gov.br/ | Remuneração de agentes políticos, execução orçamentária, emendas | Mensal (remuneração); trimestral (orçamento) |
| Câmara Municipal de Sorocaba (CEPA) | https://cepa.camarasorocaba.sp.gov.br/ | Emendas impositivas de vereadores: valor disponível, destinações, empenho, liquidação, pagamento | Atualizado sob demanda |
| Portal da Transparência do Governo Federal | https://portaldatransparencia.gov.br/ + API | Emendas parlamentares federais, transferências fundo a fundo, convênios | Diária (emendas); mensal (convênios) |
| Portal da Transparência do Estado de SP | https://www.transparencia.sp.gov.br/ | Emendas parlamentares estaduais, convênios | Mensal |
| SIAFIC / Transferegov | https://plataformamaisbrasil.gov.br/ | Detalhamento de repasses a entidades | Sob consulta |

## Fontes Secundárias (validação cruzada)

| Fonte | O que fornece | Uso |
|---|---|---|
| DadosJusBr (Transparência Brasil) | Remunerações do Judiciário padronizadas | Comparação metodológica |
| Serenata de Amor (Jarbas) | Suspeitas na CEAP federal | Referência de curadoria de irregularidades |
| Base dos Dados | Tabelas de população, PIB, IDH | Contextualização de gastos per capita |

## Limitações

- Alguns portais exigem API com chave; outros fornecem apenas consulta manual ou CSV.
- Execução orçamentária pode ter defasagem de até 60 dias.
- Remuneração líquida e benefícios indiretos raramente são detalhados — essa lacuna será atacada via LAI.