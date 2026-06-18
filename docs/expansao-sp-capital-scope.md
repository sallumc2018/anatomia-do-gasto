# Scope — Expansão para São Paulo, Capital (IBGE 3550308)

Autor: Claude Code (Fable 5) · 2026-06-13 · Fase de planejamento (impl. = Codex).
Segue `protocolo-dados-reais-expansao.md`: nada vira `public` sem autorização; preservar zero ≠ ausente ≠ não-encontrado; todo dado com manifest rastreável.

## Por que SP é diferente (e mais rica) que Sorocaba/Paulínia

1. **TCM-SP** (Tribunal de Contas do Município) — **só São Paulo e Rio têm TC municipal próprio**. Sorocaba/Paulínia caem no TCE-SP; SP tem auditorias, pareceres, contratos e alertas próprios. **Alto valor, fonte exclusiva.**
2. **Portal de Dados Abertos** (CKAN, `dados.prefeitura.sp.gov.br`) — **API estruturada** com centenas de datasets. Muito mais barato que scraping. **Maior yield → Onda 1.**
3. **Escala**: maior orçamento municipal do país. Volume e granularidade altos.
4. **PRODAM** opera a TI municipal (vários sistemas: SOF, transparência, processos).

## Inventário de fontes × contrato de dados

| Área | Órgão/Fonte | Temos pipeline? |
|---|---|---|
| Orçamento (LOA/LDO/PPA) + execução | SOF + Portal Transparência SP + dados abertos | **Novo** (SP-específico) |
| Despesas/empenhos/contratos | Portal Transparência SP + **PNCP** + dados abertos | **PNCP: temos** (reusa) |
| Servidores/folha (nominais) | Portal Transparência SP | **Novo** — ⚠️ LGPD |
| Saúde | **SIOPS, FNS, RREO-SUS** | **Temos** (reusa por IBGE) |
| Educação | **FNDE/SIOPE** | **Temos** (reusa por IBGE) |
| Transferências | **federais + estaduais-SP** | **Temos** (reusa) |
| Fiscais consolidados (RREO/RGF) | SICONFI/Tesouro | **Temos** (reusa) |
| Câmara Municipal (vereadores, verba de gabinete, votações, despesas) | CMSP (sistema próprio) | **Novo** |
| Auditoria/contratos/alertas | **TCM-SP** | **Novo** (alto valor) |

## Ferramentas que TEMOS (reutilizáveis — trocar IBGE p/ 3550308 / município=São Paulo)

`baixar_pncp_*`, `baixar_siops_tabnet`, `baixar_rreo_sus`, `baixar_fnde_siope`, `baixar_fns_repasses`, `baixar_transferencias_federais`, `baixar_transferencias_estaduais_sp`, SICONFI. → quase de graça para SP, só mudar parâmetro de município.

**NÃO servem** (sistemas locais de Sorocaba/Paulínia): URBES, SAAE, SMARAPD, `baixar_tce_sorocaba`, câmara Sorocaba/Paulínia. SP tem stack própria.

## Fontes VERIFICADAS ao vivo (2026-06-13) — endpoints reais

| Fonte | Endpoint confirmado | Formato | Conteúdo |
|---|---|---|---|
| **Dados Abertos SP (CKAN)** | `https://dados.prefeitura.sp.gov.br/api/3/action/` (`package_list`, `package_show`, `datastore_search`) | API JSON + CSV | **1.087 datasets**: `execucao-orcamentaria`, `lei-orcamentaria-anual-loa`, `base-de-compras-e-licitacoes`, `contratos-vigentes-2025`, `pregoes-realizados`, `folha-de-pagamentos`, `lista-de-servidores`, saúde, educação |
| **TCM-SP** | `https://portal.tcm.sp.gov.br/api/iris/dotacoes/{ano}/{csv\|xml}` | API REST | dotações + empenhos (mensal, dia 10). Licitações via PNCP |
| **Câmara Municipal SP** | `https://www.saopaulo.sp.leg.br/transparencia/dados-abertos/` | XML | votações, presença, vereadores (SPLEGIS), **custos de mandato** (55 gabinetes, ~R$416k/ano cada) |
| **Portal Transparência SP** | `https://transparencia.prefeitura.sp.gov.br/` | CSV/XLSX/PDF | receitas/despesas (fonte SOF, atualização diária) — **maioria já no CKAN** |

**Descoberta-chave:** os dados do SOF já estão no portal CKAN → o scraper de SOF separado vira quase redundante. E TCM-SP/Câmara têm API/XML → **sem Playwright**. SP é API-first, bem mais barato que Sorocaba/Paulínia.

## Ferramentas que vamos PRECISAR (novas — Codex constrói) — REVISADO

| # | Pipeline novo | Fonte | Prioridade |
|---|---|---|---|
| 1 | `extrator_sp_dados_abertos.py` | CKAN (cobre orçamento+contratos+licitações+folha+saúde+educação) | **Onda 1** (API, maior yield) |
| 2 | `baixar_tcm_sp.py` | API IRIS do TCM-SP (dotações/empenhos por ano) | **Onda 1** (API simples) |
| 3 | `baixar_camara_sp.py` | XML aberto da CMSP (votações/presença/custos de mandato) | Onda 2 |
| 4 | `baixar_transparencia_sp.py` | Portal Transparência SP — **só p/ gaps não cobertos pelo CKAN** | Onda 3 (fallback) |

`baixar_sof_sp.py` removido — coberto pelo CKAN.

## Worklist priorizado (Codex SEM LIMITE até 18/06 → coletar agressivo)

- **Onda 1 (APIs, rodar JÁ — máximo yield, mínimo código):** CKAN dados abertos SP + TCM-SP (API IRIS) + todas as federais reusáveis por IBGE 3550308 (SIOPS, FNDE, PNCP, FNS, transferências, SICONFI). Cobre orçamento, contratos, licitações, folha, saúde, educação, dotações.
- **Onda 2 (XML estruturado):** Câmara Municipal SP (votações, presença, custos de mandato dos 55 gabinetes).
- **Onda 3 (fallback):** Portal Transparência SP só para gaps que o CKAN não cobrir.
- Tudo em `data/raw` → `data/extracted`. **NÃO promover a `public`** (gate do autor). Registrar manifests + lacunas a cada coleta.

## LAI / LGPD

- **Folha nominal**: SP publica nominalmente; LGPD permite por interesse público, mas não republicar dados sensíveis. Seguir o padrão já usado em Sorocaba.
- Registrar `pendente_lai` para o que exigir pedido formal (ex.: detalhamentos não publicados no portal).

## Manifest seed (campos mínimos por item)

`municipio=São Paulo · uf=SP · ibge=3550308 · area · orgao · periodo_inicio · periodo_fim · fonte_nome · fonte_url · status · camada_atual · arquivo_publico|lacuna_categoria · observacao`

## Handoff para Codex (após autorização)

1. Reaproveitar os pipelines federais (Onda 1) parametrizando para 3550308 — rodar coleta já.
2. Construir os 5 extratores novos na ordem de prioridade. Verificar **endpoints live** (protocolo exige `fonte_url` real).
3. Estado `raw`/`extracted`; QA + manifest por coleta; sem publicação.
4. Claude valida metodologia/LAI e narrativa; Antigravity executa coleta pesada/deploy quando autorizado.
