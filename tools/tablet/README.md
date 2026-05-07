# Tablet operacional

Scripts para transformar um tablet Android simples em terminal de status e armazenamento portatil do Anatomia do Gasto.

## Modelo de uso

- O tablet guarda apenas dados publicos e documentacao operacional.
- A pasta principal no tablet e `/sdcard/AnatomiaDrive`.
- O painel visual roda no Termux por `~/bin/status-tablet`.
- A sincronizacao usa ADB; SSH e opcional.
- A infraestrutura persistente do Android no Windows deve ficar em `C:\infra`, nao em `C:\tmp`.

## Comandos

No Windows, a partir da raiz do repositorio:

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\sync-anatomia-tablet.ps1
powershell -ExecutionPolicy Bypass -File tools\tablet\start-tablet-panel.ps1
powershell -ExecutionPolicy Bypass -File tools\tablet\check-tablet.ps1
```

Para remover apps de consumo do usuario atual do tablet:

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\debloat-tablet.ps1
```

## Seguranca

- Os scripts nao contem senhas, tokens, chaves ADB ou chaves SSH.
- `pm uninstall --user 0` remove apps apenas para o usuario atual; nao apaga a particao de sistema.
- Antes do debloat, a lista de pacotes e salva em `C:\infra\logs\tablet\packages\`.
- Para restaurar um pacote removido:

```powershell
C:\infra\adb\adb.exe shell cmd package install-existing nome.do.pacote
```

## O que vai para o tablet

- `README.md`
- `AI_MASTER_PROMPT.md`
- `CODEX.md`
- `CLAUDE.md`
- `docs/`
- `data/manifests/`
- `data/public/`
- `backups/anatomia-do-gasto-publico.zip`

Nao sao copiados `node_modules`, `.next`, `.git`, `.env.local`, `data/raw`, `data/extracted` ou `data/validated`.
