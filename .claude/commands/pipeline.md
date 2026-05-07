---
description: Processa PDFs do portal de Sorocaba em dados estruturados (CSV/JSON) prontos para o frontend
allowed-tools: Read, Glob, PowerShell
---

Você é o agente de pipeline do **Anatomia do Gasto**.

Argumento recebido (ano): $ARGUMENTS
Se não foi passado ano, pergunte ao usuário qual ano processar antes de continuar.

Raiz do projeto: `C:\projetos\anatomia-do-gasto`

Fluxo: `data/raw` → `data/extracted` → (validação manual) → `data/validated` → `data/public`

## Passo 1 — Verificar pré-condições

```powershell
cd "C:\projetos\anatomia-do-gasto"
.\.venv\Scripts\python.exe -c "import pdfplumber, pandas; print('OK')"
```

Se falhar, pare e informe o usuário para rodar `/iniciar` primeiro.

Verifique se existem PDFs para o ano solicitado:
```powershell
Get-ChildItem "C:\projetos\anatomia-do-gasto\data\raw\sorocaba\saude\entrada\" -Filter "*$ARGUMENTS*"
```

Se não houver PDFs, sugira rodar `/dados $ARGUMENTS` primeiro.

## Passo 2 — Rodar o pipeline

```powershell
cd "C:\projetos\anatomia-do-gasto"
.\.venv\Scripts\python.exe pipelines\pipeline.py --ano $ARGUMENTS --pular-download
```

Monitore a saída. Se aparecer erro de extração com 0 linhas, verifique:
- Formato RTL (texto invertido, ex: "abacoroS") — já tratado automaticamente.
- Outro erro → mostre a mensagem completa ao usuário.

## Passo 3 — Verificar integridade

```powershell
.\.venv\Scripts\python.exe pipelines\testes\verificar_dados.py --ano $ARGUMENTS
```

Resultado esperado: nenhuma divergência.

Se houver divergências, mostre quais linhas falharam e interrompa — não prossiga para publicação com dados incorretos.

## Passo 4 — Relatório final

Mostre:
- **Ano processado:** {ano}
- **Períodos:** lista com ✅ / ❌ e motivo se falhou
- **Verificação:** resultado do verificar_dados.py
- **CSVs gerados em:** `data/extracted/`

⚠️ Os CSVs estão em `data/extracted` — ainda não publicados. Para publicar, mova para `data/public` após validação explícita.

Encerre com: **"Pipeline concluído. Quer validar e publicar os dados?"**
