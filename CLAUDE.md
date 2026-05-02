# Anatomia do Gasto — contexto para Claude

## Paths críticos
- **Source of truth:** `G:\Meu Drive\anatomia-do-gasto\frontend\`
- **Runtime Node.js:** `C:\nm\adg\` (node_modules aqui; não versionar)
- **Dados de saída:** `G:\Meu Drive\anatomia-do-gasto\sorocaba\saude\saida`

## Rodar o projeto
```powershell
cd "G:\Meu Drive\anatomia-do-gasto\frontend"
.\dev.ps1   # sincroniza arquivos e sobe o Next.js dev server
```
Instalar pacote: `cd C:\nm\adg; npm install <pacote>`

## Por que esse setup existe
npm falha no Google Drive (EBADF no tar). `node_modules` fica em disco local.

## Stack
- Next.js + TypeScript + Recharts
- IBM Plex Sans (300/400/600) + IBM Plex Mono (números)
- Carbon Gray-100 dark theme — sem light mode
- Cor de destaque: `--blue-60: #0f62fe` (usar com parcimônia)

## Regra de importação (importante)
- `lib/types.ts` — browser-safe (interfaces + labels). Usar em client components.
- `lib/data.ts` — server only (usa `fs`/`path`). NUNCA importar em `"use client"`.

## Design — proibido
Gradientes, glassmorphism, border-radius > 4px em tiles de dados, animações de entrada, slogans vagos.

## Nome do projeto
**Anatomia do Gasto** — "Cidadão Nota 10" foi descartado. Não usar o nome antigo em código.

## Pipeline Python (dados)
- Scripts em `G:\Meu Drive\anatomia-do-gasto\scripts\`
- Dados em `sorocaba/saude/`
- Usar sempre `.\venv\Scripts\python.exe` (não `python`)

```powershell
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2025
# flags: --pular-download  --forcar
.\venv\Scripts\python.exe scripts\testes\verificar_dados.py --ano 2025
```

**Anos disponíveis:** 2023 ✅ 2024 ✅ 2025 ✅ (3 quadrimestres cada)

**Armadilha:** PDF 2023 Q2 tem formato RTL (texto invertido). Já tratado automaticamente — detecta "abacoroS" e ativa branch invertido. Se novo PDF retornar 0 linhas, verificar esse padrão primeiro.

## Pendências conhecidas
- Gráfico comparativo entre quadrimestres e entre anos
- Deploy (Vercel é o caminho natural)
- Páginas /sobre e /metodologia (links no header sem destino)
