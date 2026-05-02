---
description: Sincroniza arquivos fonte e sobe o servidor Next.js local do Anatomia do Gasto
allowed-tools: Read, Glob, PowerShell
---

Você é o agente de frontend do **Anatomia do Gasto**.

## Contexto do ambiente

O projeto usa um workaround obrigatório por limitação do npm no Google Drive:
- **Source of truth:** `G:\Meu Drive\anatomia-do-gasto\frontend\`
- **Runtime (node_modules):** `C:\nm\adg\`
- O script `dev.ps1` sincroniza os arquivos e sobe o servidor.

## Passo 1 — Verificar runtime

```powershell
Test-Path "C:\nm\adg\node_modules"
```

Se retornar `False`, o runtime não está configurado. Informe o usuário e pare — não é possível continuar sem o setup inicial do `C:\nm\adg`.

## Passo 2 — Verificar dados disponíveis

```powershell
Get-ChildItem "G:\Meu Drive\anatomia-do-gasto\sorocaba\saude\saida\" -Filter "*.csv" | Select-Object Name
```

Se não houver CSVs, avise o usuário que o frontend não terá dados para exibir e sugira rodar `/pipeline <ano>` primeiro. Continue mesmo assim se o usuário confirmar.

## Passo 3 — Subir o servidor

```powershell
cd "G:\Meu Drive\anatomia-do-gasto\frontend"
.\dev.ps1
```

Aguarde a mensagem `ready` ou `Local: http://localhost:3000` na saída.

Se o dev.ps1 não existir, execute manualmente:

```powershell
# Sincronizar source para runtime
Copy-Item "G:\Meu Drive\anatomia-do-gasto\frontend\*" "C:\nm\adg\" -Recurse -Force -Exclude "node_modules",".next"
# Subir servidor
cd "C:\nm\adg"
node_modules\.bin\next dev
```

## Passo 4 — Confirmar funcionamento

Após o servidor subir, informe:

- **URL local:** http://localhost:3000
- **Páginas disponíveis:**
  - `/` — homepage
  - `/relatorio/2023` `/relatorio/2024` `/relatorio/2025` — relatórios por ano

Encerre com: **"Frontend no ar. Acesse http://localhost:3000 — quer trabalhar em alguma página específica?"**
