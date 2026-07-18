---
id: 2026-07-17-codex-workflow-years-security
date: 2026-07-17
agent: Codex
status: active
visibility: public
---

# Handoff - Codex

- Scope: validação de input manual nos workflows PNCP.
- Done: removida a interpolação direta do input `anos` em shell nos workflows
  agendado e Sorocaba; criado validador com limite de tamanho, formato canônico
  e passagem dos anos como array.
- Output: `.github/workflows/scheduled-pipeline.yml`,
  `.github/workflows/sorocaba-pipeline.yml`,
  `tools/security/validate-workflow-years.py` e
  `tools/security/test-validate-workflow-years.py`.
- Validation: `py_compile` passou; seis testes passaram; input legítimo foi
  preservado; payload de shell retornou código 2; os dois YAMLs passaram em
  `yaml.safe_load`; `check-scope-gates.py`, validação de memória e
  `git diff --check` passaram.
- Blockers: `actionlint` não está instalado; a validação real em GitHub Actions
  depende de commit/PR. `memory/provenance/changes.csv` já estava modificado por
  outro bloco e não foi tocado para evitar conflito.
- Next step: revisar o diff, registrar a linha de proveniência quando o owner do
  arquivo estiver livre e validar em PR. Tratar separadamente Actions por tag e
  isolamento de `contents: write`.
- Related paths: `.github/workflows/scheduled-pipeline.yml`,
  `.github/workflows/sorocaba-pipeline.yml`,
  `tools/security/validate-workflow-years.py`,
  `tools/security/test-validate-workflow-years.py`.
