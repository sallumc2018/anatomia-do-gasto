# Handoff — Cobertura de dados de Sorocaba

**Data:** 2026-05-22  
**Score atual:** ~71.1% (calculado dinamicamente em `lib/lacunas.ts`)  
**Score anterior (início de sessão):** ~39%  
**Ganho total:** +32.1 pp em duas sessões contínuas  
**Fonte da verdade:** `apps/web/lib/lacunas.ts` — array `LACUNAS` + `COBERTURA_PUBLICADOS`

---

## O que é o score

Índice ponderado: `score_dimensão × peso_dimensão`, onde cada item pontua `status_score × (anos_cobertos / anos_possíveis)`.

| Status      | Pontuação |
|-------------|-----------|
| publicado   | 1.0       |
| parcial     | 0.5       |
| em_coleta   | 0.2       |
| lacuna      | 0.0       |
| inexistente | excluído  |

| Dimensão                        | Peso | Score atual |
|---------------------------------|------|-------------|
| Executivo — orçamento e execução| 30%  | 76.9%       |
| Contratos, obras e fornecedores | 20%  | 57.1%       |
| Câmara Municipal                | 10%  | 63.3%       |
| Transferências e convênios      | 15%  | 100.0%      |
| Controle externo                | 10%  | 52.8%       |
| Autarquias e fundações          | 15%  | 66.7%       |

---

## Datasets publicados nesta sessão (2026-05-22)

| Dataset | Registros/Tamanho | Destino |
|---------|-------------------|---------|
| Convênios federais SICONV 2020–2025 | 73 convênios, R$82M | `transferencias/saida/convenios_federais_sorocaba.csv` |
| PNCP compras+atas 2023–2025 | 294 registros | `contratos/saida/pncp_sorocaba_2022_2026.csv` |
| Subvenções OSCs — detalhe | 10.981 empenhos | `transferencias/saida/subvencoes_osc_sorocaba.csv` |
| Subvenções OSCs — por entidade | 1.187 grupos | `transferencias/saida/subvencoes_por_entidade_sorocoba.csv` |
| Transferências estaduais RREO resumo | 6 anos | `transferencias/saida/transferencias_estaduais_resumo_sorocoba.csv` |
| Transferências estaduais Sefaz-SP ICMS/IPVA | 84 registros mensais | `transferencias/saida/transferencias_estaduais_sp_sorocoba.csv` |
| Alertas TCE-SP SDG 2025 | 4 alertas | `controle_externo/saida/alertas_sdg_2025_sorocaba.csv` |
| FUNSERV RPPS (SICONFI RREO Anexo 04) | 6 anos | `autarquias/saida/funserv_rpps_sorocoba.csv` |
| SAAE despesas (TCE-SP API) | 75.272 registros, R$8B | `autarquias/saida/saae_despesas_tce_2020_2025.csv` |
| SAAE receitas (TCE-SP API) | 1.130 registros, R$2,3B | `autarquias/saida/saae_receitas_tce_2020_2025.csv` |
| Transferências federais (TCE-SP API) | 2.706 registros, R$4,7B | `transferencias/saida/transferencias_federais_tce_sorocoba.csv` |
| EDUSS + Parque Tecnológico (TCE-SP API) | 46.504 registros, R$1,4B | `autarquias/saida/empresas_municipais_tce_2020_2025.csv` |
| DCA SICONFI — Contas Anuais 2020-2025 | 11.466 registros, 7 anexos | `controle_externo/saida/dca_siconfi_sorocaba_2020_2025.csv` |
| Câmara despesas TCE-SP 2020-2025 | 24.417 registros, R$1,23B | `camara/saida/camara_despesas_tce_2020_2025.csv` |
| FUNSERV Saúde (TCE-SP API) | 9.154 registros, R$3,27B | `autarquias/saida/funserv_saude_tce_2020_2025.csv` |

## Pipelines criados

