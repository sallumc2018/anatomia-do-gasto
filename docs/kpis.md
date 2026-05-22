# KPIs — Anatomia do Gasto

Sistema oficial de indicadores do projeto. Revisão: **última sexta de cada mês**.

---

## 1. KPIs de Produto

Medidos via **Vercel Analytics** (dashboard em vercel.com/anatomia-do-gasto).  
Instrumentação em [`apps/web/lib/analytics.ts`](../apps/web/lib/analytics.ts).

| Indicador | Definição | Fonte do dado | Meta atual | Periodicidade |
|-----------|-----------|---------------|------------|---------------|
| **Taxa de ativação** | Sessões com `fonte_click` ÷ total de sessões | `fonte_click` event | ≥ 15% | Mensal |
| **Usuários retornantes** | % de sessões de usuários que já visitaram antes | Vercel Analytics / Returning visitors | ≥ 20% | Mensal |
| **Cliques em fonte oficial** | Total de eventos `fonte_click` | Vercel Analytics | tendência crescente | Mensal |
| **Pageviews por área** | Views em `/sorocaba/*` por secção (saúde, educação, etc.) | `relatorio_ano` + `nav_click` | a definir | Mensal |

**Métrica-âncora de ativação real** (conforme `docs/estrategia.md`):
> "Usuário entrou, buscou algo, encontrou, clicou na fonte e voltou" = produto funciona.  
> "Apenas abriu e saiu" = acervo, não produto.

**Dono:** mantenedor (leitura no Vercel) + `/frontend` (instrumentação nova)

---

## 2. KPIs de Cobertura de Dados

Calculados dinamicamente em [`apps/web/lib/lacunas.ts`](../apps/web/lib/lacunas.ts).  
Página pública: `/sorocaba/lacunas`.

| Indicador | Hoje (mai/2026) | Meta set/2026 | Meta dez/2026 |
|-----------|-----------------|---------------|---------------|
| **Score global** | ~39% | 55% | 70% |
| Executivo (peso 30%) | ~71% | 85% | 95% |
| Contratos/fornecedores (peso 20%) | ~43% | 60% | 75% |
| Câmara Municipal (peso 10%) | ~67% | 80% | 90% |
| Autarquias/fundações (peso 15%) | 0% | 20% | 40% |
| Transferências (peso 15%) | ~7% | 30% | 50% |
| Controle externo (peso 10%) | ~17% | 30% | 50% |

**Próximos blocos de maior impacto no score:**
1. Transferências federais (+2pp) — pipeline pronto, aguarda chave API
2. Contratos PNCP 2022-2025 (+3pp) — API instável
3. SAAE ou Urbes validados (+3pp) — inventário existe
4. Transferências estaduais (+2pp) — fonte a mapear
5. TCE-SP pareceres (+2pp) — portal legado, alta dificuldade

**Dono:** `/dados` (coleta) + `/qa` (validação)

---

## 3. KPIs de Saúde Técnica

Verificados pelo agente `/monitor`. Ver [`.claude/commands/monitor.md`](../.claude/commands/monitor.md).

| Indicador | Threshold OK | Threshold Amarelo | Threshold Vermelho |
|-----------|-------------|-------------------|--------------------|
| **Frescor dos dados** | ≤ 60 dias | 61–180 dias | > 180 dias |
| **Disponibilidade do site** | Todas as rotas principais respondem | 1–2 rotas com erro | Rota principal off |
| **Portais oficiais acessíveis** | Todos OK | 1–2 portais off | Portal-fonte principal off |

**Ritual:** `/monitor` antes de cada revisão mensal de KPIs.

**Dono:** `/monitor` (diagnóstico automático)

---

## 4. KPIs Editoriais e de Alcance

Rastreados manualmente pelo mantenedor.

| Indicador | Meta Fase 1 (mai–jul/2026) | Meta Fase 2 (ago–dez/2026) |
|-----------|---------------------------|---------------------------|
| **Data Pokes publicados** | 1/mês (≥ 3 no período) | 1–2/mês |
| **Usuários-alvo contactados** | 10–15 (jornalistas, assessores, conselhos, professores) | a definir |
| **Citações / uso público rastreado** | 1 menção verificável | 5 menções ou 1 parceria formal |
| **Parceria com veículo jornalístico** | — | 1 até dez/2026 |
| **Relatório trimestral publicado** | — | 1 (4T2026) |

**Dono:** mantenedor

---

## 5. Ritual de Revisão Mensal

**Quando:** última sexta de cada mês  
**Duração estimada:** 30–45 min

**Checklist:**
- [ ] Abrir dashboard Vercel Analytics → registrar taxa de ativação e retorno
- [ ] Rodar `/monitor` → registrar alertas de frescor e disponibilidade
- [ ] Verificar score de cobertura em `/sorocaba/lacunas` → comparar com meta
- [ ] Contar Data Pokes publicados no mês
- [ ] Atualizar coluna "hoje" neste documento se houver mudança significativa
- [ ] Decidir prioridade do próximo mês com base nos gaps

**Formato de registro:** handoff em `memory/handoffs/AAAA-MM/kpis-review.md`

---

## 6. O Que Este Documento Não Mede (por ora)

- Impacto em decisão pública (ex: vereador citou o site) — a definir método
- Qualidade percebida pelo usuário (NPS, feedback qualitativo) — a definir
- Custo por usuário ativado — a definir quando houver gastos regulares
- Municípios além de Sorocaba — será adicionado no onboarding de cada município

---

*Criado em 2026-05-22. Próxima revisão: 2026-05-30 (última sexta de maio).*
