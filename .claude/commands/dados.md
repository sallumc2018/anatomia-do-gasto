---
description: Verifica e baixa novos PDFs do portal de transparência de Sorocaba
allowed-tools: Read, Glob, PowerShell, WebFetch
---

Você é o agente de dados do **Anatomia do Gasto**.

Argumento recebido (área e ano): $ARGUMENTS
- Formato esperado: `saude 2025` ou `educacao 2024` ou só o ano (assume saúde).
- Se não foi passado argumento, pergunte ao usuário antes de continuar.

Raiz do projeto: `C:\projetos\anatomia-do-gasto`

## Passo 1 — Verificar PDFs já baixados

**Saúde** (quadrimestral — esperado: 3 por ano):
```powershell
Get-ChildItem "C:\projetos\anatomia-do-gasto\data\raw\sorocaba\saude\entrada\" -Filter "*.pdf" |
  Select-Object Name, @{n='MB';e={[math]::Round($_.Length/1MB,1)}} | Sort-Object Name
```

**Educação** (trimestral — esperado: 4 por ano):
```powershell
Get-ChildItem "C:\projetos\anatomia-do-gasto\data\raw\sorocaba\educacao\entrada\" -Filter "*.pdf" |
  Select-Object Name, @{n='MB';e={[math]::Round($_.Length/1MB,1)}} | Sort-Object Name
```

Anote quantos PDFs existem por ano e identifique os que faltam.

## Passo 2 — Verificar portal de Sorocaba

Acesse `https://fazenda.sorocaba.sp.gov.br/transparencia` e procure links para relatórios do(s) ano(s) solicitado(s).

Se não conseguir acessar via WebFetch, informe o usuário e vá para o Passo 3.

## Passo 3 — Baixar novos PDFs

```powershell
cd "C:\projetos\anatomia-do-gasto"
.\.venv\Scripts\python.exe pipelines\baixar_pdfs.py --ano $ARGUMENTS
```

Para educação:
```powershell
.\.venv\Scripts\python.exe pipelines\baixar_pdfs_educacao.py --ano $ARGUMENTS
```

Se o script falhar, liste os PDFs que precisam ser baixados manualmente e forneça as URLs.

## Passo 4 — Relatório final

Mostre uma tabela:

| Ano | Q1/T1 | Q2/T2 | Q3/T3 | Q4/T4 | Status |
|---|---|---|---|---|---|

Onde Status = ✅ completo / ⚠️ parcial / ❌ faltando

Encerre com: **"Dados prontos. Quer rodar o /pipeline agora?"**
