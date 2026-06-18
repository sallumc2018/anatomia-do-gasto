# Handoff Claude → Opus — Paulínia coleta SICONFI concluída
**Data:** 2026-05-31  
**De:** Claude Sonnet (sessão anterior)  
**Para:** Claude Opus (continuação)

---

## O que foi feito nesta sessão

### 1. Pipelines parametrizados para multi-município
17 scripts adaptados — todos usam `MUNICIPIO` env var via `paths.py`:
- 15 extratores SICONFI: import `MUNICIPIO` + filenames `_{MUNICIPIO}_` em vez de `_sorocaba_`
- `baixar_fns_repasses.py`: CFG-driven (nome/uf/ibge); filtro sem hardcode
- `baixar_transferencias_estaduais_sp.py`: lê `sefaz_sp` do CFG; falha claro se ausente
- `paths.py`: adicionados campos `sefaz_sp` e `cnpj_prefeitura` ao MUNICIPIOS dict

### 2. Extração SICONFI completa — 89 CSVs em `data/extracted/paulinia/`
Período 2020–2025, todos em `G:\Meu Drive\Omega-data\extracted\paulinia\`:

| Área | Arquivos | Destaques |
|---|---|---|
| Receita | 6 | R$1.4B (2020) → R$3.0B (2025) |
| Despesa executivo | 6 | R$2.6B liquidado 2024 |
| Pessoal/RCL | 6 | **59.5% em 2020** (acima do limite LRF de 54%) |
| Dívida simples + detalhada | 12 | Baixa: 8–25% da RCL |
| RPPS | 6 | Superávit em todos os anos |
| RCL + natureza + capital | 18 | Série completa |
| Segurança | 6 | ~R$109M em 2024 |
| Transporte (RREO+DCA) | 12 | ~R$150M liquidado 2024 |
| Saúde (rreo detalhamento) | 3 | 2023–2025 |
| Transferências federais | 5 | 2021–2025 |
| FNS repasses SUS | 7 | R$18M em 2024 (Fundo Municipal de Saúde) |

### 3. Achados relevantes para narrativa editorial
- **Pessoal 2020: 59.5% da RCL** — acima do limite LRF (54%). Provável causa da rejeição de contas pelo TCE-SP.
- Pessoal voltou a subir: 50.1% (2024), 52.3% (2025) — tendência preocupante.
- Dívida baixa e declinante (25% → 8% RCL). O problema não é dívida, é gasto corrente.
- Receita cresceu 110% em 5 anos (REPLAN/Petrobras movimenta o ISS e ICMS-cota).
- RPPS saudável — superávit consistente.

---

## O que falta para Paulínia

### Bloqueado apenas por 2 constantes em paths.py (fácil de desbloquear):
```python
# pipelines/paths.py linha 11 — preencher:
"paulinia": {"ibge": "3536505", "uf": "SP", "nome": "Paulinia", 
             "sefaz_sp": None,       # ← descobrir no fazenda.sp.gov.br/RepasseConsulta
             "cnpj_prefeitura": None} # ← CNPJ da Prefeitura de Paulínia
```
Com `sefaz_sp` preenchido → rodar `MUNICIPIO=paulinia py baixar_transferencias_estaduais_sp.py`

### Requer scripts novos (próxima tarefa do Opus):
1. **TCE-SP Paulínia** — adaptar `pipelines/baixar_tce_sorocaba.py` (640 linhas, mesma API TCE-SP, só muda o slug da URL de `sorocaba` para `paulinia`)
2. **Portal prefeitura** — inventariar `https://www.paulinia.sp.gov.br/portal/dados-abertos`
3. **Câmara SMARAPD** — `https://transparencia-cmpaulinia.smarapd.com.br/#/`

### Não aplicável (entidades Sorocaba-específicas, sem equivalente):
- SAAE, URBES, FUNSERV — pular para Paulínia

---

## Commits desta sessão
- `[Claude] Parametrizar 17 pipelines para multi-município (Paulínia)` 
- `[Claude] STATUS + roadmap Paulínia: 81 CSVs SICONFI extraídos (2026-05-31)`

## Arquivos de referência
- `docs/roadmap-paulinia.md` — ordem de trabalho atualizada
- `data/manifests/paulinia_100_auditavel.csv` — manifesto de cobertura
- `data/manifests/paulinia_seed_sources.csv` — fontes iniciais com URLs
- `STATUS.md` — estado atual do projeto
