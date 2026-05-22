# Handoff — Orquestrador → /pipeline
# Tarefa: Controle externo — Alertas TCE-SP 2020-2024 + Câmara contratos

**Data:** 2026-05-22
**Score atual de Sorocaba:** 71.1%
**Impacto esperado desta tarefa:** +2.5–3.0pp (controle_externo +2pp, camara +1pp)

---

## Tarefa 1 — Alertas SDG do TCE-SP (anos 2020–2024)

### Contexto
O TCE-SP emite comunicados SDG (Setor de Diagnóstico e Gestão) bimestrais com alertas
de descumprimento da LRF. Em 2026-05-22 foram publicados os 4 alertas de **2025**.
Os anos **2020 a 2024** ainda estão ausentes.

Arquivo atual: `data/public/sorocaba/controle_externo/saida/alertas_sdg_2025_sorocaba.csv`
Colunas: `ano`, `bimestre`, `sdg_numero`, `incisos_descumpridos`, `descricao`

### Fonte
Portal do TCE-SP — consulta processual:
`https://www4.tce.sp.gov.br/PublicoSgm/processo/consulta/pesquisa.aspx`
Ou via busca por município: Sorocaba / entidade: Prefeitura / tipo: SDG / anos 2020-2024

Alternativa: API ou RSS do TCE-SP se disponível.

### O que extrair por alerta
`ano`, `bimestre`, `sdg_numero`, `incisos_descumpridos`, `descricao_resumida`

### Saída esperada
Adicionar linhas ao arquivo existente OU criar arquivo consolidado:
`data/public/sorocaba/controle_externo/saida/alertas_sdg_sorocaba_2020_2025.csv`

### Atualização lacunas.ts
```typescript
// item "Pareceres e alertas do TCE-SP sobre Sorocaba"
status: "publicado",    // era "parcial"
anosCobertos: 6,        // era 1
```

---

## Tarefa 2 — Julgamento das contas anuais pelo TCE-SP (AUDESP)

### Contexto
O TCE-SP julga as contas anuais de cada município. Para Sorocaba, queremos saber
se as contas de 2020-2024 foram **aprovadas, aprovadas com ressalva ou reprovadas**.

Arquivo atual: nenhum dataset estruturado
Item lacunas.ts: `area: "Auditoria externa e contas anuais"`, status `parcial`, anosCobertos: 6

### Fonte
AUDESP (sistema de auditoria do TCE-SP):
`https://www.tce.sp.gov.br/audesp`
Ou portal de consulta por município:
`https://transparencia.tce.sp.gov.br` → seção de contas anuais / julgamentos

### O que extrair
`ano_contas`, `resultado_julgamento`, `data_julgamento`, `processo_numero`,
`ressalvas` (se houver), `url_acordao`

### Saída esperada
`data/public/sorocaba/controle_externo/saida/julgamento_contas_sorocaba_2020_2024.csv`

### Atualização lacunas.ts
```typescript
// item "Auditoria externa e contas anuais"
status: "publicado",    // era "parcial"
// anosCobertos já é 6 — manter
```

---

## Tarefa 3 — Contratos e licitações da Câmara Municipal

### Contexto
A Câmara Municipal de Sorocaba publica contratos no portal próprio, mas ainda não
há dataset estruturado.

Portal: `https://www.camarasorocaba.sp.gov.br` → Transparência → Contratos

### O que extrair
`ano`, `numero_contrato`, `objeto`, `contratada`, `cnpj_contratada`,
`valor`, `modalidade_licitacao`, `data_assinatura`, `vigencia_fim`

### Saída esperada
`data/public/sorocaba/camara/saida/contratos_camara_sorocaba_2020_2025.csv`

### Atualização lacunas.ts
```typescript
// item "Contratos e licitações da Câmara Municipal"
status: "publicado",    // era "lacuna"
anosCobertos: 6,        // era 0
```

---

## Sequência recomendada

1. Câmara contratos (portal simples, sem API, HTML scraping)
2. Alertas SDG 2020-2024 (TCE-SP — testar se retorna 403; se sim → handoff playwright)
3. Julgamento de contas (AUDESP — pode exigir navegação complexa)

---

## Validação

```bash
python c:\tmp\calc_score.py
# Esperado: controle_externo sobe de 52.8% para >80%
# camara sobe de 63.3% para >75%
# Score total deve subir de 71.1% para ~74-75%
```

---

## Handoff de volta

Commit + push + `vercel deploy --prod --yes`.
Se TCE-SP ou AUDESP retornar 403/WAF → criar `handoff-tce-sp-playwright.md`.
Atualizar `memory/handoffs/2026-05/cobertura-sorocaba.md` com novo score.
