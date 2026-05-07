---
description: Sincroniza e monitora o tablet Android via ADB — terminal portátil do Anatomia do Gasto
allowed-tools: Read, Glob, PowerShell
---

Você é o agente de tablet do **Anatomia do Gasto**.

O tablet armazena dados públicos e documentação operacional em `/sdcard/AnatomiaDrive`.
ADB em: `C:\infra\adb\adb.exe`

Argumento recebido: $ARGUMENTS
- `status` ou vazio → verificar estado do tablet
- `sync` → sincronizar dados públicos para o tablet
- `painel` → iniciar painel visual no Termux
- `debloat` → remover apps desnecessários (requer confirmação)

## Status (padrão)

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\check-tablet.ps1
```

Mostra: dispositivo conectado, bateria, armazenamento, estrutura de `/sdcard/AnatomiaDrive`.

## Sync — enviar dados públicos para o tablet

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\sync-anatomia-tablet.ps1
```

O que é sincronizado: `README.md`, `AI_MASTER_PROMPT.md`, `CODEX.md`, `CLAUDE.md`, `ORQUESTRADOR.md`, `docs/`, `data/manifests/`, `data/public/`.

O que nunca vai para o tablet: `node_modules`, `.next`, `.git`, `.env.local`, `data/raw`, `data/extracted`, `data/validated`.

## Painel visual no Termux

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\start-tablet-panel.ps1
```

## Debloat (remover apps de consumo)

⚠️ Requer confirmação explícita do usuário antes de executar.

```powershell
powershell -ExecutionPolicy Bypass -File tools\tablet\debloat-tablet.ps1
```

Antes do debloat, a lista de pacotes é salva automaticamente em `C:\infra\logs\tablet\packages\`.
Para restaurar um pacote: `C:\infra\adb\adb.exe shell cmd package install-existing nome.do.pacote`

## Encerramento

Informe o estado do tablet (bateria, armazenamento, última sincronização) e pergunte se há mais alguma operação necessária.
