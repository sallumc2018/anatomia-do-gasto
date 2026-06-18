# Frontino — Status LAI Sorocaba

**Municipio:** Sorocaba/SP
**Data de referencia:** 2026-05-24
**Prazo legal de resposta:** 2026-06-13 (20 dias corridos apos protocolo)
**Textos completos dos pedidos:** `docs/lai-pedidos-prontos.md`
**Manifesto detalhado:** `data/manifests/lai_pedidos.csv`

---

## Score de Cobertura

```
Protocolados:  0 / 35
Respondidos:   0 / 35
Concluidos:    0 / 35
```

Nenhum pedido foi ainda protocolado no portal e-SIC municipal.

---

## Distribuicao por Prioridade

| Prioridade | Quantidade | Status      |
|------------|------------|-------------|
| Critica    | 13         | 0 protocolados |
| Alta       | 14         | 0 protocolados |
| Media      | 7          | 0 protocolados |
| Baixa      | 1          | 0 protocolados |
| **Total**  | **35**     | **0 / 35**  |

---

## Distribuicao por Orgao

| Orgao                    | Pedidos |
|--------------------------|---------|
| Prefeitura de Sorocaba   | 24      |
| Camara Municipal         | 3       |
| Urbes de Sorocaba        | 3       |
| SAAE de Sorocaba         | 2       |
| FUNSERV de Sorocaba      | 2       |
| AGEM de Sorocaba         | 1       |

**Excluidos do e-SIC** (acesso programatico federal — sem pedido LAI):
SICONFI MSC, SIOPE, FNDE, Portal Transparencia Federal, PNCP.

---

## Pedidos Criticos — Protocolar Primeiro (1 a 13)

Ordem sugerida de protocolo. Textos completos em `docs/lai-pedidos-prontos.md`.

| # | Orgao                  | Dataset / Assunto                          | Proximo passo apos resposta           |
|---|------------------------|--------------------------------------------|---------------------------------------|
| 01 | Prefeitura de Sorocaba | `registro_analitico_despesa_orcamentaria` — Despesa orcamentaria analitica 2020-2026 | baixar_2021_2023_e_normalizar |
| 02 | Prefeitura de Sorocaba | `conta_corrente_fornecedor` — Conta corrente de fornecedor 2020-2026 | baixar_2021_2023_e_publicar_apos_validacao |
| 03 | Prefeitura de Sorocaba | `conta_corrente_restos_a_pagar_por_fornecedor` — Restos a pagar por fornecedor 2020-2026 | baixar_e_extrair |
| 04 | Prefeitura de Sorocaba | `obras_publicas` — Obras publicas municipais 2020-2026 | inventariar_e_cruzar_contratos |
| 05 | Prefeitura de Sorocaba | `contratos_e_aditivos` — Contratos e aditivos municipais 2020-2026 | inventariar_links_e_campos |
| 06 | Camara Municipal       | `contratos_despesas_gabinete` — Contratos e despesas de gabinete 2020-2026 | inventariar_contratos_e_despesas |
| 07 | Urbes de Sorocaba      | `relacao_mensal_despesas` — Relacao mensal de despesas de transporte 2020-2026 | baixar_e_extrair |
| 08 | Urbes de Sorocaba      | `remuneracao_transporte_publico` — Remuneracao do transporte publico 2020-2026 | extrair_series |
| 09 | Urbes de Sorocaba      | `contratos_concessao_transporte` — Contratos de concessao de transporte 2020-2026 | baixar_contratos_e_aditivos |
| 10 | SAAE de Sorocaba       | `receitas_despesas` — Receitas e despesas do SAAE 2020-2026 | inventariar_downloads |
| 11 | SAAE de Sorocaba       | `licitacoes_contratos_obras` — Licitacoes e contratos de obras do SAAE 2020-2026 | inventariar_e_cruzar_pncp |
| 12 | FUNSERV de Sorocaba    | `balancos_receitas_despesas` — Balancos receitas e despesas do FUNSERV 2020-2026 | inventariar_downloads |
| 13 | FUNSERV de Sorocaba    | `avaliacao_atuarial` — Avaliacao atuarial do FUNSERV 2020-2026 | baixar_series |

---

## Proximos Passos

### Acao imediata — protocolar os 13 criticos

1. Acesse o portal e-SIC municipal de Sorocaba:
   `https://esic.sorocaba.sp.gov.br/` (ou via portal de transparencia da Prefeitura)
2. Para cada pedido 01 a 13, copie o texto correspondente de `docs/lai-pedidos-prontos.md`
3. Apos protocolo, registre em `data/manifests/lai_pedidos.csv`:
   - `data_protocolo` — data do envio (formato YYYY-MM-DD)
   - `numero_esic` — numero gerado pelo sistema
   - `status` — alterar de `pendente` para `protocolado`
4. Prazo legal de resposta: **2026-06-13** (20 dias corridos a partir de hoje)

### Apos os criticos — protocolar os 14 de prioridade alta

Ordem de protocolo sugerida (por impacto e complexidade de coleta):

- Prefeitura: `ppa`, `ldo`, `loa`, `balancetes_receita`, `registro_analitico_receita_orcamentaria`, `rreo`, `rgf`, `relatorios_lrf_saude`, `relatorios_aplicacao_ensino`, `licitacoes`, `jornal_oficial`, `remuneracao_servidores`
- Camara: `subsidios_e_remuneracao`, `projetos_leis_votacoes`

### Depois — prioridade media (7) e baixa (1)

- Media: `registro_analitico_receita_extraorcamentaria`, `registro_analitico_despesa_extraorcamentaria`, `conta_corrente_bancario`, `livro_caixa`, `livro_diario`, `livro_razao`, `precatorios`
- Baixa: `receitas_despesas` (AGEM de Sorocaba)

---

## Historico de Atualizacoes

| Data       | Evento                                                        |
|------------|---------------------------------------------------------------|
| 2026-05-24 | 35 pedidos redigidos e registrados no manifesto — status inicial: 0/35 protocolados |
