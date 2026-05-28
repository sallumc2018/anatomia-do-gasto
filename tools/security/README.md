# Watchdog local de seguranca

Scripts read-only para monitorar o estado minimo de seguranca do projeto no Windows.

## Arquivos gerados

- `C:/Omega/tmp/omega-security-status.txt`: status resumido do watchdog.
- `C:/Omega/tmp/omega-security-last-check.txt`: saida da ultima auditoria.
- `C:/Omega/tmp/omega-security-watch.log`: historico do watchdog.
- `C:/Omega/tmp/omega-codex-status.txt`: resumo curto para agentes.
- `C:/Omega/tmp/omega-codex-trigger.txt`: ultimo alerta ativo para Codex/Claude.
- `C:/Omega/tmp/omega-security-triggers/`: historico de triggers para agentes.
- `C:/Omega/tmp/omega-security-alerts/`: fila/historico de notificacoes externas.
- `C:/Omega/tmp/omega-security-events.jsonl`: log estruturado Nós vs Terceiros.
- `C:/Omega/tmp/omega-pc-status.txt`: status legivel do PC.
- `C:/Omega/tmp/omega-pc-status.json`: status estruturado do PC.

`C:/Omega/tmp` e operacional local, mas nao deve ser versionado. Alertas importantes devem ser revisados e, se necessario, movidos para area operacional privada fora do repositorio.

## Classes de eventos

O log `omega-security-events.jsonl` diferencia claramente origem e responsabilidade:

- `OWN_CHANGE`: acao manual do operador local.
- `AGENT_CHANGE`: acao de Codex ou Claude reconhecida por baseline.
- `WATCHDOG_CHANGE`: arquivo/status gerado pelo watchdog.
- `THIRD_PARTY_CHANGE`: alteracao inesperada em arquivo vigiado.
- `SYSTEM_EVENT`: reboot, falha local, ausencia de dependencia, dev server fora.
- `EXTERNAL_ALERT`: evento vindo de canal externo configurado.

## Iniciar

```powershell
powershell -ExecutionPolicy Bypass -File tools\security\start-security-watch.ps1
```

O watchdog executa:

- triagem read-only de supply chain npm;
- verificacao de arquivos sensiveis versionados;
- regra de que o frontend nao le `data/raw`, `data/extracted` ou `data/validated`;
- verificacao da API publica de dados;
- lint/build somente quando iniciado com `-RunBuildChecks`, pois scripts npm exigem autorizacao explicita durante a campanha de supply chain;
- checagem de rotas locais quando `localhost:3000` estiver respondendo;
- geracao de status do PC.

## Reconhecer mudancas autorizadas

Depois de alterar intencionalmente arquivos vigiados, atualize a baseline para evitar falso alerta:

```powershell
powershell -ExecutionPolicy Bypass -File tools\security\reset-security-watch-baseline.ps1
```

Use isso apenas depois de revisar o diff e confirmar que a mudanca foi autorizada.

## Inicializacao automatica

```powershell
powershell -ExecutionPolicy Bypass -File tools\security\register-security-watch-startup.ps1
```

Isso cria um `.cmd` no Startup do Windows. A tarefa agendada alternativa fica em `register-security-watch-task.ps1`, mas nao e obrigatoria.

## Alertas por email

Padrao recomendado: email SMTP com credencial local criptografada pelo Windows DPAPI.

1. Criar template de configuracao e credencial:

```powershell
powershell -ExecutionPolicy Bypass -File tools\security\create-alert-email-credential.ps1
```

2. Editar `C:/Omega/03_Ferramentas/infra/omega-security-alerts.json`:

```json
{
  "enabled": true,
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "enableSsl": true,
  "from": "seu-email@gmail.com",
  "to": ["seu-email@gmail.com"]
}
```

3. Para Gmail, use senha de app, nao a senha normal da conta.

O arquivo `C:/Omega/Sensivel/infra/secrets/omega-security-smtp.credential.xml` nao deve ser copiado para o repositorio. Ele so descriptografa no mesmo usuario Windows que o criou.

## WhatsApp

WhatsApp nao e o caminho padrao porque automacao via WhatsApp Web e fragil e insegura, e a API oficial costuma exigir configuracao Meta/Business e pode ter custo por conversa. Para alerta gratuito e seguro, email SMTP local e melhor.

Se for necessario WhatsApp no futuro, usar apenas API oficial ou provedor com webhook auditavel, nunca automacao de tela nem armazenamento de sessao no repositorio.
