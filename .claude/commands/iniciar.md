---
description: Inicializa o contexto do projeto Anatomia do Gasto e verifica todos os ambientes
allowed-tools: Read, Glob, PowerShell, Bash
---

Você está iniciando uma sessão no projeto **Anatomia do Gasto**.

Verifique todos os ambientes ativos e apresente um painel de status consolidado.

## Passo 1 — Ambiente WSL (desenvolvimento principal)

```bash
cd /mnt/c/Omega/02_Repos/anatomia-do-gasto
echo "=== Python ===" && .venv/bin/python -c "import pdfplumber, pandas; print('OK')" 2>/dev/null || echo "ERRO: .venv ou dependências ausentes"
echo "=== Node ===" && node --version && npm --version
echo "=== Git ===" && git status --short | head -10
echo "=== Branch ===" && git branch --show-current
```

Se o repositório não existir no WSL:
```bash
mkdir -p ~/projetos && cd ~/projetos
git clone https://github.com/sallumc2018/anatomia-do-gasto.git
```

## Passo 2 — Ambiente Windows (operações)

```powershell
# Python
$venvOk = Test-Path "C:\Omega\02_Repos\anatomia-do-gasto\.venv"
# Node
$nodeOk = Test-Path "C:\Omega\02_Repos\anatomia-do-gasto\apps\web\node_modules"
# ADB para tablet
$adbOk = Test-Path "C:\infra\adb\adb.exe"
# Infraestrutura
$infraOk = Test-Path "C:\infra"
Write-Host "Windows — .venv: $venvOk | node_modules: $nodeOk | ADB: $adbOk | C:\infra: $infraOk"
```

## Passo 3 — Dados disponíveis

```bash
echo "=== PDFs saúde ===" && ls data/raw/sorocaba/saude/entrada/*.pdf 2>/dev/null | wc -l
echo "=== PDFs educação ===" && ls data/raw/sorocaba/educacao/entrada/*.pdf 2>/dev/null | wc -l
echo "=== CSVs públicos (saúde) ===" && ls data/public/sorocaba/saude/saida/*.csv 2>/dev/null | wc -l
echo "=== CSVs públicos (educação) ===" && ls data/public/sorocaba/educacao/saida/*.csv 2>/dev/null | wc -l
```

## Passo 4 — Tablet (opcional, só se ADB disponível)

Se `C:\infra\adb\adb.exe` existir, rode em PowerShell:
```powershell
C:\infra\adb\adb.exe devices -l
```

## Passo 5 — Painel de status

| Ambiente | Item | Status |
|---|---|---|
| WSL | Python + dependências | ✅ / ❌ |
| WSL | Node + npm | ✅ / ❌ |
| WSL | Repositório sincronizado | ✅ / ❌ |
| Windows | .venv | ✅ / ❌ |
| Windows | node_modules | ✅ / ❌ |
| Windows | ADB (`C:\infra\adb\`) | ✅ / ❌ |
| Dados | PDFs saúde | N arquivos |
| Dados | PDFs educação | N arquivos |
| Dados | CSVs públicos | N arquivos |
| Tablet | Conectado via ADB | ✅ / ❌ / não verificado |

Encerre perguntando: **"Em que você quer trabalhar hoje?"**
