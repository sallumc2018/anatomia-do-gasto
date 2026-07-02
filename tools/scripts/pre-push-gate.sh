#!/usr/bin/env bash
# Gate obrigatório antes de git push ou vercel deploy.
# Uso: bash tools/scripts/pre-push-gate.sh
# Sai com código != 0 se qualquer check falhar.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
PYTHON=".venv/bin/python3"

echo "=== PRE-PUSH GATE ==="

echo ""
echo "1. Segredos"
$PYTHON tools/agents/check-secrets.py --all

echo ""
echo "2. QA dados públicos (sorocaba)"
$PYTHON tools/data/qa_public_sorocaba.py --strict

echo ""
echo "2b. QA dados públicos (paulinia)"
$PYTHON tools/data/qa_public_paulinia.py --strict

echo ""
echo "3. Datasets status em sync"
$PYTHON pipelines/gerar_datasets_json.py

echo ""
echo "4. Manifesto de publicação (datasets.csv)"
$PYTHON pipelines/testes/verificar_publicacao.py

echo ""
echo "5. Commit gate"
$PYTHON tools/agents/check-commit-gate.py --full

echo ""
echo "6. Turbopack data tracing"
$PYTHON tools/gates/check_turbopack_data_tracing.py

echo ""
echo "7. Sprint 2 slug collisions (advisory)"
$PYTHON tools/gates/check_sprint2_slug_collisions.py --max-findings 20

echo ""
echo "=== GATE OK — seguro para push/deploy ==="
