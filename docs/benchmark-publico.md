# Benchmark publico auditavel

Este benchmark e uma meta de qualidade do Anatomia do Gasto. Ele nao e um selo declaratorio. Qualquer comparacao publica precisa ser reproduzivel, datada e limitada ao que foi medido.

## Objetivo

Alcancar excelencia em quatro dimensoes:

1. Performance e qualidade tecnica do site.
2. Acessibilidade e UX cidada.
3. Cobertura e rastreabilidade dos dados publicos.
4. Comparacao honesta com portais oficiais e iniciativas semelhantes.

## Regra de publicacao

Nao publicar nota, ranking ou alegacao de superioridade sem evidencia armazenada. A evidencia minima e:

- URL medida;
- ferramenta ou criterio usado;
- data e hora;
- commit e, quando houver, deploy;
- resultado bruto;
- limitacao da medicao.

Exemplos permitidos:

- "Meta: Lighthouse 100 em rotas principais."
- "Medicao HTTP local em 2026-05-28: rota X respondeu 200 em Y ms."
- "Cobertura Sorocaba: 79,7% pelo score interno documentado."

Exemplos proibidos sem evidencia:

- "SEO 100%."
- "TTFB zero."
- "A+ em GitHub."
- "Melhor portal do Brasil."

## Dimensoes

### 1. Performance tecnica

Ferramentas alvo:

- Lighthouse/PageSpeed Insights para performance, acessibilidade, boas praticas e SEO.
- Medicao HTTP simples para status, tempo de resposta e tamanho de HTML.
- Build local e lint para regressao tecnica.

Gates de meta:

- Rotas principais respondem 200.
- Lighthouse alvo 100/100/100/100 em desktop e mobile, quando medido.
- Sem erro de console nas rotas principais.
- Sem dado interno lido fora de `data/public`.

### 2. UX cidada

Criterios:

- Linguagem clara para cidadao comum.
- Fonte, periodo, escopo e limitacao visiveis nas paginas de dados.
- Navegacao por pergunta publica, nao apenas por estrutura contabil.
- Fluxo de publicacao transparente.
- Mindmap navegavel sem depender de informacao nao publicada.

### 3. Dados abertos e cobertura

Criterios:

- Toda fonte oficial inventariada.
- Toda ausencia relevante registrada como lacuna, nao como zero.
- Dados publicados somente em `data/public`.
- Dados sensiveis ou ambiguos com politica de UI explicita.
- Score de cobertura por municipio com metodo documentado.

Estado atual de Sorocaba:

- Score de cobertura: 79,7% bruto, exibido como 80% no site.
- Fonte: `docs/roadmap-sorocaba-100.md`, `memory/handoffs/2026-05/cobertura-sorocaba.md` e `tools/diagnostico/calc_score.py`.

### 4. Comparadores

Os comparadores ficam em `data/manifests/benchmark_targets.csv`. Eles servem para medir experiencia publica e abertura de dados, nao para acusar orgaos ou pessoas.

Categorias iniciais:

- site oficial do Anatomia do Gasto;
- portais oficiais de Sorocaba;
- portais oficiais de Paulinia;
- TCE-SP como fonte independente;
- iniciativas civicas brasileiras de dados publicos.

## Sorocaba: caminho para 100%

Prioridade tecnica antes de afirmar "benchmark perfeito":

1. Receita analitica mensal.
2. Pareceres e contas anuais do TCE-SP.
3. Contratos e licitacoes da Camara.
4. Obras e contratos com cruzamento de empenhos.
5. Classificacao dos maiores recebedores.
6. Registro de pedidos LAI e respostas.

## Paulinia: inicio correto

Paulinia comeca por inventario, nao por pagina conclusiva.

Primeiros passos:

1. Confirmar fontes oficiais em `data/manifests/paulinia_seed_sources.csv`.
2. Criar manifesto municipal equivalente ao de Sorocaba.
3. Identificar sistemas: portal municipal, TCE-SP, Camara, SICONFI, PNCP e bases setoriais.
4. Coletar somente fonte oficial ou API publica.
5. Manter tudo fora de `data/public` ate validacao local e autorizacao explicita.

## Selo de benchmark

O UI do selo pode existir, mas deve exibir estados:

- `meta`: objetivo ainda nao medido;
- `medido`: resultado com evidencia;
- `nao_medido`: sem dado;
- `falhou`: ferramenta indisponivel ou medicao inconclusiva.

Nenhum componente deve conter notas hardcoded.
