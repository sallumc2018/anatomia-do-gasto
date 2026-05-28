# Handoff — Orquestrador → /pipeline
# Tarefa: Publicar dados da Urbes (transporte público de Sorocaba)

**Data:** 2026-05-22
**Score atual de Sorocaba:** 71.1%
**Impacto esperado desta tarefa:** +1.5–2.0pp (dimensão autarquias, lacuna CRÍTICA)

---

## Contexto

A Urbes (Urbanização de Sorocaba S.A.) é a empresa municipal de mobilidade urbana — concessão
de transporte, obras viárias e sinalização. **Não está na API TCE-SP** (é sociedade de economia
mista, não autarquia). Tem portal de transparência próprio.

Em 2026-05-20 o agente `/dados` fez inventário completo e baixou 419 arquivos do portal
da Urbes. Os PDFs estão em `data/raw` (junction → `G:\Meu Drive\Omega-data\raw\`).
**Nenhum dado foi publicado ainda** — esta é a próxima etapa.

---

## O que foi baixado (já em data/raw)

| Categoria | Subcategoria | Qtd |
|-----------|-------------|-----|
| despesas | relacao_mensal_despesas | 17 PDFs |
| orcamento | balancete_financeiro | 57 PDFs |
| orcamento | balancete_orcamentario | 57 PDFs |
| orcamento | balancete_patrimonial | 57 PDFs |
| contratos | compras_diretas | 176 PDFs |
| contratos | contratos_concessao_transporte | 31 PDFs |
| contratos | licitacoes | 9 PDFs |
| contratos | termos_firmados | 7 PDFs |
| remuneracao_transporte | remuneracao_transporte_publico | 2 PDFs |
| rh | recursos_humanos | 2 PDFs |

**Inventário completo em:**
`G:\Meu Drive\Omega-data\extracted\sorocaba\urbes\inventario_urbes_transparencia.csv`
`G:\Meu Drive\Omega-data\extracted\sorocaba\urbes\resumo_urbes_transparencia.csv`

**Localização dos PDFs (coluna `arquivo_raw` no inventário):**
`G:\Meu Drive\Omega-data\raw\sorocaba\transporte\urbes\transparencia\{categoria}\{subcategoria}\*.pdf`

---

## O que fazer

### Prioridade 1 — Despesas mensais (maior impacto no score)

Arquivo alvo do inventário: `status_download=baixado` AND `categoria=despesas`

1. Ler cada PDF de `relacao_mensal_despesas` (17 arquivos, ~2020-2026)
2. Extrair tabela de despesas: **data, credor, objeto/descrição, valor pago, modalidade**
3. Padronizar: coluna `ano`, `mes`, `credor`, `objeto`, `valor`, `modalidade`
4. Publicar em: `data/public/sorocaba/autarquias/saida/urbes_despesas_2020_2025.csv`
5. Validar: sem nulos >5% nas colunas de valor; anos 2020-2025 presentes

### Prioridade 2 — Balancetes financeiros/orçamentários

Os balancetes têm periodicidade mensal (57 arquivos ≈ 6 anos × ~9 meses).

1. Extrair de cada PDF: **receitas totais, despesas totais, resultado, período**
2. Publicar em: `data/public/sorocaba/autarquias/saida/urbes_balancetes_2020_2025.csv`
3. Colunas mínimas: `ano`, `mes`, `receita_total`, `despesa_total`, `resultado`

### Prioridade 3 — Remuneração do transporte público

2 PDFs com planilha de remuneração paga à operadora do transporte.

1. Extrair: **período, operadora, valor remuneração, km rodados (se disponível)**
2. Publicar em: `data/public/sorocaba/autarquias/saida/urbes_remuneracao_transporte.csv`

---

## Como atualizar o score após publicação

Editar `apps/web/lib/lacunas.ts`, item `area: "Urbes"`:
```typescript
status: "publicado",    // era "lacuna"
anosCobertos: 6,        // era 0
```

---

## Não fazer (fora do escopo desta tarefa)

- Contratos e licitações da Urbes — estrutura diferente, deixar para próxima sessão
- Dados de RH (remuneração de servidores) — depende de verificação jurídica
- Não alterar nenhum arquivo fora de `data/public/sorocaba/autarquias/saida/`

---

## Validação antes de commitar

```python
# Verificar despesas
import pandas as pd
df = pd.read_csv("data/public/sorocaba/autarquias/saida/urbes_despesas_2020_2025.csv")
assert len(df) > 0, "vazio"
assert df['ano'].nunique() >= 4, "poucos anos"
assert df['valor'].isna().mean() < 0.05, "muitos nulos em valor"
print(f"OK: {len(df)} registros, anos {sorted(df['ano'].unique())}")
```

Após publicar, rodar `python c:/tmp/calc_score.py` — deve subir acima de 71.1%.

---

## Handoff de volta

Após publicar: commit + push + `vercel deploy --prod --yes`.
Atualizar `memory/handoffs/2026-05/cobertura-sorocaba.md` com o novo score.
