# Interligações Sorocaba — estado em 2026-05-29

Mapa definitivo do que foi conectado hoje, o que tem alternativa e o que é lacuna real.
Base: trabalho da sessão 28-29/05/2026 (Claude + Codex).

## Dados publicados hoje (data/public)

| Dataset | Arquivo | Registros | Nota |
|---|---|---|---|
| SICONFI RGF — pessoal | rgf_pessoal_sorocaba_2020_2025.csv | 6 (anual) | Gasto pessoal vs RCL; limites LRF |
| SICONFI RGF — dívida | rgf_divida_sorocaba_2020_2025.csv | 6 | Dívida consolidada bruta e líquida |
| SICONFI RGF — RCL | rgf_rcl_sorocoba_2020_2025.csv | 6 | Receita corrente líquida por tipo |
| SAAE pessoal/RH | saae_pessoal_cargos_amostra_sorocaba_2026.csv | 100 | Amostra maio/2026; 100/139 cargos |
| Câmara LRF/LDO/PPA/prestação/metas | camara_documentos_orcamentarios_sorocaba_2017_2027.csv | 21 | Inventario/texto de atas de audiencias publicas e documentos legislativos relacionados; LDO/metas oficiais completas sao da Prefeitura/Executivo |

## Extraído hoje, aguardando QA + gate de publicação

| Dataset | Arquivo | Registros | Gate |
|---|---|---|---|
| RREO Anexo 01 — receita orçamentária | rreo_receita_orcamentaria_sorocaba_2020_2025.csv | 2.791 | /qa + decisão |
| FUNSERV APR — movimentações financeiras | funserv_apr_sorocaba_2020_2026.csv | 71 (66 com valor) | /qa + decisão |
| Urbes contratos outros | contratos_contratos_outros_ocr.csv | 47 (100% OCR ok) | /qa + decisão |
| Urbes contratos receitas | contratos_contratos_receitas_ocr.csv | 33 (100% OCR ok) | /qa + decisão |
| Urbes contratos transporte | contratos_contratos_transporte_ocr.csv | em andamento | aguardar |

## Mapa de alternativas para itens LAI

### Cobertos por fonte alternativa (sem precisar do LAI)

| Item LAI | Fonte alternativa | Cobertura | Diferença do LAI |
|---|---|---|---|
| Registro analítico receita orçamentária | SICONFI RREO Anexo 01 | 2020-2025 anual por conta | LAI teria dados mensais e mais granular |
| Balancetes de receita | SICONFI RREO Anexo 01 | 2020-2025 anual | LAI teria balancetes mensais |
| Registro analítico despesa orçamentária | Empenhos publicados (203k) + natureza_despesa | 2020-2025 transação | Cobre substancialmente |
| PPA | PDFs Câmara baixados hoje (2021, 2026) | parcial | LAI teria PPA Prefeitura completo |
| LDO | PDFs Camara baixados hoje tratam de audiencias/documentos relacionados, nao da LDO oficial completa | parcial | LAI/coleta da Prefeitura deve buscar LDO completa |
| RREO | SICONFI API direta | 2020-2025 | Equivalente ao RREO da Prefeitura |
| RGF | SICONFI API direta | 2020-2025 | Equivalente ao RGF da Prefeitura |
| Contratos e aditivos | PNCP 2022-2025 (2102 reg) + pre-2022 (1080 reg) | 2020-2025 | Aditivos são gap real; objetos cobertos |
| Licitações | PNCP modalidades + pre-2022 | 2020-2025 parcial | Editais completos ainda faltam |

### Parcialmente cobertos (LAI complementaria)

| Item LAI | Alternativa disponível | Lacuna restante |
|---|---|---|
| Remuneração servidores | Portal Sorocaba (precisa Playwright) | Série histórica; TCE-SP não tem API |
| Obras públicas | PNCP parcial + 69 registros ativos | Histórico de execução física |
| Precatórios | 1358 registros publicados (TRT/TRF) | Dados de pagamento efetivo |
| Jornal Oficial | Portal Sorocaba (precisa Playwright) | Texto dos atos |
| FUNSERV balanços 2019-2025 | Portal 404; histórico até 2018 no raw | Portal reestruturou; LAI é única via |

### Lacunas reais — sem alternativa funcional

| Item | Por que não há alternativa | Base legal da obrigação |
|---|---|---|
| Conta corrente bancária | Registro interno de tesouraria; não publicado em nenhum portal federal | LC 131/2009 Art. 2º I |
| Livro Caixa | Escrituração contábil interna | Lei 4.320/64 Art. 85 |
| Livro Diário | Escrituração contábil interna | Lei 4.320/64 Art. 85 |
| Livro Razão | Escrituração contábil interna | Lei 4.320/64 Art. 85 |
| Despesa extraorçamentária analítica | Movimentações fora do orçamento; sem espelho em SICONFI público | LC 131/2009 |
| SICONFI MSC | Matriz de saldos contábeis; requer credencial de acesso | — |
| Câmara realizado 2020-2021 | e-SIC protocolado em 24/05; prazo 15/06 | LAI Art. 11 |
| FUNSERV rentabilidade | Portal 404; e-SIC FUNSERV adicionado em 29/05 | LC 131/2009 |
| AGEM | Consórcio metropolitano; escopo Sorocaba a confirmar | — |

## Remuneração servidores: próximo passo concreto

O portal sorocaba.sp.gov.br/transparencia retornou 200 mas é SPA JavaScript.
Rodar Playwright para mapear a estrutura e verificar se há download de CSV/XLS.
Comando sugerido:
```
python pipelines/baixar_saae_dados_abertos.py  # padrão Playwright que já funciona
```
Adaptar lógica para o portal municipal (URL base: sorocaba.sp.gov.br/transparencia).

## Posição atual no score (estimativa)

| Categoria | Antes | Depois (publicado hoje + gate pendente) |
|---|---|---|
| Publicado | 10 | 10 + 5 RGF (fiscal) |
| Coletado pendente | 9 | 12 (RREO + FUNSERV APR + Urbes) |
| LAI necessário | 20 → 18 | 18 (2 convertidos para alternativa) |
| Score site (lacunas.ts) | 80% | ~83% estimado após Codex atualizar |

## LOA 2020-2021: confirmado inexistente

Prefeitura confirmou que os arquivos digitais da LOA 2020 e 2021 não existem.
Isso é lacuna declarável como falta de transparência documental, não como recusa.
Deve aparecer em /lacunas com nota específica de "declarado inexistente pela fonte".