| Script | Descrição |
|--------|-----------|
| `gerar_convenios_transferegov.py` | Consolida SICONV (Transferegov) |
| `gerar_pncp_publicacao.py` | Merge e dedup PNCP |
| `gerar_subvencoes_osc.py` | Filtra empenhos por 3.3.50.* |
| `gerar_transferencias_estaduais_resumo.py` | Extrai linha RREO "Transferências dos Estados" |
| `gerar_transferencias_estaduais_sp.py` | Publica dados Sefaz-SP ICMS/IPVA |
| `gerar_funserv_rpps.py` | Publica RPPS FUNSERV do SICONFI |
| `gerar_saae_despesas_tce.py` | Baixa e publica despesas SAAE via TCE-SP |
| `gerar_saae_receitas_tce.py` | Baixa e publica receitas SAAE via TCE-SP |
| `gerar_transferencias_federais_tce.py` | Baixa FPM+SUS+FNDE via TCE-SP |
| `gerar_empresas_municipais_tce.py` | Baixa EDUSS + Parque Tecnológico via TCE-SP |
| `gerar_dca_siconfi.py` | Baixa DCA SICONFI (balanços anuais PCASP) |
| `gerar_camara_despesas_tce.py` | Baixa despesas da Câmara Municipal via TCE-SP |
| `gerar_funserv_saude_tce.py` | Baixa despesas FUNSERV Assistência Médica via TCE-SP |

## API TCE-SP descoberta e utilizada

`https://transparencia.tce.sp.gov.br/api/json/{despesas|receitas}/sorocaba/{ano}/{mes}`

Órgãos disponíveis (confirmados 2020-2025):
| Órgão | Publicado |
|-------|-----------|
| CÂMARA MUNICIPAL DE SOROCABA | ✅ camara_despesas_tce_2020_2025.csv |
| EMPRESA DE DESENVOLVIMENTO URBANO E SOCIAL DE SOROCABA | ✅ empresas_municipais_tce_2020_2025.csv |
| EMPRESA MUNICIPAL PARQUE TECNOLÓGICO DE SOROCABA | ✅ empresas_municipais_tce_2020_2025.csv |
| FUNSERV. - ASSISTÊNCIA MÉDICA | ✅ funserv_saude_tce_2020_2025.csv |
| FUNSERV. - PREVIDÊNCIA | via SICONFI RPPS |
| PREFEITURA MUNICIPAL DE SOROCABA | via pipelines executivo/contratos |
| SERVIÇO AUTÔNOMO DE ÁGUA E ESGOTO DE SOROCABA | ✅ saae_despesas_tce_2020_2025.csv |

**URBES não está nesta API** — é empresa de economia mista, reporta separadamente.  
**Esta API é a fonte canônica para dados das autarquias e câmara municipais.**

## SICONFI APIs utilizadas

| Endpoint | Dado | Pipeline |
|----------|------|----------|
| `.../rreo?...no_anexo=RREO-Anexo%2004` | RPPS FUNSERV | `extrator_rpps.py` |
| `.../dca?an_exercicio={ano}&co_poder=M&id_ente=3552205` | DCA Contas Anuais | `gerar_dca_siconfi.py` |

**MSC (mensal) retorna 404 para Sorocaba** — não disponível via API.

---

## Estado por dimensão (mai/2026)

### Executivo — orçamento e execução (30%) → ~77% coberto
**Publicados:** despesa por função, receita RREO, saúde fiscal RGF, saúde, educação, segurança, transporte, execução (empenho/liq/pago), despesa orçamentária detalhada, LOA audiência pública 2022–2026.  
**Lacunas restantes:**
- Receita analítica mensal (por conta e mês) — PDFs disponíveis no portal; requer extração
- Pessoal individual (remuneração) — portal requer autenticação
- Patrimônio imobiliário público — via LAI

### Contratos, obras e fornecedores (20%) → ~57% coberto
**Publicados:** conta-corrente de fornecedores 2020–2025, empenhos 2020–2025, restos a pagar 2020–2025, PNCP compras/atas 2023–2025 (294 registros).  
**Lacunas:** contratos pré-2022, obras, precatórios

