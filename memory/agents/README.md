# Agent Registry

This directory stores the canonical registry for Anatomia do Gasto agents.

The registry is the public contract used to keep `.claude/commands`, Codex
instructions, routing, validation, autonomy, and handoff expectations aligned.

Maestro routing learning is documented in `maestro-learning.md`. Sanitized
candidate lessons live in `maestro-learning-log.csv` and become policy only
after an explicit command, registry, or documentation update.

Generated run logs and locks do not belong here. They live under:

```text
.local/agents/
.local/memory/agent-runs/
```

## Validation

```powershell
python tools/agents/validate-agent-contracts.py
python tools/agents/validate-maestro-learning.py
python tools/agents/check-scope-gates.py
python tools/agents/list-agents.py
python tools/agents/plan-route.py "completar dados faltantes sorocaba"
python tools/agents/start-topic.py "completar dados faltantes sorocaba" --rag-limit 1
```
