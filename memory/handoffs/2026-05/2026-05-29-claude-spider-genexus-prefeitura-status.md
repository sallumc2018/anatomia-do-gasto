---
id: 2026-05-29-claude-spider-genexus-prefeitura-status
date: 2026-05-29
agent: Claude Code
status: active
visibility: public
---

# Spider GeneXus Prefeitura Sorocaba - status e metodo comprovado

## O que foi construido
- pipelines/baixar_sorocaba_prefeitura.py: scaffold do spider para o portal municipal
  (transparencia.sorocaba.sp.gov.br/tdaportalclient.aspx?418)
- 13 secoes mapeadas por classe CSS temp05_NN_ (rh=16, despesas=11, receitas=12,
  transferencias=14, contas_pub=15, licitacoes=18, restos=21, obras=37, cargos=43,
  fundeb=50, tabelas_sal=17, diarias=13, dados_abertos=33)

## Metodo de extracao COMPROVADO (2026-05-29)
O portal renderiza dados via FusionCharts (SVG), nao em tabelas HTML.
Os valores ficam em elementos <svg text> apos o render JS.
Teste manual em RH retornou 16 labels validos:
  categorias: Janeiro/2026 ... Maio/2026
  valores: 249.460, 234.377, 274.917, 244.052, 258.687
Funcao extrair_svg_labels() ja implementada e funcional.

Tambem confirmado no portal:
- KPIs agregados visiveis: Total Empenhado 2.612.542.735, Total Arrecadado 369.699.180,
  Compras/Licitacoes/Contratos 12.043.886,72, Total de Funcionarios 13.661 (2024)
- Secao "Extracao de Dados Abertos" (temp05_33_) tem filtros ano/mes/tipo (CSV/EXCEL/JSON)
  + botao Filtrar (onclick=submmitApply) — caminho oficial de export, ainda nao disparou
  download nos testes (precisa sequencia exata tipo->ano->Filtrar dentro de .dash.selected)

## O que FALTA para o spider ficar robusto (engenharia, nao LAI)
1. Contexto novo por ano: o menu temp05_NN_ nao fica reclicavel depois de entrar numa
   secao. Solucao: browser.new_context() + nova page por (secao, ano), OU voltar ao menu.
2. Selecao de ano: usar FILTERCOMBO_*_exe (selects fora de .dash.selected) + disparar
   evento change, depois clicar Filtrar, depois esperar 5-7s o FusionCharts re-renderizar.
3. Trocar dimensao: o select "Secretaria (RH)/Cargo/Local/Condicao" controla a quebra.
   Para lotacao por secretaria, selecionar "Secretaria (RH)" antes de Filtrar.
4. Parsear svg_labels: FusionCharts alterna categoria/valor; emparelhar por posicao.
5. Loop: secao x ano x dimensao, salvando svg_labels.csv por combinacao.

## Recomendacao
Tarefa de scraper dedicada (Codex ou /playwright) usando o scaffold + metodo SVG ja provado.
Estimativa: 1-2 ciclos focados. Nao e bloqueio de fonte (dado esta publico e renderizado),
e bloqueio de mecanica de interacao GeneXus.

Alternativa imediata de menor esforco: os KPIs agregados (total empenhado, arrecadado,
n. funcionarios por ano) ja sao extraiveis do innerText da area — suficiente para um
card de visao geral enquanto a quebra detalhada por secretaria nao e finalizada.

## Arquivos
- pipelines/baixar_sorocaba_prefeitura.py
- data/extracted/sorocaba/execucao/sorocaba_rh_svg_labels_2024.csv (16 labels de teste)
- data/extracted/sorocaba/execucao/sorocaba_rh_contentarea_1.html (249KB render bruto)
