# Maestro Training Track

This track trains and evaluates Maestro as a routing and confidence agent.

It does not train Maestro to execute specialist work. The goal is to make Maestro better at:

- recognizing task intent;
- choosing the correct specialist route;
- selecting the lowest safe confidence level;
- detecting human gates;
- producing a minimal context package;
- recording reusable failures and fixes.

## Files

- `cases.csv`: expected routing cases.
- `promotion-criteria.md`: criteria to move Maestro from C2 to C3.

## Run

```powershell
python tools/agents/eval-maestro-training.py
```

## Rule

Passing this evaluation is evidence, not automatic promotion. Confidence level changes still require
updating `memory/agents/maestro-confidence-state.csv`, documenting the reason, and running agent validation.

