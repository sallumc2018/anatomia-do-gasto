# Roadmap LATAM — Checklist Eterno

> **Como usar:** A qualquer momento, `cat ROADMAP_LATAM.md` mostra a fase atual,
> o que está feito, o que está pendente e o que bloqueia cada item.
> Atualizar ao concluir cada item. Não remover itens concluídos — marcar com ✅.

---

## Status rápido

```
Fase atual: 1 — Brasil 5571 + Features Core
Sprint 2:   218/5571 municípios (3,9%) — ~18 noites para conclusão
Blockers P0: Portal Transparência 403 (aguarda re-cadastro usuário)
             CPF git history (aguarda confirmação BFG usuário)
Próximo marco: 5571/5571 coleta completa (~final julho 2026)
```

---

## Fase 1 — Brasil 5571 + Features Core
**Meta:** Agosto 2026 | **Status:** 🔄 Em andamento

### 1.1 Coleta completa (Sprint 2)
- [x] Worker circular `sprint2_24x7_worker.py` operacional
- [x] 218/5571 municípios coletados (3,9%)
- [ ] **500/5571** municípios — checkpoint visual
- [ ] **1000/5571** municípios — 18%
- [ ] **2500/5571** municípios — 45%
- [ ] **5571/5571** municípios — Brasil completo ✨

### 1.2 Blockers de dados (requerem ação do usuário)
- [ ] **Portal Transparência**: re-cadastrar chave com escopo "Transferências"
      `api.portaldatransparencia.gov.br/api-de-dados/cadastrar-email`
      → Depois: atualizar `~/.config/omega/secrets.env`
- [ ] **CPF/LGPD**: confirmar execução do BFG Repo Cleaner para limpar git history
      → Dados brutos com CPF permanecem APENAS na cloud (GDrive), nunca publicados

### 1.3 API pública
- [ ] `GET /api/municipios/[ibge]/orcamento/[ano]` — orçamento por município/ano
- [ ] `GET /api/municipios/[ibge]/comparativo` — dados para comparação
- [ ] Documentação Swagger/OpenAPI em `/api/docs`
- [ ] Rate limiting básico (headers X-RateLimit)
- [ ] Exemplos de uso (curl + Python + JS)

### 1.4 Dashboard Execução vs Orçado
- [ ] Componente `ExecucaoVsOrcado` — barra comparativa dotação/liquidado
- [ ] Dados já existem em `data/public/*/siconfi/rreo/` — só falta UI
- [ ] Disponível em `/sorocaba`, `/paulinia`, `/sao-paulo` (com dados disponíveis)
- [ ] Percentual de execução por função (saúde, educação, transporte...)

### 1.5 Comparativo nacional
- [ ] Expandir `/comparativo` de 3 para top-20 municípios SP
- [ ] Score de execução por município (% dotação liquidada)
- [ ] Gráfico per capita
- [ ] Filtro por estado/porte/região

### 1.6 Score público por município (Sprint 2)
- [ ] Página `/municipios/[slug]` gerada para cada município do Sprint 2
- [ ] Score básico (fontes federais coletadas ÷ fontes possíveis)
- [ ] Mapa interativo BR com cobertura

---

## Fase 2 — Alertas + Relatórios
**Meta:** Setembro–Outubro 2026 | **Status:** ⏳ Aguardando Fase 1

### 2.1 Alertas de anomalia
- [ ] Detector outlier simples: gastos > 3× média histórica do município
- [ ] Comparação inter-municipal: gasto função X vs média estado
- [ ] Notificação por email/Telegram quando anomalia detectada
- [ ] Dashboard de alertas ativos em `/alertas`
- [ ] Webhook público para integrações externas

### 2.2 Relatórios automáticos
- [ ] Template PDF mensal por município (resumo executivo)
- [ ] Geração automática via cron (mensal)
- [ ] Download disponível em `/sorocaba/relatorios`, `/paulinia/relatorios`, etc.
- [ ] Email automático para lista de jornalistas cadastrados

