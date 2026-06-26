---
id: 2026-06-25-uiux-para-codex-arquivos-normalizacao-pendentes-de-commit
date: 2026-06-25
agent: Claude UI/UX → Codex
status: active
visibility: public
---

# Handoff — Arquivos de normalização documental pendentes de commit

- Scope: 33 arquivos não commitados detectados no worktree ao encerrar sessão UI/UX.
- Done: Sessão UI/UX concluiu P1 Frontend (commits fbf0b2a, ae249e4, 48f0d6f) e fez push+deploy. Nenhum desses 33 arquivos é de responsabilidade UI/UX.
- Output: nenhum — apenas identificação e relato.
- Validation: `git status --short` confirma os 33 arquivos abaixo.
- Blockers: nenhum técnico; estes arquivos pertencem à sessão Codex de normalização documental de 2026-06-25.
- Next step: Codex deve revisar o diff de cada arquivo e commitar em bloco coeso com prefixo `chore(docs):` ou `chore(normalizacao):`.

## Arquivos modificados (M) — 23

```
.claude/commands/catao.md
.claude/commands/maestro.md
.claude/commands/seguranca.md
AGENTS.md
AI_MASTER_PROMPT.md
CLAUDE.md
CODEX.md
DECISIONS.md
GEMINI.md
ORQUESTRADOR.md
docs/agentes-contexto.md
docs/onboarding-dev.md
memory/registry.csv
memory/token-economy/2026-06.md
pipelines/baixar_transferegov_sorocaba.py
tools/agents/check-peer-review-readiness.py
tools/agents/eval-maestro-training.py
tools/agents/run-readonly-cycle.py
tools/agents/start-topic.py
tools/agents/validate-area.py
tools/rtk/README.md
tools/setup_linux.sh
tasks.txt  (DELETADO — substituído por TASKS.md)
```

## Arquivos novos não rastreados (??) — 10

```
CANONICAL_PATHS.md
IDEAS.md
docs/auditoria/auditoria-codigo-2026-06-25.md
docs/roteamento-codex-claude.md
memory/handoffs/2026-06/2026-06-25-claude-coleta-e-publicacao-sprint-2-e-seguranca-da-coleta-noturna.md
memory/handoffs/2026-06/2026-06-25-claude-coleta-publicacao-e-ui-ux-assumir-tarefas-apos-normalizacao-documental.md
memory/handoffs/2026-06/2026-06-25-claude-ui-ux-canonicals-e-titulos-do-frontend.md
pipelines/gerar_cobertura_sprint2.py
pipelines/testes/test_gerar_cobertura_sprint2.py
tools/gates/check_canonical_routes.py
tools/gates/test_check_canonical_routes.py
```

- Related paths: CANONICAL_PATHS.md, TASKS.md, DECISIONS.md, tools/gates/
