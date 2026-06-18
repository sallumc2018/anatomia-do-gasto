# Revisão Mensal de KPIs — maio/2026

**Data:** 2026-05-31 (última sexta de maio)  
**Executado por:** /monitor + Claude

---

## 1. Saúde Técnica (via /monitor)

### Frescor dos dados

| Município | Arquivos | Último update | Status |
|-----------|----------|---------------|--------|
| sorocaba  | 232      | 30/05/2026    | ✅ VERDE |
| linked    | 2        | 29/05/2026    | ✅ VERDE |
| auditoria | 3        | 15/05/2026    | ✅ VERDE |
| agentes   | 1        | 14/05/2026    | ✅ VERDE |

### Cobertura de áreas — Sorocaba

**Áreas esperadas (12):** todas presentes ✅  
`saude, educacao, seguranca, transporte, receita, executivo, fiscal, fornecedores, camara, loa, empenho, restos`

**Áreas extras publicadas:** `autarquias, contratos, controle_externo, emendas, transferencias, despesa`

### Disponibilidade do site

| URL | Status |
|-----|--------|
| anatomia-do-gasto.vercel.app | ✅ OK |
| www.anatomiadogasto.com.br | 🔴 DNS_PROBE_FINISHED_NXDOMAIN |
| /sorocaba/lacunas | ✅ OK (via vercel.app) |

🔴 **Alerta crítico:** domínio personalizado `anatomiadogasto.com.br` retorna NXDOMAIN — sem registro DNS. Domínio expirou ou nunca foi apontado ao Vercel. Verificar registro no registrador de domínios e renovar se necessário.

---

## 2. Cobertura LAI (/sorocaba/lacunas)

Dados da página (2026-05-31):
- Itens mapeados: **29**
- Itens publicados: **18** (~62% dos itens mapeados)
- Pendências críticas: **2**
- Alta prioridade: **6**

Score global estimado (ponderado por peso): **~59%** (conforme docs/kpis.md atualizado 24/05)

**Meta set/2026:** 70% | **Meta dez/2026:** 80%

**Gap atual para meta set/2026:** ~11pp em 4 meses  
**Próximos blocos de maior impacto:**
1. Contratos PNCP 2022-2025 (+3pp) — Playwright disponível, executar em junho
2. SAAE/Urbes validados (+3pp) — inventário existe, aguarda /qa
3. Transferências federais (+2pp) — pipeline pronto, aguarda chave API
4. Transferências estaduais (+2pp) — fonte a mapear

---

## 3. KPIs de Produto (Vercel Analytics — últimos 30 dias)

| Indicador | Meta | Medido |
|-----------|------|--------|
| Visitantes únicos | — | **80** |
| Page Views | — | **372** (4,65 PV/visita) |
| Bounce Rate | — | **44%** (+44% vs período anterior 🔴) |
| Taxa de ativação (`fonte_click`) | ≥ 15% | ⚠️ não visível no painel padrão |
| Usuários retornantes | ≥ 20% | ⚠️ não visível no painel padrão |

**Top páginas:**

| Página | Visitantes |
|--------|------------|
| / (home) | 73 |
| /sobre | 10 |
| /contato | 6 |
| /metodologia | 6 |
| /seguranca | 6 |
| /saude | 5 |
| /sorocaba/executivo | 5 |

**Referrers:** google.com (3), youtube.com (3), linkedin (4 total), facebook (2), instagram (2), chatgpt.com (1)

**Perfil do visitante:** 66% Brasil, 24% EUA, 6% Canadá | Desktop 78% | Chrome 76%

**Observação:** 24% dos visitantes são dos EUA — provável tráfego de bots/crawlers ou diaspora. Foco real em Brasil (66%).  
Para medir `fonte_click` e retornantes, verificar aba de Custom Events no Vercel Analytics.

---

## 4. KPIs Editoriais

| Indicador | Meta Fase 1 | Realizado mai/2026 |
|-----------|-------------|-------------------|
| Data Pokes publicados (Twitter/X) | 1/mês | ⚠️ verificar manualmente |
| Usuários-alvo contactados | 10–15 total | ⚠️ verificar manualmente |

---

## 5. O que foi feito em maio/2026 (50 commits)

### Novos dados publicados
- Repasses FNS/FAF Sorocaba 2020-2026 (saúde)
- Transferências SICONV + Portal Transparência (convênios)
- Contratos/atas/compras PNCP 2022-2025 via Playwright
- SAAE + Câmara QA (Codex)
- Urbes publicado + score de cobertura atualizado

### Novas funcionalidades no site
- `/fluxo-financeiro` — página Sankey de rastro do dinheiro público
- `/sorocaba/lacunas` — arquitetura dinâmica de métricas (JSON gerado por script)
- Página LAI: diário cidadão + 40 pedidos e-SIC mapeados, 2 publicados
- Corpo dinâmico na câmara + controle externo (editorial)
- `/sorocaba/transferencias` adicionado ao header

### Infraestrutura
- Hooks de segurança (pip/winget/publicação)
- GitHub Actions gates habilitados
- 17 pipelines parametrizados para multi-município (base Paulínia)
- Théo: 4 novas rotas, aviso "em treinamento"
- Hook commit-msg: prefixo [Claude]/[Codex] obrigatório

---

## 6. Alertas

1. 🔴 **Domínio `anatomiadogasto.com.br` — NXDOMAIN** — registrador não aponta para Vercel; verificar e renovar
2. 🟡 **Bounce rate +44%** vs período anterior — pode indicar tráfego de baixa qualidade ou falta de conteúdo de entrada
3. 🟡 **Score 59% vs meta 70% set/2026** — gap de 11pp; 2 blocos (PNCP + SAAE) cobrem 6pp
4. 🟡 **Data Pokes: 0 confirmados** — meta é 1/mês; não há commits nem conteúdo editorial no mês

---

## 7. Prioridade recomendada para junho/2026

1. **Resolver domínio personalizado** — urgente, afeta credibilidade e SEO
2. **1 Data Poke no Twitter/X** — escolher insight do mês (ex: repasses FNS vs. gastos saúde)
3. **Contratos PNCP via Playwright** — pipeline pronto, executar (+3pp no score)
4. **SAAE/Urbes: validação /qa** — +3pp no score
5. **Verificar Custom Events no Vercel** — medir taxa de ativação real

---

*Próxima revisão: 2026-06-27 (última sexta de junho)*
