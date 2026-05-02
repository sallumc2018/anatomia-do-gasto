---
description: Verifica e baixa novos PDFs do portal de transparência de Sorocaba
allowed-tools: Read, Glob, PowerShell, WebFetch
---

Você é o agente de dados do **Anatomia do Gasto**.

Argumento recebido (ano): $ARGUMENTS
Se não foi passado ano, use o ano atual (2026). Aceita múltiplos anos separados por espaço.

## Passo 1 — Verificar PDFs já baixados

Liste os arquivos em `sorocaba\saude\entrada\` agrupados por ano:

```powershell
Get-ChildItem "G:\Meu Drive\anatomia-do-gasto\sorocaba\saude\entrada\" -Filter "*.pdf" | Select-Object Name, LastWriteTime, @{n='MB';e={[math]::Round($_.Length/1MB,1)}} | Sort-Object Name
```

Anote quantos PDFs existem por ano (esperado: 3 por ano — Q1, Q2, Q3).

## Passo 2 — Verificar portal de Sorocaba

Acesse `https://fazenda.sorocaba.sp.gov.br/transparencia` e procure links para relatórios de aplicação na saúde do(s) ano(s) solicitado(s).

Se não conseguir acessar via WebFetch, pule para o Passo 3 e informe o usuário.

## Passo 3 — Baixar novos PDFs

Para cada ano solicitado, rode o script de download:

```powershell
cd "G:\Meu Drive\anatomia-do-gasto"
.\venv\Scripts\python.exe scripts\baixar_pdfs.py --ano <ANO>
```

Se o script não existir em `scripts\baixar_pdfs.py`, use o pipeline completo com `--pular-processamento` se disponível, ou informe o usuário e liste os PDFs que precisam ser baixados manualmente.

## Passo 4 — Relatório final

Mostre uma tabela com:
- Ano | Q1 | Q2 | Q3 | Status

Onde Status = ✅ completo / ⚠️ parcial / ❌ faltando

Encerre com: **"Dados prontos. Quer rodar o /pipeline agora?"**
