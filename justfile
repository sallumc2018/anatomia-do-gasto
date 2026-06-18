# Justfile - Anatomia do Gasto
# Gerenciamento de pipelines de dados, auditoria e frontend usando uv e duckdb

# Instala todas as dependências do Python em um ambiente virtual usando uv
install-deps:
    uv venv .venv
    uv pip install -r requirements.txt
    # Instala também dependências de auditoria e OCR se necessário
    if [ -f requirements-audit.txt ]; then uv pip install -r requirements-audit.txt; fi

# Roda o diagnóstico de pontuação de cobertura para os municípios configurados
score:
    .venv/bin/python3 tools/diagnostico/calc_score.py

# Executa um script de pipeline com o município especificado (default: sorocaba)
# Exemplo: just run-pipeline extrator_rreo.py paulinia
run-pipeline pipeline municipio="sorocaba":
    MUNICIPIO={{municipio}} .venv/bin/python3 pipelines/{{pipeline}}

# Atualiza o catálogo central de datasets (gerar_datasets_json.py)
update-catalog:
    .venv/bin/python3 pipelines/gerar_datasets_json.py

# Valida os dados de uma área específica (ex: pipeline, publication, memory)
validate-area area:
    .venv/bin/python3 tools/agents/validate-area.py --area {{area}}

# Inicializa o servidor web Next.js local em modo de desenvolvimento
frontend:
    cd apps/web && npm run dev

# Faz deploy de produção direto para a Vercel
deploy:
    npx vercel deploy --prod --yes

# Executa uma consulta SQL em um arquivo de banco de dados local com DuckDB
# Exemplo: just query-local db_file SQL "SELECT * FROM licitacoes LIMIT 5"
query-local db_file SQL:
    duckdb {{db_file}} "{{SQL}}"

# Consolida os CSVs públicos em formato Parquet e faz upload para o Cloudflare R2
upload-r2:
    @uv run --with duckdb pipelines/duckdb_r2_sync.py --upload

# Executa uma consulta SQL remota nos arquivos Parquet hospedados no Cloudflare R2
# Exemplo: just query-r2 "SELECT * FROM r2_data LIMIT 5"
query-r2 SQL:
    @uv run --with duckdb pipelines/duckdb_r2_sync.py --query "{{SQL}}"

