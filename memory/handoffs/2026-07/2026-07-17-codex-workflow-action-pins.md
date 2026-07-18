---
id: 2026-07-17-codex-workflow-action-pins
date: 2026-07-17
agent: Codex
status: active
visibility: public
---

# Handoff - Codex

- Scope: referências imutáveis das Actions no workflow agendado.
- Done: substituídas quatro referências por tag/alias por commits oficiais
  verificados; mantidas versões humanas em comentário; a seleção de `just`
  agora é explícita no input `tool`.
- Output: `.github/workflows/scheduled-pipeline.yml` e
  `tools/security/test-workflow-action-pins.py`.
- Validation: três testes específicos e seis testes do input `anos` passaram;
  os dois workflows PNCP passaram em `yaml.safe_load`; `git diff --check`,
  `tools/agents/check-scope-gates.py` e todos os gates canônicos de memória
  passaram.
- Blockers: `actionlint` não está instalado e o comportamento real depende de
  commit/PR com GitHub Actions. `memory/provenance/changes.csv` já estava
  modificado por outro bloco e não foi tocado para evitar conflito.
- Next step: revisar o diff e validar em PR. Tratar separadamente o isolamento
  de `contents: write`; não misturar essa mudança arquitetural com o pinning.
- Related paths: `.github/workflows/scheduled-pipeline.yml`,
  `tools/security/test-workflow-action-pins.py`.
