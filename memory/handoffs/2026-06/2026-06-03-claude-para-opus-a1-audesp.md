# Handoff: A1 — AUDESP / contas municipais TCE-SP (Sorocaba)

**De:** Claude Opus (sessão Mapa de cobertura — 2026-06-03)
**Para:** próxima sessão **Opus (high effort)** — tarefa de risco médio-alto (coleta + correção de bug + decisão de publicação)
**Branch sugerido:** `claude/infra-multi-municipio` (é coleta/pipeline) ou worktree próprio
**Modelo:** **Opus** confirmado — envolve bug ambíguo, fonte nova e julgamento de publicação. Não usar modelo econômico.

---

## Objetivo verificável

Tornar a fonte **AUDESP / contas municipais do TCE-SP** publicável para Sorocaba 2020-2025 — ou provar e documentar que o dado é indisponível publicamente (LAI). Hoje está como `coletado_pendente_validacao` no manifesto, mas o que existe é **log de coleta**, não dataset.

## Dois sub-problemas (resolver os dois)

### 1. BUG das "contas anuais" (afeta Sorocaba E Paulínia)
- `pipelines/baixar_tce_sorocaba.py` (~linha 142, `{TCE_HOST}/contas-anuais`) aponta para a **página ESTADUAL fixa** (Contas do Governador), sem filtro por ente municipal.
- Prova: `data/extracted/sorocaba/tce/contas_anuais/inventario_pdfs_contas_anuais.csv` = 318 PDFs estaduais, 0 menções ao município, 333 a "Governador".
- **Inócuo hoje** (CSV interno, não publicado), mas inútil. Corrigir o escopo: mirar **contas municipais por ente/exercício** (pesquisa processual por município no TCE-SP).

### 2. AUDESP — acesso público real
- `data/extracted/sorocaba/tce/resumo_coleta_tce_sorocaba.json` é log (chaves: alertas, contas_anuais, fontes, links_relevantes, transparencia_amostras), não dataset.
- AUDESP = sistema onde o município presta contas ao TCE-SP (fases I-V). Investigar o **portal público de consulta AUDESP / transparência TCE-SP** e identificar downloads reais por ente municipal.
- Se houver download público → coletar → extrair → QA → decidir publicação.
- Se NÃO houver acesso público → documentar como `lai_necessario` (mover de nível no mapa de cobertura) com prova da indisponibilidade. **Dado ausente não é zero.**

## Paths / evidência
- Bug: `pipelines/baixar_tce_sorocaba.py`, `data/extracted/sorocaba/tce/contas_anuais/`
- AUDESP: `data/extracted/sorocaba/tce/`, `resumo_coleta_tce_sorocaba.json`
- Referência multi-município: `reference_tce_sp_transparencia_api` (API por slug, sem CNPJ/WAF)
- Manifesto (fonte de verdade): `data/manifests/sorocaba_100_auditavel.csv` (linha orgao=AUDESP, area=controle)
- Mapa de cobertura: `data/manifests/sorocaba/mapa_cobertura.csv`

## Validação esperada
- Se publicar: gates `validate-area --area publication` + `--area scope` OK; `verificar_publicacao --strict` OK; entrada em qa.csv com sha256 e fonte; classification + datasets atualizados; mindmap regenerado.
- Se LAI: linha do manifesto movida para `lai_necessario` + redação de pedido e-SIC (acionar `/frontino`).
- Bug das contas anuais: novo inventário só com PDFs municipais (0 menções a "Governador").

## Proibições
- Não publicar o `inventario_pdfs_contas_anuais.csv` estadual (é o bug).
- Não tratar log de coleta como cobertura.
- LGPD: se aparecer dado pessoal de pessoa física, aplicar cautela (ver postura do mantenedor: publicar o de menor consequência jurídica enquanto não há advogado).

## Formato curto de resposta esperado
Feito / Saída (publicado ou LAI, com evidência) / Validação (gates) / Bloqueios / Proveniência (PV-…).
