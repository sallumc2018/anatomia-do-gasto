---
id: 2026-07-17-codex-workflow-least-privilege
date: 2026-07-17
agent: Codex
status: active
visibility: public
---

# Handoff - Codex

- Scope: privilégio mínimo no workflow agendado.
- Done: o padrão e o job de coleta agora usam `contents: read`; secrets R2
  permanecem somente no job de coleta; três conjuntos publicáveis são
  transportados por artefato com retenção de um dia; somente o job final,
  dependente da coleta e sem secrets R2, recebe `contents: write`.
- Output: `.github/workflows/scheduled-pipeline.yml` e
  `tools/security/test-workflow-least-privilege.py`. O teste de pinning também
  cobre as Actions oficiais de upload e download adicionadas, e
  `tools/security/test-all-workflow-governance.py` protege os cinco workflows
  contra Actions mutáveis e permissões implícitas.
- Validation: dezesseis testes de segurança passaram; os dois workflows PNCP
  passaram em `yaml.safe_load`; `git diff --check` e
  `tools/agents/check-scope-gates.py` passaram.
- Blockers: `actionlint` não está instalado e o fluxo de artefato/push ainda
  precisa ser validado em GitHub Actions por commit/PR.
- Next step: revisar o diff completo, validar em PR e só então classificar os
  três achados GH-ACT como corrigidos remotamente.
- Related paths: `.github/workflows/scheduled-pipeline.yml`,
  `tools/security/test-workflow-least-privilege.py`,
  `tools/security/test-workflow-action-pins.py`,
  `tools/security/test-all-workflow-governance.py`.
