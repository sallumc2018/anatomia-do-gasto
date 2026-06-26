---
id: 2026-06-25-claude-coleta-publicacao-e-ui-ux-assumir-tarefas-apos-normalizacao-documental
date: 2026-06-25
agent: Claude Coleta Publicacao e UI UX
status: active
visibility: public
---

# Handoff - Claude Coleta Publicacao e UI UX

- Scope: Assumir tarefas apos normalizacao documental
- Done: Codex criou o mapa canonico do projeto, migrou tasks.txt para TASKS.md, criou IDEAS.md e separou fila ativa, estado, decisoes, roadmap e handoffs.
- Output: CANONICAL_PATHS.md, TASKS.md, IDEAS.md, STATUS.md e DECISIONS.md normalizados.
- Validation: Contrato de arquivos OK; peer-review readiness OK; Ruff e py_compile do gate OK; diff-check OK.
- Blockers: Claude deve preservar os arquivos de testes e auditoria em edicao pelo Codex e nao misturar frontend com coleta no mesmo commit.
- Next step: Claude Coleta/Publicacao assume a secao P0 de TASKS.md; Claude UI/UX assume a secao P1 Frontend e Descoberta; ambas leem CANONICAL_PATHS.md e atualizam STATUS.md ao concluir.
- Related paths: CANONICAL_PATHS.md, TASKS.md, IDEAS.md, STATUS.md, DECISIONS.md
