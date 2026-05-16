# Tablet operacional

Scripts para transformar um tablet Android simples em terminal de status e armazenamento portatil do Anatomia do Gasto.

## Modelo de uso

- O tablet guarda apenas dados publicos e documentacao operacional.
- A pasta principal no tablet e `/sdcard/AnatomiaDrive`.
- O painel visual roda no Termux por `~/bin/status-tablet`.
- A sincronizacao de arquivos publicos pode usar ADB quando o tablet estiver em USB.
- O status operacional pode usar SSH/SCP pelo Wi-Fi com chave dedicada e host key pinada.
- A infraestrutura persistente do Android no Windows deve ficar em `C:\Omega\03_Ferramentas\infra`; secrets ficam em `C:\Omega\Sensivel\infra\secrets`; status local fica em `C:\Omega\tmp`.

## Comandos

No Windows, a partir da raiz do repositorio:

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\sync-anatomia-tablet.ps1
powershell -ExecutionPolicy Bypass -File tools\tablet\start-tablet-panel.ps1
powershell -ExecutionPolicy Bypass -File tools\tablet\check-tablet.ps1
powershell -ExecutionPolicy Bypass -File tools\tablet\update-tablet-status.ps1
powershell -ExecutionPolicy Bypass -File tools\tablet\create-tablet-ssh-key.ps1
powershell -ExecutionPolicy Bypass -File tools\tablet\update-tablet-status-ssh.ps1
```

Para remover apps de consumo do usuario atual do tablet:

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\debloat-tablet.ps1
```

## Seguranca

- Os scripts nao contem senhas, tokens, chaves ADB ou chaves SSH.
- `pm uninstall --user 0` remove apps apenas para o usuario atual; nao apaga a particao de sistema.
- Antes do debloat, a lista de pacotes e salva em `C:\Omega\03_Ferramentas\infra\logs\tablet\packages\`.
- Para restaurar um pacote removido:

```powershell
C:\Omega\03_Ferramentas\infra\adb\adb.exe shell cmd package install-existing nome.do.pacote
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
- status operacional em `/sdcard/AnatomiaTerminal/`, incluindo:
  - `security/security-status.txt`
  - `security/security-last-check.txt`
  - `security/security-watch.log`
  - `security/omega-security-alerts/`
  - `security/omega-security-triggers/`
  - `pc/pc-status.txt`
  - `pc/pc-status.json`

Nao sao copiados `node_modules`, `.next`, `.git`, `.env.local`, `data/raw`, `data/extracted` ou `data/validated`.

## Monitoramento do PC no tablet

Para atualizar manualmente o painel operacional no tablet:

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\update-tablet-status.ps1
```

Esse comando gera o status do PC em `C:\Omega\tmp\omega-pc-status.txt` e espelha status, logs e alertas do watchdog para `/sdcard/AnatomiaTerminal/`.

O comando `painel` no Termux mostra um resumo operacional compacto:

- memoria total, usada e livre;
- CPU usada;
- branch Git, quantidade de mudancas locais e diferenca contra o upstream;
- site, deploy e instrumentacao de analytics da ONG;
- disco, dev server, energia, SSH do tablet, keep-awake e alertas do Omega;
- estado do watchdog e contagem para a proxima verificacao.

As secoes `ANATOMIA DO GASTO`, `ONG` e `Omega` usam a cadencia do sincronizador do tablet, em ciclo aproximado de 30 segundos. A secao `Watchdog` usa a cadencia da auditoria local, por padrao 300 segundos.

Para manter o painel e o watchdog ativos com a tela do Windows bloqueada, rode tambem `tools\security\keep-awake.ps1`. Ele impede suspensao do sistema enquanto o processo estiver ativo; a tela ainda pode apagar ou ser bloqueada normalmente.

O sincronizador SSH deve ser iniciado por `tools\tablet\start-tablet-status-sync-loop.ps1`. Ele roda cada atualizacao em um processo separado com timeout; se uma conexao SSH/SCP ficar presa durante bloqueio de tela, troca de Wi-Fi ou suspensao do tablet, o ciclo atual e encerrado e o proximo tenta recuperar.

## Conexao segura por Wi-Fi

Para evitar interceptacao no caminho PC-tablet, use SSH com:

- chave Ed25519 dedicada em `C:\Omega\Sensivel\infra\secrets\omega-tablet-status-ed25519`;
- `StrictHostKeyChecking=yes`;
- `UserKnownHostsFile=C:\Omega\Sensivel\infra\secrets\omega-tablet-known_hosts`;
- fingerprint Ed25519 do Termux registrada em `C:\Omega\03_Ferramentas\infra\omega-tablet-ssh.json`.

Fluxo:

1. No PC, gerar chave:

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\create-tablet-ssh-key.ps1
```

2. No Termux, instalar/ativar OpenSSH e adicionar a chave publica em `~/.ssh/authorized_keys`.
   Se usar `termux-bootstrap.sh`, informe a chave publica explicitamente:

```sh
PC_PUBLIC_KEY='cole_a_chave_publica_gerada_pelo_PC' sh termux-bootstrap.sh
```

3. No Termux, conferir fingerprint:

```sh
ssh-keygen -lf $PREFIX/etc/ssh/ssh_host_ed25519_key.pub
```

4. No PC, editar `C:\Omega\03_Ferramentas\infra\omega-tablet-ssh.json` com IP, usuario Termux e fingerprint.
5. Atualizar status:

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\update-tablet-status-ssh.ps1
```

Se a fingerprint recebida pelo PC for diferente da registrada, o script para. Isso protege contra ataque de intermediario na rede local.
