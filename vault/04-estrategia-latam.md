# Anatomia do Gasto — Estratégia LATAM

> Documento executivo. Atualizar quando houver mudança de escopo, blockers resolvidos
> ou marcos atingidos.
> **Última revisão:** 2026-07-05

---

## CEO — Missão e Posição Competitiva

**Missão:** Tornar os dados de gastos públicos municipais acessíveis, auditáveis e
comparáveis para todos os cidadãos da América Latina.

**Ambição declarada:** Maior portal de transparência fiscal da LATAM até 2027.

### Onde estamos agora

| Dimensão | Status | Meta LATAM |
|----------|--------|-----------|
| Cobertura BR | 218/5571 municípios (3,9%) | 5571/5571 (100%) |
| Cobertura LATAM | 0 países fora do Brasil | Argentina, Chile, México + |
| Features core | Score + Comparativo básico | API + Alertas + Relatórios |
| Audiência | Piloto local | Jornalistas, pesquisadores, cidadãos |
| Receita/funding | Zero (ONG bootstrap) | Grants OCDE/BID/NED, doações |

### Vantagem competitiva real vs Serenata de Amor, TCE-SP, Transparência Internacional

- **Cobertura total automatizada**: 5571 municípios com worker circular — nenhum concorrente faz isso
- **Dados estruturados e versionados**: CSV + Git — auditável, reproducível
- **Arquitetura multi-município nativa**: env var `MUNICIPIO` — escala zero-friction
- **Sprint 2 já operacional**: 300 municípios/noite, ~18 noites para Brasil completo
- **Stack moderno**: Next.js SSG + Python 3.12 pipelines — Serenata é de 2016 e está datada

### Linha do tempo para LATAM #1

```
2026-07  Brasil 5571 coletados (Sprint 2 completo)
2026-08  API pública + Comparativo nacional
2026-09  Alertas de anomalia (outlier detector)
2026-10  Relatórios automáticos PDF/email
2026-11  Argentina (budget.gob.ar) integrado
2026-12  v2.0 — LATAM launch (Chile + MX seed)
2027-Q1  Maior portal transparência LATAM
```

---

## CTO — Arquitetura e Dívida Técnica

### Stack atual

| Camada | Tecnologia | Saúde |
|--------|-----------|-------|
| Coleta | Python 3.12, requests, Playwright | ✅ Sólido |
| Storage | CSV em data/public/ + GDrive | ✅ Funcional |
| Frontend | Next.js 14 SSG, Vercel free tier | ⚠️ Limitado |
| Orquestração | cron jobs no PC principal | 🔴 SPOF |
| CI/CD | GitHub → Vercel deploy cron | ✅ Automático |

### Dívida técnica crítica

**🔴 P0 — Bloqueadores imediatos:**

1. **Portal Transparência 403** — chave sem permissão `/transferencias`
   - Fix: re-cadastro em `api.portaldatransparencia.gov.br` com escopo "Transferências"
   - Afeta: `baixar_transferencias_federais.py` e `baixar_fnde_siope.py` para todos os 5571 municípios
   - Workaround ativo: `rodar_warn()` (coleta continua sem travar)

2. **CPF em git history** — commits em `data/` de sessões anteriores
   - Fix: BFG Repo Cleaner — REQUER CONFIRMAÇÃO EXPLÍCITA DO USUÁRIO (irreversível)
   - Risco: violação LGPD se repositório for inspecionado

3. **npm worm ativo** — `npm install/update/audit fix` PROIBIDOS desde mai/2026
   - Consequência: `commitlint` ausente (hook falha com mensagem não-fatal)
   - Fix seguro: aguardar clearance do worm ou instalar apenas via `npm ci --ignore-scripts`

**⚠️ P1 — Urgente próximas 2 semanas:**

4. **PC principal = SPOF** — cron roda só no PC principal (192.168.15.6)
   - Servidor 192.168.15.9 estava offline por OOM (MemoryMax=800M aplicado, 2026-07-04)
   - Fix: mover Sprint 2 worker para servidor quando voltar estável

5. **Vercel free tier limitado** — `--archive=tgz` contorna o limite de 5000 arquivos
   - Risk: à medida que `data/public/` cresce, o build fica mais lento
   - Fix futuro: Vercel pro ou self-hosted (após funding)

**📋 P2 — Técnica:**

6. **Paulínia PNCP** — CNPJ 46.392.130/0001-18 inválido, Playwright necessário para descobrir correto
7. **SICONFI base falhas** — DCA Transporte, Rreo Transporte em 9/18 municípios (pré-existente)
8. **Ruff hotspot refactor** — chaves duplicadas pendentes (Codex)
9. **`segurança` e `transporte`** em TASKS.md — refatoração estrutural pendente (Codex)

### Próximas decisões arquiteturais

