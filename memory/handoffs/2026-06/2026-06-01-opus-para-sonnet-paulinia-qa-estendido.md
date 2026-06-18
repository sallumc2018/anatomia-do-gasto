# Handoff Opus → Sonnet — Paulínia: QA estendido (2026-06-01)

**Para:** próxima sessão Sonnet. **Objetivo:** estender a TODOS os anos o cross-check de integridade
TCE×SICONFI que o Opus já validou para 2024. **É QA mecânico (método já definido)** — repetição,
não julgamento. Resultado volta para o Opus decidir a promoção a `data/public`.

## ⚠️ Regras
- **NÃO promover a `data/public/paulinia`** — isso é o portão Opus (decide depois deste QA).
- **NÃO criar a página `/paulinia` ainda** — ela depende de `data/public/paulinia` existir, que só
  nasce após a promoção. Fica para a leva seguinte.
- Branch `codex/institutional-audit-data-catalog`; commits com prefixo `[Claude]`. Não rodar npm.

## Contexto: o que o Opus já validou (2024)
Cross-check passou **ao centavo**: despesa liquidada 2024 = TCE granular (Σ registros com
`evento == "Valor Liquidado"`) = SICONFI RREO executivo total = **R$ 2.586.407.247,87**.

## Tarefa única — estender o cross-check a 2020, 2021, 2022, 2023, 2025

**Fonte A — TCE granular:** `data/extracted/paulinia/tce/transparencia/despesas_paulinia_<ano>.csv`
- Colunas: `ano,mes_num,orgao,mes,evento,nr_empenho,id_fornecedor,nm_fornecedor,dt_emissao_despesa,vl_despesa`
- Somar `vl_despesa` (formato BR: `27131,17` → trocar `.`→'' e `,`→'.') **filtrando `evento == "Valor Liquidado"`**.

**Fonte B — SICONFI RREO executivo:** `data/extracted/paulinia/executivo/saida/despesas_executivo_paulinia_<ano>.csv`
- Pegar a linha `Funcao == "TOTAL"`, coluna `Liquidado`.

**Comparar A vs B por ano.** Tolerância: diferença de centavos (arredondamento) é OK. Diferença
material (> R$ 1.000 ou %) = **sinalizar, não promover** — investigar antes.

Sugestão de script descartável (não precisa versionar): um loop nos 5 anos imprimindo
`ano | TCE_liquidado | SICONFI_TOTAL_liquidado | diff`. Gerar uma tabelinha e gravar em
`data/extracted/paulinia/tce/qa_crosscheck_tce_siconfi.csv` (fica em extracted, não é publicação).

## Checagens secundárias (rápidas, se sobrar tempo)
- **Receitas:** TCE `receitas_paulinia_<ano>.csv` × SICONFI `receita/saida/receitas_paulinia_<ano>.csv`
  — pode não ter total idêntico (recortes diferentes); reportar ordem de grandeza, não exigir match exato.
- **Transferências estaduais:** conferir que o `total` anual de cada `transferencias_estaduais_sp_paulinia_<ano>.csv`
  ≈ soma dos 12 meses (consistência interna).

## Ao terminar → handoff de volta p/ Opus
Tabela `ano | TCE | SICONFI | diff | status`. Se todos baterem: Opus decide promoção a
`data/public/paulinia` + página `/paulinia` + texto editorial (contas 2020). Se algum ano divergir:
descrever a divergência para o Opus julgar.

## Referências
- QA do 2024 + estado: `STATUS.md` (seção "QA Opus — Paulínia TCE×SICONFI 2026-06-01").
- Memória: `project_paulinia_coleta_completa`, `reference_tce_sp_transparencia_api`, `feedback_model_economy_split`.
- Nota técnica: `extrator_tce_transparencia.py` duplica colunas `ano`/`mes_num` (cosmético; ignorar no QA).
