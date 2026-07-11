# Contexto: conformidade nacional de dados abertos (Poder Executivo Federal)

Referencia de contexto, nao comparador municipal direto. Ver regra de evidencia
em `docs/benchmark-publico.md`.

## Fonte

Painel de Monitoramento de Dados Abertos do Poder Executivo Federal (CGU),
`painel.dados.gov.br`. Export manual feito pelo usuario em 2026-07-11, dois
arquivos CSV (`Monitoramento` e `Cronograma`), processados por
`pipelines/analisar_dados_abertos_federal.py`. Resultado bruto em
`data/manifests/benchmark_dados_abertos_federal.json`.

## Escopo e limitacao

Cobre apenas orgaos do Poder Executivo Federal (Decreto 8.777/2016 e
Resolucao CGINDA 3/2017) — nenhuma linha e de municipio. Nao serve como
comparador direto de Sorocaba ou Paulinia; serve para contextualizar, num
texto do portal, o nivel de conformidade com politica de dados abertos que
o proprio Governo Federal atinge, como pano de fundo para a discussao sobre
transparencia municipal.

## Metricas (medido em 2026-07-11)

- 256 orgaos federais monitorados; **113 (44,1%) com PDA publicado**, 143
  (55,9%) sem PDA vigente.
- 9.749 bases de dados previstas nos cronogramas dos PDAs; **7.171 (73,6%)
  efetivamente abertas**.
- Das bases abertas, **2.974 (41,5% das abertas) foram abertas com atraso**
  em relacao a previsao original.
- 2.548 bases seguem sem abertura efetiva (previsao vencida ou futura).

## Uso permitido

Frase permitida (com esta evidencia): "Mesmo no Governo Federal, apenas 44%
dos orgaos do Executivo tem Plano de Dados Abertos publicado (CGU, medicao
2026-07-11) — a exigencia de dados estruturados em nivel municipal enfrenta
uma barreira ainda maior, tema deste portal."

Frase proibida sem novo dado: qualquer alegacao de nota ou ranking municipal
derivada destes numeros federais.