| Decisão | Opções | Recomendação |
|---------|--------|-------------|
| API pública | Vercel Edge Functions vs FastAPI próprio | Edge Functions (zero infra) |
| Alertas | Cron Python vs GitHub Actions | Cron Python (mais simples) |
| Storage > 5GB | GDrive + git vs S3/R2 | R2 (pago, ~$0.015/GB) após funding |
| LATAM sources | Adaptar sprint2 vs novo repo | Adaptar sprint2 (menor esforço) |

---

## CFO — Custo, Risco e Funding

### Custo atual (estimado mensal)

| Item | Custo | Risco |
|------|-------|-------|
| Vercel (free tier) | R$ 0 | Limite 5000 arquivos/deploy |
| GDrive (personal) | R$ 0 | Quota 15GB, sync via rclone |
| PC principal 24h/dia | ~R$ 80/mês eletricidade | SPOF operacional |
| Domínio `.ong.br` | ~R$ 40/ano | Baixo |
| **Total** | **~R$ 80/mês** | Concentrado em hardware único |

### Riscos financeiros

1. **Zero funding** — projeto inteiramente bootstrap; sem runway para escalar infra
2. **SPOF elétrico** — queda de luz no PC = coleta parada, dados defasados
3. **Vercel free tier** — quando `data/public/` passar de ~100MB, build fica lento demais

### Oportunidades de funding

| Fonte | Alinhamento | Valor estimado | Prazo |
|-------|------------|----------------|-------|
| OCDE OGP (Open Gov) | Alto | USD 20–50k | 6–12 meses |
| BID Transparência | Alto | USD 50–200k | 12–18 meses |
| NED (National Endowment) | Médio | USD 10–30k | 6–12 meses |
| Google.org/ANPD BR | Médio | R$ 50–200k | 6–12 meses |
| FAPESP (pesquisa) | Médio | R$ 50–100k | 12–24 meses |

**Pré-requisito para captação:** CNPJ da ONG formalizado + relatório de impacto público.

---

## CPO — Produto e Usuários

### Segmentos de usuários

| Segmento | Persona | O que precisa | Status |
|----------|---------|---------------|--------|
| Cidadão | João, 35, professor | Entender onde vai seu imposto | ✅ Score + narrativa |
| Jornalista | Ana, repórter investigativa | Alertas de anomalia + API | ❌ Falta alertas |
| Pesquisador | Dr. Lima, economista | Download CSV + série histórica | ✅ Parcial |
| Auditor público | Promotor | Comparativo + evidência | ⚠️ Comparativo básico |
| Dev/ONG | Dev cívico | API REST + webhook | ❌ Falta API |

### Roadmap de produto (priorizado por impacto/esforço)

```
Semana 1-2 (agora)
  [ALTO/BAIXO]  Execução vs Orçado → dados já existem (RREO), só falta dashboard
  [ALTO/MÉDIO]  API pública básica → 2 endpoints REST (orçamento + comparativo)

Semana 3-4
  [ALTO/MÉDIO]  Comparativo nacional → expandir /comparativo para top municípios BR
  [MÉDIO/BAIXO] Score público de todos os 5571 → página por município quando Sprint 2 cobrir

Mês 2 (agosto)
  [ALTO/ALTO]   Alertas de anomalia → outlier detector simples (sem IA)
  [MÉDIO/MÉDIO] Relatórios automáticos → PDF mensal por município

Mês 3-4 (set/out)
  [ALTO/ALTO]   LATAM seed → Argentina budget.gob.ar + Chile
  [MÉDIO/MÉDIO] Busca por fornecedor/CNPJ → índice invertido dos CSVs
```

### O que já existe e está subutilizado

- `/comparativo` — existe mas cobre só 3 municípios; pode cobrir top-50 com os dados do Sprint 2
- `data/public/*/siconfi/` — séries históricas 2019–2025 não expostas em dashboard
- Score 80,2% de Sorocaba — excelente, mas não há narrativa de "o que falta" para o usuário

---

## CMO — Marca, Distribuição e Comunicação

### Identidade atual

- **Site**: anatomiadogasto.ong.br — clean, técnico, pouco emocional
- **Tom**: Neutro/institucional (correto para ONG, mas não viraliza)
- **Reconhecimento**: Nenhum (projeto em fase silenciosa)

### O que construir antes de lançar publicamente

1. **Relatório de impacto** — "3 municípios cobertos, 218 municípios coletados, 5571 em progresso"
2. **Histórias de dados** — "Paulínia gasta 3x a média per capita em saúde — ou será erro?"
3. **Presença editorial** — newsletter mensal, Twitter/X técnico, Mastodon (público cívico)
4. **Integração com jornalistas** — Agência Pública, The Intercept Brasil, Piauí

### Momentos estratégicos de visibilidade

