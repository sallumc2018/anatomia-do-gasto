# Agent Registry

This directory stores the canonical registry for Anatomia do Gasto agents.

The registry is the public contract used to keep `.claude/commands`, Codex
instructions, routing, validation, autonomy, and handoff expectations aligned.

Generated run logs and locks do not belong here. They live under:

```text
.local/agents/
.local/memory/agent-runs/
```

## Validation

```powershell
python tools/agents/validate-agent-contracts.py
python tools/agents/list-agents.py
python tools/agents/plan-route.py "completar dados faltantes sorocaba"
```
