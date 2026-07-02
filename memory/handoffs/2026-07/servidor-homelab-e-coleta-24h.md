# Handoff: Servidor Homelab + Coleta 24/7
**Data:** 2026-07-02
**Autor:** Claude Code > claude-sonnet-4-6 > Medium

---

## O que foi feito nesta sessão

### 1. Servidor homelab configurado (sallumc-server)

Laptop antigo (Intel Pentium P6200, 2.8GB RAM, 291GB HDD) convertido em servidor Ubuntu Server 24.04.2 LTS.

**Acesso:**
- SSH local: `ssh sallumc@192.168.15.9`
- SSH Tailscale: `ssh sallumc@100.101.213.112`
- Senha: em `~/.config/omega/secrets.env`

**Serviços instalados:**
- UFW firewall, Fail2ban, Tailscale, Docker 29.6.1
- python3-venv, rclone v1.60.1, git
- Clone do repo em `~/anatomia-do-gasto/` com venv + pip install completos

**Git remotes no servidor:**
- `origin` → `git@github.com:sallumc2018/anatomia-do-gasto.git` (SSH, deploy key adicionada)
- (bare repo local em `~/repos/anatomia-do-gasto.git` para push do PC)

### 2. Coleta migrada para o servidor (24/7)

**Cron servidor** (`~/coleta_wrapper.sh`, roda a cada 4h):
```
0 */4 * * * /home/sallumc/coleta_wrapper.sh
```

**Wrapper** (`~/coleta_wrapper.sh`) faz:
1. `git pull origin main` — pega código mais recente
2. `bash scripts/coleta_noturna.sh` — coleta com venv ativo
3. `git add data/public/ && git commit` — commita dados novos
4. `git push origin main` → GitHub → Vercel auto-redeploy

**Deploy Vercel no PC principal** (cron a ser adicionado pelo usuário às 04:00):
```bash
(crontab -l; echo '0 4 * * * cd ~/Documents/Omega/02-repos/00-anatomia-do-gasto && git pull origin main >> _logs/deploy_cron.log 2>&1 && npx vercel deploy --prod --yes >> _logs/deploy_cron.log 2>&1') | crontab -
```

### 3. Secrets sincronizados para o servidor

Usuário rodou manualmente:
```bash
rsync -az ~/.config/rclone/rclone.conf sallumc@192.168.15.9:~/.config/rclone/rclone.conf
rsync -az ~/.config/omega/ sallumc@192.168.15.9:~/.config/omega/
```

### 4. Três bugs corrigidos no pipeline (commit 2da04af)

**Bug 1 — Sprint 1 exit 1 falso-positivo** (`coletar_municipio_sp.py`):
- Causa: `Rreo Transporte`, `DCA Transporte`, `Rreo Segurança` usavam `rodar()` (fatal)
- Municípios sem transporte público (ex: São Vicente) sempre falhavam
- Fix: rebaixados para `rodar_warn()` — ausência de dados de transporte não é erro

**Bug 2 — FNS inventário rejeitado pelo gate** (`publicar_municipios_brasil.py`):
- Causa: `inventario_fns_*.csv` são arquivos de metadados sem coluna de município
- O gate de integridade exige coluna IBGE para área `fns` → bloqueava ~470 municípios
- Fix: arquivos `inventario_*` pulam o gate e são copiados diretamente

**Bug 3 — Sprint 2 timeout (exit 143)** (`scripts/coleta_noturna.sh`):
- Causa: `--grupos 2` processava RO+TO (191 municípios) em uma rodada → 4h30min → kill
- Fix: `timeout 3h bash sprint2_rotacao.sh --grupos 1`
- Com cron a cada 4h: 1 grupo por rodada, ciclo completo do Brasil em ~3 dias

---

## Estado atual da cobertura Sprint 2

Grupos processados até 2026-07-02:
- ✅ AC, AP, RR (53 municípios) — commit `77f79fd2`
- 🔄 RO, TO (191 municípios) — estava travado, agora com timeout 3h

UFs pendentes (0% cobertura federal): AL, BA, CE, DF, ES, GO, MA, MG, MS, MT, PB, PE, PI, PR, RJ, RN, RS, SC, SE

**Índice atual do estado:** `_logs/sprint2_rotacao/estado.txt` — contém o número do próximo grupo

---

## Problema pendente: colisão de nomes de municípios

Municípios com mesmo slug em estados diferentes (ex: `palmas` = Palmas/PR ou Palmas/TO) estão sendo publicados no mesmo diretório sem diferenciação por UF. O relatório de cobertura Sprint 2 lista ~40 casos.

**Impacto:** dados de uma UF sobrescrevem dados da outra no mesmo diretório slug.
**Solução necessária:** adicionar UF ao key do diretório (ex: `palmas_to/`, `palmas_pr/`) ou usar código IBGE como diretório.

---

## Regra de routing (confirmada pelo usuário)

> "Serviços leves 24/7 → servidor. Ollama e Dev → PC principal."

**Servidor:** cron, Python scripts, Nginx, Pi-hole, Samba, coleta, Omega jobs  
**PC principal:** Ollama/LLMs, dev ativo, builds, sessões Claude Code/Codex

---

## CLIs ativos

- **Claude Code:** coleta, pipelines, metodologia, publicação, deploy
- **Codex:** auditoria de código, bugs, DRY/SOLID, testes, gates
- **Antigravity:** fora do projeto desde 2026-07-02
