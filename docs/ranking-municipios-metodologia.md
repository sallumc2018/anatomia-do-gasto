# Metodologia — Ranking de Municípios

> Rascunho de metodologia para os primeiros rankings comparativos entre municípios
> (quem mais recebe, mais gasta, mais cobra, mais entrega). Segue os mesmos
> princípios de `docs/auditoria/03-metodologia.md`, adaptados de agente político
> para município.

## Regra-mãe (não negociável)

Nenhum ranking pode sugerir cobertura nacional/completa quando não tem. Todo
ranking publicado precisa expor, junto ao resultado:

1. **Quantos municípios estão no ranking** vs. total do universo declarado
   (ex.: "77 de 5.571 municípios com dado de transferências federais").
2. **Qual métrica exata** está sendo rankeada (nome, unidade, período, fonte).
3. **O que NÃO está incluído** (dado ausente ≠ zero — um município fora do
   ranking pode gastar/receber mais do que o 1º colocado; simplesmente não
   temos o dado ainda).
4. **Data de corte da coleta** (para deixar claro que é uma foto, não um
   acompanhamento em tempo real).

Esse bloco de disclaimer é obrigatório em toda página de ranking, não opcional
nem "nota de rodapé" — deve aparecer visualmente antes ou junto da tabela/lista,
não escondido embaixo.

## Benchmark — como referências fazem (e onde falham)

Pesquisa 2026-07-09 sobre Tesouro Nacional/FINBRA, Portal da Transparência/CGU,
FIRJAN (IFDM/IFGF), Transparência Brasil/Contas Abertas, IBP/Open Budget Survey
e Ranking SICONFI. Achado central: **nenhuma dessas referências expõe cobertura
de forma visível no ponto de consumo do dado** — quando existe disclaimer, está
em nota metodológica separada, entrevista de imprensa ou literatura acadêmica
secundária, nunca na própria tabela/ranking. A STN admite publicamente que o
SICONFI "não depura dados ausentes ou com erro" e que corrigir isso exigiria
pesquisa manual nos 26 TCEs — uma limitação estrutural conhecida e não
resolvida há anos. FIRJAN é a única que lista nominalmente municípios
excluídos e o motivo (ex. "94 municípios com ausência/insuficiência/
inconsistência de dados"), mas mesmo ela não marca visualmente "sem dado" na
tabela final — o excluído simplesmente não aparece.

Pontos a fazer melhor que todas essas referências (incorporados nas seções
abaixo):

1. Banner de cobertura sempre visível no topo do ranking, nunca só em nota
   metodológica separada.
2. Listar nominalmente os municípios/motivos de exclusão (padrão FIRJAN), não
   só o número agregado.
3. Marcação visual na própria tabela para "sem dado disponível" (célula
   cinza/ícone) — nenhuma referência pesquisada faz isso bem.
4. Data de corte ancorada em prazo legal auditável (ex. "dados enviados até
   30/abr conforme LRF art. 51"), como faz a STN.
5. Declarar explicitamente o que a métrica NÃO mede (ex. "valor transferido,
   não impacto/execução real"), replicando o disclaimer estrutural do IBP.
6. Nunca apresentar ranking parcial como se fosse universo completo — erro
   implícito do FIRJAN e do Portal da Transparência quando excluídos somem
   sem marca.
7. Link direto para a metodologia completa a partir de cada tabela de
   ranking, não só em página separada de difícil acesso.
8. Quantificar cobertura em % e em N absoluto ("315 de 5.571 = 5,7%").
9. Congelar a definição metodológica por versão/ano e avisar quando mudar
   (aprendizado da mudança FINBRA 2023→2024 em transferências
   constitucionais).
10. Recomendar fontes complementares quando a cobertura é baixa (ex. "para
    município X ausente, consulte SICONFI/Portal da Transparência
    diretamente").

## Fases de ranking (por maturidade de dado)

### Fase 1 — viável agora: "Quem mais recebe" (transferências federais)

- Métrica: soma de valores recebidos via FNS + emendas parlamentares federais +
  transferências federais (TransfereGov/TCE-SP), por município, por ano.
- Universo atual: ~315 municípios com FNS; ~77–78 com emendas/transferências
  federais — usar a interseção ou publicar rankings separados por fonte,
  nunca somar fontes com cobertura desigual sem declarar isso.
- Per capita: exige população do município (IBGE) — se não tivermos essa
  tabela ainda, ranking deve ser só em valor absoluto, com nota "per capita
  pendente".

### Fase 2 — bloqueada por dado: "Quem mais gasta / mais cobra / mais entrega"

- Métricas: despesa executada (liquidado/pago), receita própria arrecadada,
  taxa de execução orçamentária (pago/empenhado).
- Universo atual: ~21–22 municípios com `executivo`/`receita` publicado
  (essencialmente Sorocaba, Paulínia, SP capital e poucos mais).
- **Não publicar este ranking ainda** — amostra pequena demais e não
  aleatória (viés de quais municípios o Sprint 2 já processou), resultado
  seria enganoso mesmo com disclaimer. Aguardar Sprint 2 ampliar cobertura de
  orçamento próprio antes de rankear.

## Template de disclaimer (para reuso em toda página de ranking)

```
Este ranking cobre {N} de {TOTAL} municípios do Brasil ({PCT}%) — os que já
têm dado publicado de {MÉTRICA} até {DATA_CORTE}. Ausência de um município
não significa valor zero: pode ser que o dado ainda não tenha sido coletado.
Esta métrica mede {O_QUE_MEDE} — não mede {O_QUE_NAO_MEDE}.
Municípios sem dado nesta métrica aparecem marcados (não omitidos) na tabela.
Fonte: {FONTES}. Metodologia completa: {LINK_METODOLOGIA}.
Município ausente? Consulte {FONTE_COMPLEMENTAR} diretamente.
```

Regras de implementação junto com o template:

- A tabela/lista em si precisa marcar visualmente (célula cinza + ícone/texto
  "sem dado") qualquer município fora da métrica corrente quando ele aparecer
  em contexto (ex. filtro por UF/região) — nunca deixá-lo simplesmente sumir.
- `{LINK_METODOLOGIA}` é um link clicável dentro do próprio bloco, não uma
  referência a procurar em outro menu.
- Cada manifest de ranking carrega um campo de versão/data de definição da
  métrica; mudança de definição (ex. o que conta como "transferência") exige
  nova versão, não silenciosa substituição do valor histórico.

## Próximos passos técnicos (quando formos implementar)

1. Definir schema de agregação por município (`data/manifests/rankings/*.json`
   gerado por script, nunca hardcoded no frontend — mesmo padrão de
   `gerar_datasets_json.py`).
2. Script `gerar_ranking_transferencias.py`: lê `data/public/<municipio>/fns`
   e `emendas_federais`, soma por município/ano, grava manifest com contagem
   de municípios incluídos (`n_incluidos`, `n_universo`, `data_corte`).
3. Página `/ranking/transferencias` (ou dentro de `/comparativo`) — renderiza
   o disclaimer acima como bloco fixo no topo, antes da tabela.
4. Gate de publicação: nenhum manifest de ranking pode ser publicado sem os
   campos `n_incluidos`, `n_universo`, `metrica`, `fontes`, `data_corte`
   preenchidos — mesmo princípio de `sanear_cpf_publicos.py --gate`, mas para
   completude de metadado de ranking.