### Câmara Municipal (10%) → ~63% coberto ↑
**Publicados:** vereadores/subsídio, emendas 2022-2025, despesas execução 2020-2025 (24.417 reg, R$1,23B).  
**Parcial:** gabinete (despesas mensais já publicadas, mas sem cruzamento por vereador).  
**Lacunas:** contratos e licitações da Câmara; emendas 2020–2021

### Controle externo (10%) → ~53% coberto ↑↑
- **DCA SICONFI 2020-2025** ✅ — 11.466 registros, balanço patrimonial + demonstrações completas (Ativo cresce R$5,5B→R$9B; Saldo Patrimonial ficou negativo em 2024/2025 — alerta fiscal)
- **Alertas TCE-SP SDG 2025** — 4 alertas bimestrais LRF
- **Auditoria — indicadores proxy** — publicado via RREO/RGF (parcial 6/6)
- SICONFI MSC mensal — **não disponível via API (404)**

### Autarquias e fundações (15%) → ~67% coberto ↑
- **SAAE** ✅ — 75.272 despesas + 1.130 receitas 2020-2025 via TCE-SP
- **FUNSERV RPPS** ✅ — previdência (contribuições, aposentadorias) via SICONFI
- **FUNSERV Saúde** ✅ — 9.154 despesas assistência médica 2020-2025 via TCE-SP (R$3,27B)
- **EDUSS + Parque Tecnológico** ✅ — 46.504 registros via TCE-SP
- **Urbes** — não está na API TCE-SP; é empresa de economia mista
- **Consórcios** — ainda não mapeados

### Transferências e convênios (15%) → **100% coberto** ✅
- Federais: FPM+SUS+FNDE 2020-2025 via TCE-SP (R$4,7B) + convênios SICONV (R$82M)
- Estaduais: ICMS+IPVA mensal 2020-2026 via Sefaz-SP (R$600M→R$1,1B/ano)
- Subvenções OSCs: empenhos 3.3.50.* 2020-2025 (10.981 empenhos, 1.187 entidades)

---

## Próximos passos por impacto no score (a partir de 71.1%)

| Bloco | Impacto estimado | Dificuldade |
|-------|---------|-------------|
| Receita analítica mensal (PDF portal Sorocaba) | +2pp | Alta — extração PDF |
| TCE-SP pareceres e contas anuais | +1.5pp | Alta — 318 PDFs |
| Pessoal individual (remuneração) | +2pp | Bloqueada (autenticação) |
| Patrimônio imobiliário | +1pp | Média — via LAI |
| Contratos câmara | +0.5pp | Média — portal câmara |
| Contratos pré-2022 | +0.3pp | Média — fonte legada |
| Emendas câmara 2020-2021 | +0.3pp | Alta — não está no CEPA |

**Para chegar a 75%:** receita analítica mensal (PDF) + TCE pareceres + patrimônio + pessoal.

---

## Descobertas importantes desta sessão

1. **SICONFI MSC retorna 404** para Sorocaba — endpoint não disponível para municípios
2. **SICONFI DCA** está disponível para 2019-2025 e tem 7 anexos completos (balanço patrimonial, receitas, despesas por função, variações patrimoniais)
3. **Saldo Patrimonial negativo** em 2024 (-R$1,2B) e 2025 (-R$2,4B) — sinal fiscal crítico identificado nos dados DCA
4. **FUNSERV tem dois fundos distintos** na API TCE-SP: previdência (R$118M/mês empenhos) e saúde (R$25M/mês empenhos)
5. **Câmara Municipal** tem dados completos de execução orçamentária na API TCE-SP (2020-2025)

---

## Como simular o score

```bash
python c:\tmp\calc_score.py
```

## Como atualizar o score

1. Edite `apps/web/lib/lacunas.ts`
2. Mude o `status` do item
3. Atualize `anosCobertos`
4. O `percent` em `page.tsx` recalcula automaticamente no próximo build
