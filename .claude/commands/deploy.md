---
description: Faz build do frontend e publica o Anatomia do Gasto na internet (Vercel ou GitHub Pages)
allowed-tools: Read, Glob, PowerShell
---

Você é o agente de deploy do **Anatomia do Gasto**.

## O que é deploy

Deploy = compilar o Next.js e publicar na internet para acesso público.
Hoje o site só roda localmente. Após o deploy, qualquer pessoa acessa pela URL pública.

## Passo 1 — Verificar pré-condições

**Git:**
```powershell
cd "G:\Meu Drive\anatomia-do-gasto"
git status
```

Se git não estiver inicializado, pare e instrua o usuário:
> "O deploy exige git. Posso inicializar agora com `git init` — quer prosseguir?"
Aguarde confirmação antes de continuar.

**Build funcional:**
```powershell
cd "C:\nm\adg"
node_modules\.bin\next build
```

Se o build falhar, mostre o erro completo e pare. Não faça deploy de código quebrado.

## Passo 2 — Detectar plataforma configurada

Verifique qual plataforma está configurada:

```powershell
Test-Path "G:\Meu Drive\anatomia-do-gasto\vercel.json"
Test-Path "G:\Meu Drive\anatomia-do-gasto\.github\workflows\deploy.yml"
```

**Se nenhuma estiver configurada**, apresente a escolha ao usuário:

> **Vercel** (recomendado): deploy automático a cada push, URL gerada na hora, gratuito para projetos pessoais.
> **GitHub Pages**: requer exportação estática (`next export`), sem rotas dinâmicas do servidor.
>
> Qual prefere?

Aguarde a resposta antes de continuar.

## Passo 3A — Deploy via Vercel

```powershell
cd "C:\nm\adg"
node_modules\.bin\vercel --prod
```

Se `vercel` não estiver instalado:
```powershell
cd "C:\nm\adg"
npm install vercel
```

Siga as instruções interativas do CLI para autenticação e configuração do projeto na primeira vez.

## Passo 3B — Deploy via GitHub Pages

Requer `next export` configurado em `next.config.js`. Se não estiver, instrua o usuário a adicionar:
```js
output: 'export'
```

Depois:
```powershell
cd "C:\nm\adg"
node_modules\.bin\next build
git -C "G:\Meu Drive\anatomia-do-gasto" add -A
git -C "G:\Meu Drive\anatomia-do-gasto" commit -m "deploy: build $(Get-Date -Format 'yyyy-MM-dd')"
git -C "G:\Meu Drive\anatomia-do-gasto" push
```

GitHub Actions fará o deploy automaticamente se o workflow estiver configurado.

## Passo 4 — Confirmar deploy

Após o deploy, informe:
- **URL pública:** (mostrar a URL retornada pelo CLI)
- **Plataforma:** Vercel / GitHub Pages
- **Build:** ✅ sem erros

Encerre com: **"Site publicado. Quer configurar deploy automático a cada push?"**
