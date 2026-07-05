# Decisões Arquiteturais e Pendências

## Decisões tomadas

### IBGE divergente — falsos rejeites (2026-07)
**Problema**: ~952 municípios eram marcados REJEITADOS na publicação.
**Causa**: municípios homônimos em estados diferentes compartilhavam o mesmo diretório legado.
Ex: `palmas/` pertencia a Palmas/TO (IBGE 1721000), mas Palmas/PR (IBGE 4117602) também tentava usar.
**Solução**: em `publicar_municipios_brasil.py`, quando `motivo.startswith("IBGE divergente") and input_key_used != key` → IGNORADO (não REJEITADO).

### MUNICIPIO_IBGE env var — extractors universais (2026-07)
**Problema**: 14 extractors SICONFI usavam `IBGE_SOROCABA = int(CFG["ibge"])`, hardcoded para Sorocaba.
**Solução**: `IBGE_SOROCABA = int(os.environ.get("MUNICIPIO_IBGE") or CFG["ibge"])` em todos os 14 extractors.
Agora qualquer município pode usar esses extractors passando a env var.

### Sprint 1 falhas opcionais (2026-07)
**Problema**: 9 municípios falhavam por falta de RPPS, segurança pública ou transporte.
**Solução**: `extrator_rpps.py`, `extrator_rreo_seguranca.py`, `extrator_dca_transporte.py`, `extrator_seguranca.py` movidos para `rodar_warn()` — falha conta como WARN, não FAIL.

### Sprint 2 server offline (2026-07)
**Problema**: servidor 192.168.15.9 offline por OOM (MemoryMax=800M aplicado).
**Solução atual**: Sprint 2 roda no PC principal via cron 05:05 UTC (≈02:05 BRT), `sprint2_24x7_worker.py --loop --sleep 30`, timeout 3h. Cursor em 218/5571 (3,9%) em 2026-07-05.

### npm install proibido — worm ativo
Projeto tem alerta de worm em node_modules. `npm install/update/audit fix` são PROIBIDOS.

## Pendências conhecidas

### Portal Transparência + FNDE/SIOPE — 403 por permissão
`baixar_transferencias_federais.py` e `baixar_fnde_siope.py` retornam HTTP 403.
**Causa**: `PORTAL_TRANSPARENCIA_KEY` não tem permissão para o tier `/transferencias/municipios`.
Diferença: 401 = chave expirada; 403 = chave válida mas sem a permissão "Transferências".
**Solução**: re-cadastrar em `api.portaldatransparencia.gov.br/api-de-dados/cadastrar-email`
  selecionando explicitamente o escopo "Transferências". Atualizar `~/.config/omega/secrets.env`.
  `fase_transferencias_federais` em `coletar_municipio_sp.py` já usa `rodar_warn()` para não bloquear.
**Status**: aguardando usuário renovar chave (2026-07-05).

### Server 192.168.15.9 offline
OOM fix aplicado (MemoryMax=800M no systemd). Loop de monitor ativo (Job 2745a37f).
Quando voltar: reativar sprint2_24x7_worker.py via systemd.

### RAG index sensível
`rag_full_index.py` foi morto (estava indexando dados pessoais + rodando 12h a 170% CPU).
RAG Omega pausado. RAG específico por projeto (este vault) é a abordagem correta.

### git history LGPD/CPF
Há CPFs de PF em commits antigos de data/. Pendente: git filter-branch ou BFG para sanitizar histórico.

## Configuração de segredos
Arquivo: `/home/sallumc/.config/omega/secrets.env` (fora do repo, nunca commitar)
Variáveis: `PORTAL_TRANSPARENCIA_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

### TCE contas anuais — bug RESOLVIDO (2026-07-05)
Bug histórico (2026-06-01): inventário retornava PDFs do Governador do Estado, não do município.
**Status atual**: ZIP `pareceres.csv` tem coluna `codigo_ibge`, o código em `inventariar_contas_anuais`
(linha 469-475) filtra corretamente. Verificado: Sorocaba=10 registros, Paulínia=10, Governador=0.
Dados cobertos: exercícios 2008-2022 com pareceres prévios do TCE-SP. Dados internos (`data/extracted/`).

### git history LGPD/CPF
Há CPFs de PF em commits antigos de `data/`. BFG Repo Cleaner pode limpar.
**Requer confirmação explícita do usuário antes de executar** (operação irreversível no histórico).
Comando proposto: `bfg --delete-files '*.csv' --private` (escopo exato a confirmar).

## Configuração de segredos
Arquivo: `/home/sallumc/.config/omega/secrets.env` (fora do repo, nunca commitar)
Variáveis: `PORTAL_TRANSPARENCIA_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

## Crons ativos (UTC → BRT -3h)

| UTC    | BRT    | Comando                                          |
|--------|--------|--------------------------------------------------|
| 00:03  | 21:03  | Shopee scan (pausado — requer ADB)               |
| 03:00  | 00:00  | `coleta_noturna.sh` (Sprint 1 + SP)              |
| 05:05  | 02:05  | `sprint2_24x7_worker.py --loop --sleep 30` 3h    |
| 06:00  | 03:00  | `keep_phone_awake.sh`                            |
| 07:00  | 04:00  | `offload-logs-gdrive.sh`                         |
| 08:10  | 05:10  | `vercel deploy --prod --yes --archive=tgz`       |

Pausados: Telegram inbox, Security watchdog, RAG update.
