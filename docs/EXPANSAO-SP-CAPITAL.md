# 🗂️ EXPANSÃO SÃO PAULO CAPITAL — Arquivo-Mestre (fonte única)

> **Este é o hub.** Codex e Sallum começam por aqui. Detalhe em `expansao-sp-capital-scope.md`; handoff de execução em `_logs/2026-06-13_codex_handoff-coleta-sp-capital-onda1.md`; regras em `protocolo-dados-reais-expansao.md`.
> ⏰ **Codex SEM LIMITE até 18/06/2026** → coletar o máximo possível até lá.
> Município: **São Paulo Capital · IBGE 3550308 · DATASUS 355030**.

---

## 💾 ARQUITETURA DE STORAGE (crítico — ler antes de coletar)

PC tem **~68 GB livres** (disco ínfimo). GDrive tem **4,82 TiB livres**. Então:

- **`raw` (bruto, pesado) → GDrive**, NUNCA acumular no PC.
- **Local (repo) guarda só:** `data/extracted/sao-paulo/` (processado) + `data/manifests/sao-paulo/` + `data/public/sao-paulo/` (só promovido). São pequenos.
- **rclone remote:** `gdrive:` (auth OK, v1.74). Destino raw: **`gdrive:00-Omega/anatomia-do-gasto/sp-capital/raw/<area>/<fonte>/`**.

**Padrão obrigatório por pipeline (Codex):**
1. Baixar para staging temporário local (`data/raw/sao-paulo/_staging/`).
2. Extrair → `data/extracted/sao-paulo/` (fica local).
3. `rclone move "data/raw/sao-paulo/_staging/<x>" "gdrive:00-Omega/anatomia-do-gasto/sp-capital/raw/<x>"` → **move libera o disco** após upload.
4. Manifest registra o **caminho GDrive do raw + checksum** como evidência (satisfaz "rastreável/auditável" do contrato).
5. **Guardrail**: checar `df -h ~` entre lotes; se livre < 15 GB, parar e drenar para o GDrive.

---

## 📡 FONTES VERIFICADAS AO VIVO (2026-06-13)

| Fonte | Endpoint | Formato | Cobre |
|---|---|---|---|
| **CKAN Dados Abertos SP** | `dados.prefeitura.sp.gov.br/api/3/action/` (`package_list`/`package_show`/`datastore_search`) | API+CSV | orçamento, contratos, licitações, folha, servidores, saúde, educação (1.087 datasets) |
| **TCM-SP** | `portal.tcm.sp.gov.br/api/iris/dotacoes/{ano}/csv` | API REST | dotações + empenhos (mensal). Licitações via PNCP |
| **Câmara SP** | `saopaulo.sp.leg.br/transparencia/dados-abertos/` | XML | votações, presença, vereadores, custos de 55 gabinetes |
| **Transparência SP** | `transparencia.prefeitura.sp.gov.br` | CSV/XLSX | receitas/despesas (SOF) — **fallback, já no CKAN** |
| **Federais (reusar p/ 3550308)** | pipelines existentes config-driven | vários | SIOPS, FNDE/SIOPE, PNCP, FNS, transferências fed/est, SICONFI |

---

## ✅ WORKLIST + PROGRESSO (Codex atualiza os checkboxes)

### Onda 1 — APIs (rodar JÁ)
- [ ] Criar config do município SP (ibge=3550308) e rodar federais reusáveis: SIOPS (355030), FNDE/SIOPE, PNCP, FNS, transferências fed/est, SICONFI
- [ ] `extrator_sp_dados_abertos.py` (CKAN) — orçamento/contratos/licitações/folha/saúde/educação
- [ ] `baixar_tcm_sp.py` (API IRIS) — dotações/empenhos 2020–2026

### Onda 2 — XML/SOAP — detalhe: `docs/onda2-camara-sp.md`
- [ ] `baixar_camara_sp.py` — **custos de mandato/SisGV** (55 gabinetes), votações, presença, proposituras (SPLEGIS), RH (scrub do parecer)

### Onda 3 — fallback
- [ ] `baixar_transparencia_sp.py` — só gaps não cobertos pelo CKAN

### Validação (Claude)
- [x] **Parecer LAI/LGPD folha nominal** — `docs/parecer-lai-lgpd-folha-sp.md` (Tema 483/STF é específico de SP; gate de scrub na camada `extracted`)
- [ ] Revisão de manifests/QA pós-coleta do Codex
- [ ] Promoção a `data/public` — **só com autorização do autor**

---

## 🔒 REGRAS (do contrato)
- Estado só `raw`→`extracted`. NÃO `public`, NÃO deploy (Antigravity) sem autorização.
- zero ≠ ausente ≠ não-encontrado; classificar lacuna.
- Manifest + QA por coleta (campos mínimos do protocolo).
- `npm install` PROIBIDO. Commits `[Codex > GPT-5.5 > <Effort>]`.

## 📋 LOG DE COLETA (append conforme avança)
- 2026-06-13 — Scope + fontes verificadas + arquitetura de storage definidos (Claude/Fable). Aguardando Codex iniciar Onda 1.
- 2026-06-13 — **Parecer LAI/LGPD da folha nominal** concluído (`parecer-lai-lgpd-folha-sp.md`): publicar nome+remuneração é lícito (Tema 483/STF, caso da própria SP); controle-chave = gate de scrub de campos sensíveis na camada `extracted`.
- 2026-06-13 — **Onda 2 (Câmara SP) detalhada** (`onda2-camara-sp.md`): endpoints reais — SisGV (custos de mandato, SOAP), votações/presença (XML), SPLEGIS (proposituras), vereadores (TXT). SisGV = prioridade.
