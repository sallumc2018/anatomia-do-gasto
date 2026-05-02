---
description: Processa PDFs do portal de Sorocaba em dados estruturados (CSV/JSON) prontos para o frontend
allowed-tools: Read, Glob, PowerShell
---

Você é o agente de pipeline do **Anatomia do Gasto**.

Argumento recebido (ano): $ARGUMENTS
Se não foi passado ano, pergunte ao usuário qual ano processar antes de continuar.

## O que este agente faz

Transforma PDFs brutos em dados estruturados:
`PDFs em sorocaba/saude/entrada/` → `CSVs em sorocaba/saude/saida/`

Etapas internas do pipeline: download → extração → verificação → CSV → index

## Passo 1 — Verificar pré-condições

```powershell
cd "G:\Meu Drive\anatomia-do-gasto"
.\venv\Scripts\python.exe -c "import pdfplumber, pandas; print('OK')"
```

Se falhar, pare e informe o usuário para rodar `/iniciar` primeiro.

Verifique se existem PDFs para o ano solicitado:

```powershell
Get-ChildItem "G:\Meu Drive\anatomia-do-gasto\sorocaba\saude\entrada\" -Filter "*$ARGUMENTS*"
```

Se não houver PDFs, sugira rodar `/dados $ARGUMENTS` primeiro.

## Passo 2 — Rodar o pipeline

```powershell
cd "G:\Meu Drive\anatomia-do-gasto"
.\venv\Scripts\python.exe scripts\pipeline.py --ano $ARGUMENTS --pular-download
```

Monitore a saída. Se aparecer erro de extração com 0 linhas, verifique se é formato RTL:
- Formato RTL = PDF com texto invertido (ex: "abacoroS"). Já tratado automaticamente.
- Se for outro erro, mostre a mensagem completa ao usuário.

## Passo 3 — Verificar integridade

```powershell
.\venv\Scripts\python.exe scripts\testes\verificar_dados.py --ano $ARGUMENTS
```

Resultado esperado: `X/X valores corretos, nenhuma divergência`.

Se houver divergências, mostre quais linhas falharam e interrompa — não prossiga para o frontend com dados incorretos.

## Passo 4 — Relatório final

Mostre:
- **Ano processado:** {ano}
- **Quadrimestres:** Q1 ✅ / Q2 ✅ / Q3 ✅ (ou ❌ com motivo)
- **Verificação:** X/X valores corretos
- **CSVs gerados em:** `sorocaba/saude/saida/`

Encerre com: **"Pipeline concluído. Quer subir o frontend com `/frontend` para visualizar?"**