### 2.3 Busca por fornecedor/CNPJ
- [ ] Índice invertido dos CSVs de contratos/empenhos
- [ ] Endpoint `GET /api/fornecedor/[cnpj]` — todos os contratos públicos do CNPJ
- [ ] Página `/fornecedor/[cnpj]` no frontend
- [ ] Integração com CNEP/CEIS (sanções) via Portal Transparência

### 2.4 Histórico 2015–2025 (SICONFI ampliado)
- [ ] Verificar disponibilidade SICONFI para anos pré-2019
- [ ] Baixar e publicar dados 2015–2018 para municípios-piloto
- [ ] Série histórica 10+ anos disponível na UI

---

## Fase 3 — LATAM Seed
**Meta:** Novembro–Dezembro 2026 | **Status:** ⏳ Aguardando Fase 2

### 3.1 Argentina
- [ ] Mapear endpoints de `presupuesto.gob.ar` e `datos.gob.ar`
- [ ] Criar `pipelines/coletar_argentina.py` — adaptar sprint2 para AR
- [ ] Primeiro município AR coletado e publicado
- [ ] Comparativo BR × AR na UI

### 3.2 Chile
- [ ] Mapear DIPRES (Dirección de Presupuestos) + municipios
- [ ] Criar `pipelines/coletar_chile.py`
- [ ] Primeiro município CL coletado e publicado

### 3.3 Fundação LATAM
- [ ] Página `/latam` com mapa de cobertura continental
- [ ] Metodologia comparável (normalização por moeda, PIB per capita)
- [ ] Documentação de fontes por país (`docs/fontes-latam.md`)
- [ ] Press release de lançamento LATAM

---

## Fase 4 — Escala e Reconhecimento
**Meta:** 2027 Q1 | **Status:** ⏳ Aguardando Fase 3

### 4.1 Infraestrutura
- [ ] Migrar Sprint 2 worker para servidor dedicado (192.168.15.9 estável)
- [ ] Storage R2/S3 para dados brutos > 5GB
- [ ] Vercel Pro ou self-hosted (após funding)
- [ ] CI/CD com GitHub Actions (quality gates)

### 4.2 Funding
- [ ] CNPJ da ONG formalizado
- [ ] Relatório de impacto público (municípios cobertos, acessos, citações)
- [ ] Aplicação OCDE/OGP
- [ ] Aplicação BID Transparência
- [ ] Aplicação Google.org ou NED

### 4.3 Comunidade
- [ ] Newsletter mensal ativa (500+ assinantes)
- [ ] 3+ citações em veículos jornalísticos
- [ ] 5+ contribuidores externos no GitHub
- [ ] Parceria com Agência Pública / The Intercept / Piauí

### 4.4 Marco: Maior portal LATAM
- [ ] Cobertura BR: 5571/5571 municípios ✅
- [ ] Cobertura LATAM: Brasil + Argentina + Chile
- [ ] API pública com 100+ usuários registrados
- [ ] 10.000+ visitas/mês
- [ ] Reconhecimento OGP / Transparência Internacional

---

## Blockers permanentes (verificar antes de qualquer fase)

| Blocker | Responsável | Status |
|---------|------------|--------|
| Portal Transparência 403 (`/transferencias`) | Usuário (re-cadastro) | 🔴 Ativo |
| CPF em git history | Usuário (confirmar BFG) | 🔴 Ativo |
| npm worm (mai/2026) | Aguardar clearance | 🔴 Ativo |
| Servidor 192.15.9 instabilidade | Monitor ativo | ⚠️ Vigiado |
| ONG sem CNPJ | Usuário | ⚠️ Pendente |

---

## Regra de atualização

Ao concluir um item:
1. Marcar `[x]` neste arquivo
2. Atualizar `STATUS.md` se for mudança de estado operacional
3. Registrar em `memory/provenance/changes.csv`
4. Commitar junto com o trabalho relacionado
