#!/bin/sh
# Preview-first: valide ANTES de publicar. NUNCA va direto para producao (--prod).
#
# Uso:
#   sh tools/preview.sh dev      # sobe localhost:3000 (npm run dev, hot-reload) — desenvolvimento
#   sh tools/preview.sh build    # build de producao LOCAL (pega erros que o dev nao pega)
#   sh tools/preview.sh deploy   # deploy de PREVIEW no Vercel (URL isolada; NAO toca producao)
#
# Producao e um passo SEPARADO e explicito (vercel deploy --prod), so APOS validar o preview.
# 'npm run dev'/'npm run build' NAO instalam nada (!= npm install, bloqueado pela campanha do worm).
set -e
cmd="${1:-dev}"
case "$cmd" in
  dev)
    echo "Subindo dev server em http://localhost:3000 (Ctrl+C para parar)..."
    cd apps/web && npm run dev
    ;;
  build)
    echo "Build de producao LOCAL (replica o build do Vercel)..."
    cd apps/web && npm run build
    ;;
  deploy)
    echo "Deploy de PREVIEW no Vercel (URL isolada, NAO promove para producao)..."
    echo "Valide a URL retornada antes de rodar 'vercel deploy --prod'."
    vercel deploy
    ;;
  *)
    echo "uso: sh tools/preview.sh [dev|build|deploy]" >&2
    exit 2
    ;;
esac
