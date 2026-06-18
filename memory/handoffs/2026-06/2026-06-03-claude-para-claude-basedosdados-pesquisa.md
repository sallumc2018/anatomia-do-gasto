# Handoff: Base dos Dados — o que aproveitamos
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Claude Sonnet (sessão de coleta/pipeline)
**Pesquisa feita via:** GitHub MCP → basedosdados/mais em 2026-06-03

---

## O que foi confirmado no repo (não inferido)

Base dos Dados tem 143 datasets. Os relevantes para o Anatomia do Gasto:

| Dataset BD | O que cobre | Cobertura temporal |
|---|---|---|
| `br_me_siconfi / municipio_despesas_orcamentarias` | Despesas orçamentárias por município (estágio, conta, valor) | **1989–2020** |
| `br_me_siconfi / municipio_receitas_orcamentarias` | Receitas orçamentárias por município | 1989–2020 |
| `br_me_siconfi / municipio_despesas_funcao` | Despesas por função (saúde, educação, etc.) | 1989–2020 |
| `br_me_siconfi / municipio_balanco_patrimonial` | Balanço patrimonial municipal | 1989–2020 |
| `br_me_siconfi / municipio_ranking_qualidade` | Ranking de qualidade fiscal | disponível |
| `br_tesouro_finbra` | FINBRA — Finanças do Brasil | histórico |
| `br_ibge_populacao` | População por município/ano | contínuo |
| `br_ibge_pib` | PIB municipal | disponível |
| `br_sp_gov_orcamento` | Orçamento estadual SP | disponível |

**Schema confirmado de `municipio_despesas_orcamentarias`:**
- `id_municipio` (IBGE 7 dígitos) — compatível com o padrão do projeto
- `ano`, `sigla_uf`, `estagio`, `portaria`, `conta`, `valor`
- Colunas BD normalizadas: `estagio_bd`, `id_conta_bd`, `conta_bd`
- Partições: `ano`, `sigla_uf`
- Última atualização: 2021-09-29 → **cobre até 2020 apenas**

---

## O que isso significa na prática

**O que NÃO precisamos coletar para anos históricos:**
- SICONFI 2019–2020 de Sorocaba e Paulínia: BDD já tem, limpos e padronizados
- Populações históricas: `br_ibge_populacao` já tem todos os anos
- PIB municipal: `br_ibge_pib` já tem

**O que AINDA precisamos coletar (BDD não cobre):**
- SICONFI 2021–2025: BDD para em 2020
- TCE-SP granular (empenhos, fornecedores): BDD não tem esse nível
- FNS repasses: BDD não tem
- Dados de Câmara, URBES, SAAE, FUNSERV: BDD não tem (muito local)
- PNCP licitações: BDD não tem

**Uso recomendado:**
1. Para cross-validação dos anos históricos (2019–2020): consultar BDD via `basedosdados` Python SDK
2. Para novos municípios: usar BDD como baseline histórico + coletar 2021–2025 do SICONFI direto
3. O schema `id_municipio` (7 dígitos IBGE) já é o padrão deles — manter compatível

---

## Como acessar via Python

```python
import basedosdados as bd

# Despesas Sorocaba + Paulínia 2019–2020
df = bd.read_sql("""
    SELECT ano, id_municipio, conta_bd, estagio_bd, SUM(valor) as total
    FROM `basedosdados-dev.br_me_siconfi.municipio_despesas_orcamentarias`
    WHERE id_municipio IN ('3552205', '3536505')  -- Sorocaba, Paulínia
    AND ano BETWEEN 2019 AND 2020
    GROUP BY ano, id_municipio, conta_bd, estagio_bd
""", billing_project_id="SEU_PROJECT_ID")
```

**Requisito:** conta Google Cloud com billing configurado (consultas grátis até 1TB/mês).
Instalar: `uv add basedosdados` (não npm).

---

## O que fazer na sessão

1. Confirmar que `id_municipio` 3552205 (Sorocaba) e 3536505 (Paulínia) estão no BD
2. Baixar os anos 2019–2020 e cruzar com os dados já coletados do SICONFI
3. Se divergir: registrar em `DECISIONS.md` qual fonte usar como canônica
4. Usar o schema BDD como referência para padronizar as colunas do pipeline

## Restrições
- Acesso via `basedosdados` SDK requer Google Cloud project com billing
- BDD para em 2020 — não substituir coleta dos anos mais recentes
- Dados são do SICONFI agregado (sem granularidade de empenho/fornecedor)
