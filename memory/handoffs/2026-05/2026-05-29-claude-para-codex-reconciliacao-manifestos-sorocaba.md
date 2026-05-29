---
id: 2026-05-29-claude-para-codex-reconciliacao-manifestos-sorocaba
date: 2026-05-29
agent: Claude Code para Codex
status: active
visibility: public
---

# Handoff - Claude Code para Codex

- Scope: reconciliacao dos manifestos de cobertura de Sorocaba contra o estado real do disco (data/extracted e data/public), a pedido do usuario, antes de qualquer nova captacao.
- Done:
  - Auditoria read-only de data/extracted/sorocaba, data/public/sorocaba, datasets_status.json, sorocaba_100_auditavel.csv e datasets.csv.
  - Corrigi notas factualmente erradas (campo bloqueio_atual, NAO-pontuavel) no auditavel: FNS/repasses_sus (estava "2025 MemoryError"; real = extraido 2020-2026, 2025=45 linhas Sorocaba e 2026=20) e SICONFI/rreo e /rgf (estava "2023-2025"; real = 2020-2025). Ajustei proximo_passo do FNS para rodar_qa_e_normalizar_para_publicacao.
  - Produzi relatorio fiel docs/reconciliacao-sorocaba-2026-05-29.md classificando as 55 fontes em 5 buckets.
- Output:
  - data/manifests/sorocaba_100_auditavel.csv (4 celulas corrigidas; 55 linhas / 25 colunas intactas)
  - docs/reconciliacao-sorocaba-2026-05-29.md
  - memory/provenance/changes.csv (PV-2026-05-29-007)
- Validation:
  - CSV reparse OK (55 linhas, 25 colunas consistentes)
  - python tools/memory/validate-provenance-log.py -> OK (35 changes)
  - evidencia conferida read-only; score NAO recalculado (decisao deliberada)
- Achado central: as 3 fontes de verdade discordam. O auditavel credita 4 publicados; datasets_status.json lista ~19; data/public tem 18 areas com arquivos. O auditavel SUBDECLARA e dirige o score (79.7% -> 80% em lacunas.ts). O score real e maior.
- Blockers / o que NAO fiz (precisa decisao):
  - NAO alterei status_auditavel de nenhuma linha do Bucket A (empenhos, fornecedores, restos, FNS, transferencias federais, camara execucao, SAAE, FUNSERV, SICONFI/dca). Isso muda o score publico -> exige revisao do Codex + decisao do usuario, nao promocao silenciosa.
  - NAO publiquei nada em data/public. NAO rodei calc_score. NAO commit/push/deploy/npm.
  - Bucket A e inferencia por contagem de registros + presenca de arquivo, NAO verificacao linha-a-linha de cobertura por ano.
- Next step (Codex):
  - Revisar Bucket A do relatorio e confirmar cobertura temporal por dataset antes de propor upgrade de status_auditavel.
  - Decidir gate de validacao+publicacao de SICONFI rreo/rgf (Bucket B).
  - Buckets C/D (Urbes 369 PDFs sem extrator, Playwright camara/SAAE) ficam como captacao futura.
  - Bucket E permanece com os pedidos e-SIC manuais do usuario (fora de escopo automatizado).
- Related paths:
  - docs/reconciliacao-sorocaba-2026-05-29.md
  - data/manifests/sorocaba_100_auditavel.csv
  - data/manifests/datasets_status.json
  - tools/diagnostico/calc_score.py
  - apps/web/lib/lacunas.ts
