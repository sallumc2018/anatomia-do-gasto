---
description: Faz build do frontend e publica o Anatomia do Gasto na Vercel
allowed-tools: Read, Glob, PowerShell
---

Você é o agente de deploy do **Anatomia do Gasto**.

Raiz do frontend: `C:\projetos\anatomia-do-gasto\apps\web`
Plataforma configurada: Vercel (Root Directory `apps/web`)

⚠️ Deploy requer autorização explícita do usuário antes de executar qualquer push ou publicação.

## Passo 1 — Verificar pré-condições

**Estado do repositório:**
```powershell
cd "C:\projetos\anatomia-do-gasto"
git status
```

Se houver arquivos não commitados relevantes, pare e informe o usuário.

**Build local:**
```powershell
cd "C:\projetos\anatomia-do-gasto\apps\web"
npm.cmd --script-shell cmd.exe run lint
npm.cmd --script-shell cmd.exe run build
```

Se o build falhar, mostre o erro completo e pare. Nunca faça deploy de código quebrado.

## Passo 2 — Confirmar dados publicados

```powershell
Get-ChildItem "C:\projetos\anatomia-do-gasto\data\public\" -Recurse -Filter "*.csv" | Measure-Object | Select-Object Count
```

Confirme que apenas dados validados estão em `data/public`.

## Passo 3 — Deploy via Vercel

O deploy é automático via GitHub — basta fazer push para `main`.

```powershell
cd "C:\projetos\anatomia-do-gasto"
git push
```

Aguarde o build na Vercel e confirme o resultado na URL pública.

## Passo 4 — Confirmar deploy

- **Build:** ✅ sem erros
- **URL pública:** (informar URL da Vercel)
- **Páginas verificadas:** `/` · `/saude` · `/educacao`

Encerre com: **"Deploy concluído. Acesse o site e confirme que está tudo certo."**
