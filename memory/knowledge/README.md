# Problems and Solutions Knowledge Base

This directory stores public, sanitized operational learning for Anatomia do Gasto.

- `problems.csv`: failures, errors, blockers, barriers, regressions, validation failures, and process risks.
- `solutions.csv`: fixes, mitigations, workarounds, validated procedures, and reusable resolutions.

The two files are linked by `solution_id` in `problems.csv` and `problem_id` in `solutions.csv`.

## Rules

- Record only public and sanitized information.
- Do not include private prompts, full conversation history, unpublished data contents, operational logs, credentials, personal files, or environment values.
- Prefer short evidence references over long logs.
- Use `status=open` until the solution is validated.
- Use `status=resolved` only after a validation command or equivalent check passes.

## Validation

```powershell
python tools/memory/validate-knowledge-base.py
```

