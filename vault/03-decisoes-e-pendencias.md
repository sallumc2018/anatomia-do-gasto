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
**Problema**: servidor 192.168.15.9 offline por OOM (MemoryMax aplicado, aguardando estabilizar).
**Solução temporária**: Sprint 2 roda no PC principal via cron 00:05 BRT, 1 grupo/noite, timeout 2h.

### npm install proibido — worm ativo
Projeto tem alerta de worm em node_modules. `npm install/update/audit fix` são PROIBIDOS.

## Pendências conhecidas

### FNDE/SIOPE 403
`baixar_fnde_siope.py` retorna 403 em produção.
**Causa**: chave `PORTAL_TRANSPARENCIA_KEY` não tem permissão para endpoint `/transferencias`.
**Solução**: solicitar nova chave API com permissão correta. Sem ETA.

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

## Crons ativos (BRT)
- 00:00 — `coleta_noturna.sh` (Sprint 1 + SP)
- 00:05 — `sprint2_rotacao.sh --grupos 1` (Sprint 2, 1 grupo/noite)
- 05:00 — `vercel deploy --prod` (deploy frontend)
- Pausados: Shopee scan, Telegram inbox, Security watchdog, RAG update
