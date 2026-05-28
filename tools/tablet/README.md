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
powershell -ExecutionPolicy Bypass -File tools\tablet\start-tablet-adb-status-loop.ps1
powershell -ExecutionPolicy Bypass -File tools\tablet\start-tablet-web-monitor.ps1
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

Quando o SSH/Termux nao estiver disponivel, use o sincronizador ADB para manter o tablet atualizado enquanto estiver conectado por USB:

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\start-tablet-adb-status-loop.ps1 -IntervalSeconds 15
```

O loop ADB grava `C:\Omega\tmp\omega-tablet-adb-sync-loop.pid` e `C:\Omega\tmp\omega-tablet-adb-sync-loop.log`. Ele atualiza `pc-status`, `security-status`, bateria e logs no tablet sem abrir porta de rede.

Por padrao, `update-tablet-status.ps1` sincroniza apenas o estado corrente. Para copiar tambem historicos volumosos de alertas/triggers de seguranca em uma execucao manual, use `-IncludeSecurityArchives`; nao use essa opcao no loop continuo.

Para visualizar o monitor em tempo quase real no Firefox do tablet, sem expor porta na rede local:

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\start-tablet-web-monitor.ps1
```

Esse comando cria `C:\Omega\tmp\omega-monitor.html`, serve `C:\Omega\tmp` em `127.0.0.1:8765`, aplica `adb reverse tcp:8765 tcp:8765` e abre o Firefox/Fennec no tablet. A pagina atualiza a cada 3 segundos.

No modo USB padrao, `127.0.0.1` fica acessivel ao tablet via `adb reverse` e nao expoe a porta na rede local. No modo Wi-Fi, informe explicitamente `-BindAddress` com o IP do PC e use `-MonitorRoot` apontando para um diretorio dedicado e sanitizado; o script recusa servir `C:\Omega\tmp` inteiro por Wi-Fi.

Para mostrar no tablet as mudancas que o Maestro Watch percebe no repositorio, inicie tambem:

```powershell
powershell -ExecutionPolicy Bypass -File tools\agents\start-maestro-watch.ps1
```

Esse watcher escreve o resumo local em `.local\agents\worktree-watch-current.json` e espelha somente o status publico/sanitizado em `C:\Omega\tmp\omega-worktree-watch.json`, que o monitor web le automaticamente.

Para evitar acumulo de abas e consumo de RAM no tablet, nao reexecute esse comando em loop. Quando chamado manualmente, ele encerra o processo do Firefox/Fennec e abre novamente apenas a URL do monitor.

O script tambem aplica fullscreen Android por pacote (`immersive.full=org.mozilla.fennec_fdroid`). Para nao aplicar essa configuracao, use `-SkipFullscreen`.

Para desfazer as alteracoes locais de tela do tablet, use:

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\start-tablet-web-monitor.ps1 -ResetAndroidState
```

Esse reset remove `policy_control`, desativa `svc power stayon` e volta `screen_off_timeout` para 10 minutos.

## Comunicacao sem cabo

Para operacao continua sem USB, o caminho principal deve ser Wi-Fi, nao Bluetooth.

- Wi-Fi permite HTTP local, SSH/SFTP, verificacao de host key, maior throughput e menor latencia.
- Bluetooth deve ficar apenas como contingencia manual, porque e mais lento, menos confiavel para automacao e pior para dashboard em tempo real.
- O desenho recomendado e: PC serve o monitor em porta local restrita ao IP do tablet; tablet abre no Firefox; atualizacoes operacionais usam SSH/SFTP com chave dedicada e fingerprint pinada quando Termux estiver disponivel.
- Para Wi-Fi, nunca use `C:\Omega\tmp` como raiz servida. Crie um diretorio publico/sanitizado e libere firewall apenas para o IP do tablet.
- Enquanto Termux/SSH nao estiver disponivel, ADB/USB permanece como modo de manutencao e recuperacao.

Fullscreen real: o modo atual com Firefox normal pode esconder barras do sistema via Android, mas ainda pode exibir a interface do navegador. Para kiosk/fullscreen de verdade, use uma destas opcoes:

1. abrir `omega-monitor.html` e adicionar a pagina a tela inicial quando o navegador oferecer modo app/PWA;
2. instalar um navegador kiosk dedicado e apontar para o monitor;
3. criar um app Android minimo/WebView para o HUD.

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
