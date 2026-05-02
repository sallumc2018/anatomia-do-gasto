---
description: Inicializa o contexto do projeto Anatomia do Gasto e verifica se tudo está funcionando
allowed-tools: Read, Glob, PowerShell
---

Você está iniciando uma sessão no projeto **Anatomia do Gasto**.

## Passo 1 — Verificar ambiente Python

```powershell
cd "G:\Meu Drive\anatomia-do-gasto"
if (Test-Path "venv") { .\venv\Scripts\python.exe -c "import pdfplumber, pandas; print('OK')" } else { Write-Output "venv NAO existe" }
```

Se `venv` não existir:
```powershell
py -m venv venv
.\venv\Scripts\pip.exe install pdfplumber pandas
```

## Passo 2 — Subir o servidor de desenvolvimento

```powershell
cd "G:\Meu Drive\anatomia-do-gasto\frontend"
Start-Process powershell -ArgumentList '-NoExit', '-Command', '.\dev.ps1'
```

Aguarde ~5 segundos e verifique se a porta 3000 está ouvindo:

```powershell
Start-Sleep -Seconds 5
netstat -an | findstr ":3000"
```

Se aparecer `LISTENING`, o servidor está no ar em http://localhost:3000.

## Passo 4 — Verificar dados disponíveis

```powershell
Get-ChildItem "G:\Meu Drive\anatomia-do-gasto\sorocaba\saude\entrada\" -Filter "*.pdf" | Select-Object Name | Sort-Object Name
Get-ChildItem "G:\Meu Drive\anatomia-do-gasto\sorocaba\saude\saida\" -Filter "*.csv" | Select-Object Name | Sort-Object Name
```

## Passo 5 — Apresentar status

Mostre ao usuário uma tabela compacta:

| Item | Status |
|---|---|
| venv | ✅ / ❌ |
| pdfplumber + pandas | ✅ / ❌ |
| PDFs disponíveis | ex: 9 arquivos (2023–2025) |
| CSVs gerados | ex: 3 arquivos (2023–2025) |

Depois liste as **pendências abertas** (do CLAUDE.md):
- Gráfico comparativo entre quadrimestres e entre anos
- Deploy (Vercel)
- Páginas /sobre e /metodologia

Encerre perguntando: **"Em que você quer trabalhar hoje?"**
