# Auditoria De Cobertura De Sorocaba

Data da auditoria local: 2026-05-15.
Reconciliação pré-deploy: 2026-05-20.

Esta auditoria mapeia arquivos locais de Sorocaba nas camadas `data/raw`,
`data/extracted`, `data/validated`, `data/public` e `data/manifests`.
Ela nao publica dados novos e nao transforma extracao em validacao.

## Resultado Atual

Matriz gerada:

```powershell
python pipelines\auditar_cobertura_sorocaba.py
```

Saida:

- `data/manifests/auditoria_cobertura_sorocaba.csv`

Resumo:

| Camada | Arquivos | Status |
|---|---:|---|
| `data/public` | 160 | Publicado no site; 156 CSVs de Sorocaba |
| `data/extracted` | 105 | Extraido, nao publicado |
| `data/manifests` | 13 | Controle e rastreabilidade |
| `data/raw` | 0 em C; 602 arquivos no acervo externo `G:\Meu Drive\Omega-data\raw` | Fonte bruta oficial fora do repo |
| `data/validated` | 19 | Validado localmente, nao publicado |

## Fontes Brutas Locais

| Ano | Documento | Paginas | Status |
|---:|---|---:|---|
| 2020 | Livro Conta Corrente de Fornecedor | 6.149 | Baixado e extraido |
| 2020 | Livro Registro Analitico da Despesa Orcamentaria | 4.037 | Baixado, extraido e validado contra fornecedor |
| 2021 | Livro Conta Corrente de Fornecedor | 7.837 | Baixado e extraido |
| 2021 | Livro Registro Analitico da Despesa Orcamentaria | 3.868 | Baixado, extraido e validado localmente em `data/validated` |
| 2024 | Livro Conta Corrente de Fornecedor | 9.192 | Baixado e extraido |
| 2024 | Livro Registro Analitico da Despesa Orcamentaria | 4.952 | Baixado, extraido e validado contra fornecedor |

## Pontos De Controle

### Execucao 2021

O PDF de despesa orcamentaria de 2021 foi extraido com cobertura integral dos
candidatos de data:

- candidatos no PDF: 9.365
- registros extraidos: 9.365
- cobertura: 9.365/9.365

Na extracao mecanica, havia divergencias impeditivas:

- 210 registros nao cruzavam exatamente por `fornecedor_codigo + nota_empenho`
  com o livro de fornecedores depois da normalizacao de identificadores.
- 4.875 registros usam campos herdados da tabela visual do PDF, marcados em
  `campos_herdados`.

O saneamento foi feito em `data/validated`, sempre por correspondencia unica no
livro de fornecedores:

- 158 registros corrigidos por `nota_empenho + documento_despesa`.
- 52 registros corrigidos por `nota_empenho`.
- 0 registros sem saneamento.
- cobertura final do CSV validado: 9.365/9.365 por `fornecedor_codigo + nota_empenho`.

Validacao:

```powershell
python pipelines\validar_extracao_despesa_vertical.py --ano 2021 --despesa-csv data\validated\sorocaba\execucao\saida\despesa_orcamentaria_sorocaba_2021.csv
```

Essa validacao deve passar para o CSV saneado. A extracao mecanica permanece em
`data/extracted` como rastro operacional, nao como publicacao.

### Arquivos Vazios Operacionais

Ha arquivos vazios em `data/extracted`, mas eles sao diagnosticos ou tentativas
de extracao fatiada. Nao estao em `data/public`.

Exemplos:

- `data/extracted/sorocaba/execucao/diagnosticos/despesa_vertical_2021_descartados_pos_heranca_paginas.csv`
- `data/extracted/sorocaba/execucao/saida_fatiada/2021/despesa_orcamentaria_sorocaba_2021_p000001_000250.csv`

## Publicacao Atual

Todos os 160 arquivos atualmente publicados em `data/public` possuem agora um
padrao correspondente em `data/manifests/datasets.csv`.

Esta checagem foi feita comparando os nomes publicados contra `Arquivo_Padrao`
do manifesto.

Os JSONs auxiliares publicados fora de `data/public/sorocaba/{area}/saida` ficam
com `Origem_Dir=public_aux`, para nao serem verificados pelo validador municipal
de CSVs.

## Lacunas Criticas

Prioridade para fechar Sorocaba com seguranca:

1. Inventariar compras, contratos, licitacoes, atas e PNCP.
2. Inventariar obras e cruzar com contratos, empenhos e pagamentos.
3. Publicar transferencias federais e estaduais somente apos validacao local.
4. Completar autarquias e indiretas: Urbes, SAAE, FUNSERV e AGEM.
5. Completar Camara avancada: contratos, execucao detalhada e emendas.
6. Cruzar dados publicados com TCE-SP/AUDESP, SIOPS/SIOPE e demais fontes de controle.

## Regra De Publicacao

Um dado so deve sair de `data/extracted` para `data/public` quando houver:

- fonte oficial identificada;
- arquivo bruto preservado ou API oficial documentada;
- hash, tamanho e data de coleta quando aplicavel;
- parser identificado;
- validacao local registrada;
- campos obrigatorios completos ou lacuna explicitamente justificada;
- ausencia de divergencia impeditiva contra fonte de controle.

Dados ausentes nao sao zero. Divergencia nao e conclusao. Inferencia nao e fato.
