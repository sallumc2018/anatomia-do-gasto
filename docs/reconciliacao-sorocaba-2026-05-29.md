# Reconciliação Sorocaba — manifestos × disco (2026-05-29)

Autor: Claude Code · Método: leitura read-only de `data/extracted`, `data/public`,
`data/manifests/datasets_status.json`, `data/manifests/sorocaba_100_auditavel.csv` e
`data/manifests/datasets.csv`. Nenhum dado publicado; nenhuma alteração de score.

## Achado central (fato validado)

As três fontes de verdade **discordam entre si**, e a que alimenta o score público
(`sorocaba_100_auditavel.csv` → `apps/web/lib/lacunas.ts`, hoje 79.7% exibido como 80%)
é a **mais conservadora/atrasada**:

| Fonte | Publicados creditados | Geração |
|---|---|---|
| `sorocaba_100_auditavel.csv` | **4** (relatórios LRF saúde, aplicação ensino, Transferegov, emendas) | dirige o score |
| `datasets_status.json` | **~19** datasets `publicado` | 2026-05-25 |
| `data/public/sorocaba/` (disco) | **18 áreas** com arquivos | estado atual |

Conclusão: o auditável **subdeclara** o que já está publicado. O score real é maior que 80%.
Corrigir isso é uma decisão deliberada (mexe no número público) — listado abaixo como
**recomendação**, não aplicado.

## Correções factuais já aplicadas (notas não-pontuáveis, autorizadas)

Campo `bloqueio_atual` em `sorocaba_100_auditavel.csv` — não altera score:

| Linha | Antes | Depois (evidência) |
|---|---|---|
| FNS/repasses_sus | "2025 falhou MemoryError — bug a corrigir" | Extraído **2020-2026** (2025=45 linhas Sorocaba; 2026=20). Bug não reproduz no repo canônico. |
| SICONFI/rreo | "Extraído 2023-2025" | Extraído **2020-2025** (rcl/rcl_capital/divida/natureza em `fiscal/saida`) |
| SICONFI/rgf | "Extraído 2023-2025" | Extraído **2020-2025** (pessoal em `fiscal/saida`) |

`proximo_passo` de FNS ajustado de `corrigir_memoryerror...` → `rodar_qa_e_normalizar_para_publicacao`.

## Lista FIEL do que falta (55 fontes classificadas)

### Bucket A — Já publicado, auditável subdeclara → RECOMENDAR upgrade (afeta score, revisar)
Evidência: `datasets_status.json` + `data/public`. Status no auditável está abaixo da realidade.

| Fonte (auditável) | Status atual | Observado | Evidência |
|---|---|---|---|
| Prefeitura/registro_de_empenhos | parcial | publicado | empenho 203.231 reg · `data/public/sorocaba/empenho` |
| Prefeitura/conta_corrente_fornecedor | parcial | publicado | fornecedores 25.400 reg |
| Prefeitura/conta_corrente_restos | parcial | publicado | restos 3.979 reg |
| FNS/repasses_sus | coletado_pendente | publicado | saúde inclui repasses FNS/FAF 2020-2026 + extracted completo |
| Portal_Transp_Federal/transferencias | parcial | publicado | transferencias-federais 2.849 reg (via TCE-SP) |
| Camara/execucao_orcamentaria | parcial | publicado | camara-execucao 24.417 reg (R$1,23B) |
| SAAE/receitas_despesas | coletado_pendente | publicado | saae-despesas 75.272 reg · `autarquias` |
| FUNSERV/balancos_receitas_despesas | parcial | publicado | funserv-rpps + funserv-saude 9.154 reg |
| SICONFI/dca | coletado_pendente | publicado | siconfi-dca 11.477 reg · `fiscal` |

### Bucket B — Extraído, validação/publicação pendente (exige gate explícito do usuário)
| Fonte | Estado | Próximo passo |
|---|---|---|
| SICONFI/rreo, /rgf | extraído 2020-2025 em `fiscal/saida` | QA + decisão de publicar série própria |

### Bucket C — Genuinamente parcial / captável por automação (NÃO-LAI)
| Fonte | Método | Observação |
|---|---|---|
| Prefeitura/audiencias_publicas (LOA) | portal_pdf_html | 2020-21 podem inexistir na fonte |
| Prefeitura/registro_de_empenhos 2026 | portal_pdf | ano corrente; depende de disponibilidade |
| SIOPS/receitas_despesas_saude | sistema_setorial | pode exigir download manual |
| AUDESP/dados_enviados_ao_tce | portal_api_html | inventariar acesso público |
| Camara/execucao detalhada | playwright | portal pode bloquear requests |
| SAAE/remuneracao_rh | playwright_tdaportal | avaliar publicabilidade antes |
| FUNSERV/investimentos_e_rentabilidade | portal_html_pdf | extrair carteira/resultados |

### Bucket D — Extração pendente de raw JÁ baixado (NÃO-LAI, captação real)
| Fonte | Estado | Trabalho |
|---|---|---|
| Urbes/contratos_compras_diretas | **369 PDFs** em `data/raw/.../urbes`, **0 estruturados** | não há extrator PDF→CSV pronto; risco OOM |

### Bucket E — LAI necessário (escopo manual do usuário — NÃO MEXER)
20 fontes: PPA, LDO, registros analíticos de receita/despesa, balancetes, conta corrente
bancário, livros caixa/diário/razão, obras públicas, contratos e aditivos, licitações,
jornal oficial, remuneração servidores, precatórios, SICONFI/MSC, SIOPE, FNDE/repasses,
Câmara/contratos-gabinete, Câmara/projetos-votações, AGEM, Urbes (relação mensal /
remuneração / concessão), SAAE/licitações-obras, FUNSERV/avaliação-atuarial.

## Recomendações (em ordem de impacto, para usuário/Codex decidirem)

1. **Revisar Bucket A e atualizar `status_auditavel`** → o score público sobe de ~80% para
   o valor real. Decisão deliberada + revisão do Codex (não promover silenciosamente).
2. **Validar+publicar SICONFI rreo/rgf** (Bucket B) — gate explícito por dataset.
3. **Bucket C/D** ficam como captação futura; Urbes precisa de extrator novo.
4. **Bucket E** permanece com os pedidos e-SIC do usuário.

## Limites desta reconciliação (honestidade)
- Bucket A é **inferência por contagem de registros + presença de arquivo**, não verificação
  linha-a-linha de cobertura por ano. Antes de virar "publicado" no auditável, o Codex/QA
  deve confirmar cobertura temporal por dataset.
- O flag `pedido_lai` no CSV marca "pedido preparado", **não** "bloqueado por LAI" — vários
  itens com flag LAI já têm dado por outra via (ex.: relatorios_lrf_saude = publicado).
