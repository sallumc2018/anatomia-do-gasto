---
description: Inicializa contexto minimo do Anatomia do Gasto e verifica ambientes
allowed-tools: Read, Glob, Bash, Bash
---

Voce esta iniciando uma sessao no projeto **Anatomia do Gasto**.

Contrato: siga `memory/agents/registry.csv`. Quando reduzir contexto, consulte `tools/memory/query-rag.py`; RAG nao substitui leitura direta dos arquivos. Registre handoff reutilizavel com `tools/memory/write-handoff.py` quando houver continuidade util.

Regra de topico: se o usuario trouxer novo assunto, area ou objetivo, avise para abrir nova conversa antes de continuar.

Objetivo: apresentar status consolidado sem reler arquivos longos.

Atalho preferencial:

```bash
cd ~/Documents/Omega/02-repos/00-anatomia-do-gasto
python tools\agents\start-topic.py "$ARGUMENTS" --rag-limit 3
```

## WSL

```bash
cd ~/Documents/Omega/02-repos/00-anatomia-do-gasto
.venv/bin/python -c "import pdfplumber, pandas; print('python OK')" 2>/dev/null || echo "python pendente"
node --version
npm --version
git status --short | head -30
git branch --show-current
```

## Windows

```bash
REPO=~/Documents/Omega/02-repos/00-anatomia-do-gasto
$adb = "~/Documents/Omega/03-ferramentas/adb/adb"
$infra = "~/Documents/Omega/03-ferramentas"
$venvOk = Test-Path "$repo\.venv"
$nodeOk = Test-Path "$repo\apps\web\node_modules"
$adbOk = Test-Path $adb
$infraOk = Test-Path $infra
Write-Host "Windows - .venv: $venvOk | node_modules: $nodeOk | ADB: $adbOk | infra: $infraOk"
```

## Dados publicados

```bash
cd ~/Documents/Omega/02-repos/00-anatomia-do-gasto
Get-ChildItem "data\public" -Recurse -File | Group-Object DirectoryName | Select-Object Count, Name
Get-ChildItem "data\manifests" -File | Select-Object Name, LastWriteTime
```

## Tablet opcional

Se `$adbOk` for verdadeiro:

```bash
& "~/Documents/Omega/03-ferramentas/adb/adb" devices -l
```

## Saida

```text
## Status inicial
- WSL:
- Windows:
- Git:
- Dados publicos:
- Tablet:
- Alertas:
- Proximo passo sugerido:
```
