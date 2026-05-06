# Ambiente Local

Este projeto deve funcionar com a mesma estrutura no Windows, no WSL/Linux, no GitHub e na Vercel. O que muda entre ambientes são dependências locais, caches e variáveis privadas.

## Windows

Clone recomendado:

```powershell
cd C:\projetos
git clone https://github.com/sallumc2018/anatomia-do-gasto.git
cd anatomia-do-gasto
```

Python:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Web:

```powershell
cd apps\web
npm.cmd install
npm.cmd run dev
```

Use `npm.cmd` no PowerShell para evitar conflito com `npm.ps1` quando a Execution Policy estiver restritiva.

## WSL/Linux

Clone recomendado dentro do filesystem Linux, não em `/mnt/c`, para melhor desempenho:

```bash
mkdir -p ~/projetos
cd ~/projetos
git clone https://github.com/sallumc2018/anatomia-do-gasto.git
cd anatomia-do-gasto
```

Python:

```bash
python3 -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt
```

Web:

```bash
cd apps/web
npm install
npm run dev
```

## RTK

O RTK é tratado como ferramenta local de economia de contexto/token, não como dependência de runtime do projeto.

Regras:

- instalar o binário localmente em cada ambiente que for usar RTK;
- não versionar `rtk.exe`, binários Linux, caches ou artefatos gerados;
- registrar em `tools/rtk/README.md` os comandos usados para criar índices/resumos;
- preferir saídas textuais compactas versionáveis quando elas forem úteis para qualquer sessão futura.

## Vercel

Configuração esperada:

- Repository: `sallumc2018/anatomia-do-gasto`
- Branch: `main`
- Root Directory: `apps/web`
- Build Command: `npm run build`
- Install Command: `npm install`

O site lê somente `data/public`, que deve estar commitado depois da validação local.

## Nunca Versionar

- `.venv/`
- `venv/`
- `apps/web/node_modules/`
- `apps/web/.next/`
- `apps/web/.env.local`
- caches do RTK
- arquivos brutos baixáveis quando decidirmos mover para Git LFS ou releases
