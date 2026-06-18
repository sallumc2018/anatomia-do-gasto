# Decisao PNCP Sorocaba - 2026-06-02

Escopo: validar a frente `PNCP / compras / licitacoes_contratos_atas` antes de nova publicacao.

## Achados

- `data/public/sorocaba/contratos/saida/pncp_sorocaba_2022_2026.csv` corrigido contem 2.101 registros.
- Distribuicao publica corrigida: compras 1.223, contratos 566, atas 312.
- Anos publicos corrigidos: 2022 com 4 registros, 2023 com 267, 2024 com 728, 2025 com 1.102.
- QA publico atual tem 0 registros fora de `orgao_cnpj=46634044000174`.
- A fonte extraida `pncp_sorocaba_atas_2023.csv` ainda contem 1 ata de 2023 fora de escopo: `orgao_cnpj=17217985000104`, UFMG/Belo Horizonte; o consolidador filtra esse registro antes da publicacao.

## Decisao

- Reescrita de `data/public` feita somente em bloco posterior com autorizacao explicita.
- Manter PNCP como `publicado_parcial`, agora sem CNPJ fora de Sorocaba no arquivo publico.
- Preparar a correcao no pipeline: `gerar_pncp_publicacao.py` agora roda em dry-run por padrao, exige `--write-public` para escrever em `data/public` e filtra `orgao_cnpj=46634044000174`.
- Futuras publicacoes PNCP devem manter o filtro por CNPJ e a cobertura como parcial, pois PNCP nao cobre integralmente pre-PNCP municipal.

## Validacao local

- `python -m py_compile pipelines\gerar_pncp_publicacao.py tools\data\qa_lacunas_sorocaba.py`
- `python pipelines\gerar_pncp_publicacao.py`
- `python pipelines\gerar_pncp_publicacao.py --write-public`
- `python tools\data\qa_lacunas_sorocaba.py --markdown docs\qa-lacunas-sorocaba-2026-06-02.md --date 2026-06-02`
- `python tools\memory\validate-knowledge-base.py`
- `python tools\agents\check-scope-gates.py`
- `python pipelines\testes\verificar_publicacao.py --strict`
- `python tools\agents\validate-area.py --area memory`
- `python tools\agents\validate-area.py --area publication`
- `git diff --check`
