# Preview-first: valide ANTES de publicar. NUNCA va direto para producao (--prod).
#
# Uso:
#   powershell -File tools/preview.ps1 dev      # localhost:3000 (npm run dev, hot-reload)
#   powershell -File tools/preview.ps1 build    # build de producao LOCAL (pega erros do build)
#   powershell -File tools/preview.ps1 deploy   # deploy de PREVIEW no Vercel (URL isolada)
#
# Producao e um passo SEPARADO e explicito (vercel deploy --prod), so APOS validar o preview.
# 'npm run dev'/'npm run build' NAO instalam nada (!= npm install, bloqueado pela campanha do worm).
param([string]$cmd = "dev")
switch ($cmd) {
  "dev" {
    Write-Host "Subindo dev server em http://localhost:3000 (Ctrl+C para parar)..."
    Push-Location apps/web; npm run dev; Pop-Location
  }
  "build" {
    Write-Host "Build de producao LOCAL (replica o build do Vercel)..."
    Push-Location apps/web; npm run build; Pop-Location
  }
  "deploy" {
    Write-Host "Deploy de PREVIEW no Vercel (URL isolada, NAO promove para producao)..."
    Write-Host "Valide a URL retornada antes de rodar 'vercel deploy --prod'."
    vercel deploy
  }
  default { Write-Error "uso: tools/preview.ps1 [dev|build|deploy]"; exit 2 }
}
