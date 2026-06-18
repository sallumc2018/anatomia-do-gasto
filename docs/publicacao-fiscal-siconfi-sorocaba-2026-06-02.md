# Publicacao fiscal SICONFI - Sorocaba - 2026-06-02

Escopo: primeiro lote de validacao/publicacao governada de Sorocaba.

Resultado: nao houve nova copia para `data/public`. A verificacao confirmou que os 50 CSVs em `data/extracted/sorocaba/fiscal/saida` ja estavam publicados em `data/public/sorocaba/fiscal/saida` com o mesmo SHA-256.

## Cobertura

- SICONFI RREO 2020-2025.
- SICONFI RGF 2020-2025.
- SICONFI DCA 2020-2025.
- 50 arquivos extracted/public correspondentes.
- 5 arquivos publicos extras de serie consolidada RGF/RREO ja registrados em `data/manifests/datasets.csv`.

## Decisao

- Tratar o lote Fiscal/SICONFI de Sorocaba como publicado e validado localmente em 2026-06-02.
- Nao alterar `data/public` neste bloco, porque a camada publica ja continha os arquivos identicos.
- Manter a fonte Prefeitura fiscal/RREO/RGF como cruzamento futuro, nao como bloqueio para o lote SICONFI.
- Nao criar excecao nova em `data/validated`, pois essa camada e interna/ignorada por Git e a publicacao preexistia a este bloco.

## Validacao local

- Comparacao SHA-256: 50/50 arquivos extracted/public identicos.
- `python tools\data\qa_lacunas_sorocaba.py --markdown docs\qa-lacunas-sorocaba-2026-06-02.md --date 2026-06-02`
- `python tools\memory\validate-knowledge-base.py`
- `python tools\agents\check-scope-gates.py`
- `python pipelines\testes\verificar_publicacao.py --strict`
- `python tools\agents\validate-area.py --area memory`
- `python tools\agents\validate-area.py --area publication`
- `git diff --check`
