# Fontes de Dados — Anatomia do Gasto

## SICONFI (Tesouro Nacional)
URL base: `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/`
Parâmetro chave: `id_ente` = código IBGE do município
Disponível para TODOS os 5571 municípios brasileiros.

### Extractors SICONFI disponíveis
| Script | Dados | Endpoint |
|--------|-------|----------|
| `extrator_receita.py` | Receitas RREO Anexo 01 | `/rreo` |
| `extrator_executivo.py` | Despesas por função RREO Anexo 02 | `/rreo` |
| `extrator_rcl.py` | Receita Corrente Líquida | `/rreo` |
| `extrator_natureza_despesa.py` | Despesas por natureza | `/rreo` |
| `extrator_receita_capital.py` | Receitas de capital (crédito, alienação) | `/rreo` |
| `extrator_rpps.py` | RPPS (regime previdenciário próprio) — OPCIONAL | `/rreo` |
| `extrator_rreo_seguranca.py` | Segurança pública — OPCIONAL | `/rreo` |
| `extrator_rreo_transporte.py` | Transporte — OPCIONAL | `/rreo` |
| `extrator_rgf_pessoal.py` | RGF pessoal (limite Lei de Responsabilidade Fiscal) | `/rgf` |
| `extrator_rgf_divida.py` | RGF dívida consolidada | `/rgf` |
| `extrator_divida_detalhada.py` | Dívida detalhada | `/rgf` |
| `extrator_seguranca.py` (DCA) | DCA Segurança — OPCIONAL | `/dca` |
| `extrator_dca_transporte.py` | DCA Transporte — OPCIONAL | `/dca` |
| `extrator_rreo.py` | RREO genérico (multi-anexo) | `/rreo` |

Extractors marcados OPCIONAL: nem todos os municípios têm dados (ex: municípios sem RPPS próprio, sem secretaria de segurança).

## FNS — Fundo Nacional de Saúde
URL: API fundo-a-fundo do Ministério da Saúde
Script: `baixar_fns_repasses.py`
Anos: 2015–2026

## Portal Transparência (CGU)
### Transferências Federais (Convênios)
Script: `baixar_transferencias_federais.py`
Requer: `PORTAL_TRANSPARENCIA_KEY` no secrets.env
Anos: 2004–2026

### Emendas Parlamentares
Script: `baixar_emendas_federais.py`
Requer: `PORTAL_TRANSPARENCIA_KEY`
Anos: 2014–2026

### FNDE/SIOPE — Educação
Script: `baixar_fnde_siope.py`
Status: **403 em produção** — requer chave com permissão `/transferencias`.
Workaround: aguardando nova chave API.

## SIOPS — Saúde
Script: `baixar_siops_tabnet.py`
Fonte: DATASUS/TabNet (webscraping)
Disponível para Sprint 1 (municípios registrados)

## Fazenda-SP — Transferências Estaduais
Script: `baixar_transferencias_estaduais_sp.py`
Requer: `sefaz_sp` configurado em paths.py
Apenas municípios SP com essa chave (Sorocaba, Paulínia, São Paulo).

## Padrão de variáveis de ambiente para extractors
```python
MUNICIPIO      = chave de storage (ex: "sorocaba", "palmas_to")
MUNICIPIO_IBGE = código IBGE (ex: "3552205")
MUNICIPIO_NOME = nome completo (ex: "Sorocaba")
MUNICIPIO_UF   = UF em maiúscula (ex: "SP")
```
Sprint 2 define essas vars automaticamente em `coletar_municipios_brasil.py:146-150`.
Sprint 1 usa apenas `MUNICIPIO` (paths.py lê IBGE da config).
