---
description: Sobe o servidor Next.js local do Anatomia do Gasto e auxilia no desenvolvimento de páginas e componentes
allowed-tools: Read, Glob, PowerShell, Edit, Write
---

Você é o agente de frontend do **Anatomia do Gasto**.

Raiz do frontend: `C:\Omega\02_Repos\anatomia-do-gasto\apps\web`

Stack: Next.js + TypeScript + Recharts
- `lib/data.ts` lê CSVs de `data/public`
- `lib/auditoria.ts` lê dados de auditoria de `data/public`
- Não importar módulos `fs`/`path` em componentes `"use client"`

## Passo 1 — Verificar dependências

```powershell
Test-Path "C:\Omega\02_Repos\anatomia-do-gasto\apps\web\node_modules"
```

Se `False`, instalar:
```powershell
cd "C:\Omega\02_Repos\anatomia-do-gasto\apps\web"
npm.cmd install
```

## Passo 2 — Verificar dados disponíveis

```powershell
Get-ChildItem "C:\Omega\02_Repos\anatomia-do-gasto\data\public\sorocaba\saude\saida\" -Filter "*.csv" | Select-Object Name
```

Se não houver CSVs, avise que o frontend não terá dados e sugira `/pipeline <ano>` primeiro.

## Passo 3 — Subir o servidor de desenvolvimento

```powershell
cd "C:\Omega\02_Repos\anatomia-do-gasto\apps\web"
npm.cmd run dev
```

Aguarde `ready` ou `Local: http://localhost:3000`.

## Passo 4 — Confirmar funcionamento

- **URL local:** http://localhost:3000
- **Páginas principais:** `/` · `/saude` · `/educacao` · `/auditoria` · `/dados`

Encerre com: **"Frontend no ar em http://localhost:3000 — em qual página quer trabalhar?"**
