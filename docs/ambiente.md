# Ambiente Local

Este projeto deve funcionar com a mesma estrutura no Windows, no WSL/Linux, no GitHub e na Vercel. O que muda entre ambientes são dependências locais, caches e variáveis privadas.

## Windows

Clone recomendado:

```powershell
cd C:/projetos
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

Infraestrutura local persistente recomendada para a operacao do tablet:

```text
C:/Omega/03_Ferramentas/infra/
  adb\
  usb_driver\
  android-adb-home\
  logs\
    tablet\

C:/Omega/Sensivel/infra/
  secrets\
```

No workspace Omega reorganizado, a infraestrutura equivalente pode estar em:

```text
C:/Omega/Sistema/Ferramentas_WSL_e_Binarios/infra/
  adb\
  android-adb-home\
  omega-tablet-ssh.json

C:/Omega/Sistema/Sensivel_Chaves_e_Credenciais/infra/
  secrets\
```

Os scripts de tablet aceitam `-Adb` e priorizam o caminho reorganizado quando existir.

`C:/tmp` deve ser tratado como area descartavel. O projeto deve usar `C:/Omega/tmp` para status operacional local que precisa ser lido por agentes, watchdog ou tablet.

O watchdog local de seguranca usa `C:/Omega/tmp` para status operacional, `C:/Omega/03_Ferramentas/infra` para configuracoes operacionais locais e `C:/Omega/Sensivel/infra/secrets` para segredos:

```text
C:/Omega/tmp\
  omega-security-status.txt
  omega-security-last-check.txt
  omega-security-watch.log
  omega-security-alerts\
  omega-security-triggers\
  omega-security-events.jsonl
  omega-pc-status.txt
  omega-pc-status.json

C:/Omega/03_Ferramentas/infra/
  omega-security-alerts.json
  omega-tablet-ssh.json

C:/Omega/Sensivel/infra/
  secrets\
    omega-security-smtp.credential.xml
    omega-tablet-status-ed25519
    omega-tablet-known_hosts
```

Arquivos em `C:/Omega/Sensivel/infra/secrets` nunca devem ser copiados para o repositorio.

PDFs grandes e acervos brutos devem permanecer fora do disco C. No Windows, use `G:\Meu Drive` como acervo operacional e aponte o pipeline para ele:

```powershell
$env:ANATOMIA_RAW_ROOT = "G:\Meu Drive\Omega-data\raw"
```

Com essa variavel, `pipelines/paths.py` resolve `data/raw` para `G:\Meu Drive\Omega-data\raw\<municipio>`. Nao copie PDFs grandes para `C:/Omega` nem para `data/raw` dentro do checkout em C:.

Para sincronizar o WSL com o estado atual do GitHub (quando necessário):

```powershell
powershell -ExecutionPolicy Bypass -File tools\dev\sync-wsl-mirror.ps1
```

## WSL/Linux (ambiente primário de desenvolvimento)

O WSL é o ambiente principal para código, pipeline e Codex. Clone dentro do filesystem Linux — não em `/mnt/c` — para melhor desempenho:

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

RTK:

```bash
# Instalar (uma vez)
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | bash
# Ativar hook global do Claude Code
rtk init -g
# Verificar economia
rtk gain
```

## RTK

O RTK é tratado como ferramenta local de economia de contexto/token, não como dependência de runtime do projeto.

Regras:

- instalar o binário localmente em cada ambiente que for usar RTK;
- não versionar `rtk.exe`, binários Linux, caches ou artefatos gerados;
- registrar em `tools/rtk/README.md` os comandos usados para criar índices/resumos;
- preferir saídas textuais compactas versionáveis quando elas forem úteis para qualquer sessão futura.
- registrar economia auditavel de trabalhos substantivos em `memory/token-economy/YYYY-MM.md`; RTK mede/filtra localmente, mas caches e bancos locais continuam fora do Git.

## Vercel

Configuração esperada:

- Repository: `sallumc2018/anatomia-do-gasto`
- Branch: `main`
- Root Directory: `apps/web`
- Build Command: `npm run build` (o script usa `next build --webpack`; `npm run dev` continua em `next dev`/Turbopack local)
- Install Command: `npm ci --ignore-scripts`
- Deploy CLI: respeitar `.vercelignore`; ele exclui `tmp`, logs, segredos e camadas internas (`data/raw`, `data/extracted`, `data/validated`).

O site lê somente `data/public`, que deve estar commitado depois da validação local.

## Nunca Versionar

- `.venv/`
- `venv/`
- `apps/web/node_modules/`
- `apps/web/.next/`
- `apps/web/.env.local`
- caches do RTK
- arquivos brutos baixáveis quando decidirmos mover para Git LFS ou releases
