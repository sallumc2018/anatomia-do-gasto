# Handoff — Orquestrador → /dados
# Tarefa: Pesquisa — Consórcios intermunicipais de Sorocaba

**Data:** 2026-05-22
**Score atual de Sorocaba:** 71.1%
**Impacto esperado desta tarefa:** +1.5pp (dimensão autarquias, lacuna alta)
**Tipo:** pesquisa de fontes — sem publicação ainda

---

## Contexto

Sorocaba provavelmente participa de consórcios intermunicipais (saúde, resíduos, transporte,
saneamento). O dinheiro sai do orçamento municipal mas a prestação de contas é feita pelo
consórcio — ficando invisível nos dados da Prefeitura.

**Não sabemos ainda quais consórcios Sorocaba integra.** Esta tarefa é de mapeamento.

---

## O que pesquisar

### 1. Quais consórcios Sorocaba integra?

Fontes a consultar:
- `https://fazenda.sorocaba.sp.gov.br/transparencia` → transferências para consórcios
- Portal TCE-SP → auditoria de consórcios com Sorocaba
- `https://www.tce.sp.gov.br` → buscar "consórcio" + "Sorocaba"
- Lei Orçamentária Anual (LOA) de Sorocaba — função "10. Saúde" e "15. Urbanismo" costumam ter dotações para consórcios
- `data/public/sorocaba/empenho/saida/` — buscar empenhos para CNPJs de consórcios

### 2. Para cada consórcio identificado

Levantar:
- Nome oficial e CNPJ
- Municípios participantes
- Objeto (saúde, resíduos, etc.)
- Portal de transparência próprio (URL)
- Valor anual repassado por Sorocaba (se disponível nos empenhos)
- Se o TCE-SP audita esse consórcio

### 3. Verificar no CAUC/SICONFI

`https://siconfi.tesouro.gov.br` → pode ter declarações de consórcios com Sorocaba

---

## Saída esperada desta pesquisa

Arquivo: `data/extracted/sorocaba/consorcios/inventario_consorcios_sorocaba.csv`

Colunas: `nome`, `cnpj`, `objeto`, `municipios_participantes`, `portal_transparencia`,
`valor_repasse_anual_sorocaba`, `auditado_tce_sp`, `fonte_identificacao`

**Não publicar em data/public ainda** — publicação depende de validação dos dados.

---

## Critério de sucesso

- Pelo menos 3 consórcios identificados com CNPJ e portal
- Pelo menos 1 com dados financeiros acessíveis (balancete ou relatório anual)
- Relatório de descoberta em `data/extracted/sorocaba/consorcios/resumo.md`

---

## Handoff de volta

Ao terminar: criar `handoff-consorcios-pipeline.md` com os consórcios encontrados,
portais identificados e estratégia de extração de cada um.
Não commitar ainda — aguardar revisão do orquestrador.