| Quando | Oportunidade | Ação |
|--------|-------------|------|
| Aug 2026 | Sprint 2 completo (5571) | Press release "Brasil todo coberto" |
| Out 2026 | Pré-eleições 2026 | Dashboard de gastos dos municípios-chave |
| Nov 2026 | LATAM launch | Coverage internacional |
| Mar 2027 | Eleições + dados | Ferramenta de campanha jornalística |

---

## COO — Operações e Confiabilidade

### Crons ativos (PC 192.168.15.6)

| Horário (BRT) | Job | Saúde |
|--------------|-----|-------|
| 00:00 | `coleta_noturna.sh` — Sprint 1 (19 municípios SP) + GDrive sync | ✅ |
| 02:05 | `sprint2_24x7_worker.py` — Sprint 2 × 3h (300 mun/noite) | ✅ |
| 05:10 | Deploy Vercel (`git pull` + `vercel deploy --prod --archive=tgz`) | ✅ |

### Riscos operacionais

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| PC principal apagado | Média | Alto | Mover Sprint 2 para servidor |
| GDrive quota cheia | Baixa | Médio | Monitor + alerta Telegram |
| Vercel build timeout | Baixa crescendo | Médio | `--archive=tgz` já aplicado |
| Portal Transparência key expirada | Alta | Médio | `rodar_warn()` ativo |
| OOM servidor 192.168.15.9 | Baixa (fix aplicado) | Alto | MemoryMax=800M + monitor loop |

### Plano de contingência SPOF

Prioridade quando servidor 192.168.15.9 voltar estável:
1. Instalar o `sprint2_24x7_worker.py` como systemd service no servidor
2. Manter o cron do PC principal como fallback
3. Alertas Telegram para falhas em ambos os nós

---

## CISO — Segurança e Compliance

### Riscos críticos

| Risco | Status | Ação |
|-------|--------|------|
| CPF de PF em git history | 🔴 Ativo | BFG Repo Cleaner (requer confirmação) |
| npm worm mai/2026 | 🔴 Bloqueado | PROIBIDO `npm install/update/audit fix` |
| Secrets em commit | ✅ Limpo | `.gitignore` cobre `.env`, tokens |
| PNCP 403 | ⚠️ Ativo | Playwright workaround pendente |
| commitlint ausente | ⚠️ Não-bloqueante | Hook falha não-fatalmente |

### Compliance LGPD

- CPFs de PF aparecem em commits históricos de `data/` — violação potencial
- Sanitização pendente com BFG: usuário deve confirmar explicitamente (operação irreversível)
- Publicação em `data/public/` já não expõe CPF — problema é o git history

### Políticas de segurança ativas

- Nenhum segredo em commit (`.gitignore` + pré-commit hook)
- Dados públicos em `data/public/` apenas (nada de raw/extracted)
- Deploy somente via autorização explícita
- Supply-chain: `npm ci --ignore-scripts` obrigatório

---

## CLO — Legal e Institucional

### Status atual

- **Natureza**: ONG em formação — domínio `.ong.br` ativo, CNPJ pendente de formalização
- **Licença**: MIT (código) — adequado para open-source cívico
- **Dados**: fontes públicas (Tesouro Nacional, Portal Transparência, TCE-SP) — uso legal
- **Voluntariado**: não formalizar campanha pública antes de CNPJ ativo

### O que formalizar para captação de funding

1. Registrar ONG formalmente (CNPJ)
2. Estatuto com missão de transparência fiscal
3. Política de dados pública (`/politica-de-dados` já existe)
4. Auditoria anual de dados (metodologia já documentada)

---

## Decisões Estratégicas Imediatas

### O que fazer agora (esta semana)

| # | Ação | Esforço | Impacto | Responsável |
|---|------|---------|---------|-------------|
| 1 | Re-cadastrar Portal Transparência com escopo "Transferências" | 30 min | Desbloqueador P0 | **Usuário** |
| 2 | Confirmar BFG para CPF em git history | 15 min decisão | Compliance LGPD | **Usuário** |
| 3 | Implementar endpoint `GET /api/municipios/[ibge]/orcamento/[ano]` | 2-3h | API pública inicial | Claude |
| 4 | Dashboard Execução vs Orçado em `/sorocaba` (dados já existem) | 1 dia | Produto imediato | Claude |
| 5 | Expandir `/comparativo` para top-20 municípios SP | 1 dia | Diferencial | Claude |

### Próximo grande marco: v1.5 — Brasil completo

**Critérios de conclusão:**
- [ ] Sprint 2 cursor em 5571/5571
- [ ] API pública com 2+ endpoints documentados
- [ ] Comparativo nacional (top-50 municípios)
- [ ] Score público disponível por município
- [ ] Alertas de anomalia (pelo menos detecção simples)

**Data alvo:** 2026-08-31

---

*Este documento pertence ao vault estratégico. Dados factuais (cursores, scores, blockers)
são espelho de STATUS.md — em caso de conflito, STATUS.md prevalece.*
