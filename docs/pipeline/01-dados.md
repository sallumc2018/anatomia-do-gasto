# Pipeline de Dados — Coleta e Publicação

## Etapas

### 1. Coleta (`baixar_*.py`)
- **Input**: fonte externa (API, portal, scraping)
- **Output**: `data/raw/{municipio}/{area}/`
- **Executor**: Antigravity (execução de scripts)
- **Regras**:
  - Nunca sobrescrever raw sem backup
  - Registrar URL, data e hash da resposta em `provenance/changes.csv`
  - Fontes com autenticação: credenciais via variável de ambiente, nunca hardcoded

### 2. Extração (`extrator_*.py`)
- **Input**: `data/raw/`
- **Output**: `data/extracted/`
- **Executor**: Antigravity ou Codex
- **Regras**:
  - Output deve ter schema documentado no header CSV
  - Campos ausentes: string vazia `""`, nunca `0` ou `N/A`
  - Datas: `YYYY-MM-DD` (ISO 8601)
  - Valores monetários: float em BRL, sem pontuação de milhar

### 3. Gate de publicação
```bash
python3 tools/gates/pre_publicacao.py {municipio}/{area}
# ou para tudo:
python3 tools/gates/pre_publicacao.py
```
O gate bloqueia se:
- Arquivo tem nome de teste/mock (prefixo `test_`, `mock_`, etc.)
- CSV tem menos de 2 linhas
- Colunas obrigatórias do schema ausentes
- Coluna com nome `ficticio`, `dummy`, `fake`

### 4. Publicação (`publicar_dados.py`)
- **Input**: `data/extracted/` + aprovação do gate
- **Output**: `data/public/{municipio}/{area}/saida/`
- **Executor**: Codex ou Claude Code
- **Regras**:
  - Nunca publicar dado com LAI pendente
  - Nunca publicar dado pessoal identificável (CPF, nome completo de pessoa física sem cargo público)
  - Atualizar `mapa_cobertura.csv` com status `publicado` ou `publicado_parcial`

### 5. Atualizar manifests
```bash
python3 pipelines/gerar_datasets_json.py
```
Obrigatório antes de qualquer deploy. Gera os dois arquivos JSON em sync.

## Schema mínimo de qualquer CSV publicado

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `ano` | integer | sim |
| `municipio` | string | sim (exceto datasets globais) |
| (campos de valor) | float | sem pontuação de milhar |

## Registro de proveniência

Todo arquivo publicado deve ter correspondência em:
- `data/manifests/{municipio}/mapa_cobertura.csv` — status e fonte
- `memory/provenance/changes.csv` — actor, ferramenta, modelo, paths, resumo
