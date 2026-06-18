# Decisao SAAE licitacoes contratos obras - Sorocaba - 2026-06-02

Escopo: validar os recortes normalizados do SAAE em `data/extracted/sorocaba/saae/normalizado` para decidir publicabilidade.

## Resultado

- Contratos: 22 registros de 2026, com fornecedor, CNPJ/CPF, valores, objeto e modalidade. Um registro nao trouxe datas inicial/final no recorte TDAPortal.
- Licitacoes: 77 registros de 2026, com modalidade, processo, objeto, situacao e data. Em 56 registros de dispensa/inexigibilidade, a abertura veio como marcador nao aplicavel (`:`/`0,00`) e foi normalizada como vazia.
- Obras: 85 processos 2017-2022, com processo, ano e situacao, mas todos sem descricao da obra no recorte TDAPortal.

## Decisao

- Nao publicar este lote em `data/public` neste bloco.
- Tratar contratos e licitacoes como candidatos a publicacao cautelosa apos autorizacao explicita, com nota de cobertura 2026 e campos ausentes.
- Tratar obras apenas como inventario parcial de processos/situacao; nao publicar como base de obras completa ate obter descricao por fonte melhor, endpoint especifico ou LAI.
- Manter a linha SAAE no manifesto como parcial, nao como publicado.

## Validacao local

- `python -m py_compile tools\data\normalizar_saae_lacunas.py tools\data\qa_lacunas_sorocaba.py`
- `python tools\data\normalizar_saae_lacunas.py`
- `python tools\data\qa_lacunas_sorocaba.py --markdown docs\qa-lacunas-sorocaba-2026-06-02.md --date 2026-06-02`
