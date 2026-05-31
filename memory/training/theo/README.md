# Theo Training Track

This track trains and evaluates Théo as a deterministic guide agent within strict scope:
ONG identity, transparência, LAI, site navigation, GitHub access.

Théo does NOT execute. Training improves Théo's keyword/route coverage by:

- recognizing in-scope question intent
- choosing the best existing route (highest score)
- detecting low-confidence matches (gaps)
- proposing sanitized candidate keywords/routes
- declining off-scope questions

## Files

- `scope.md`: explicit in-scope vs off-scope domains.
- `cases.csv`: training cases (query + expected route + scope flag).
- `routes-snapshot.json`: snapshot of THEO_ROUTES from `apps/web/components/theo/theo-guide.tsx`.
- `promotion-criteria.md`: criteria to move Théo from C0 to C1 to C2.

## Run

Static eval (format + route ids + state consistency):

```powershell
python tools/agents/eval-theo-training.py
```

Autonomous training cycle (matcher against cases, candidate generation):

```powershell
python tools/agents/train-theo.py --cycle
```

## Rule

Passing the eval is evidence, not automatic promotion. Confidence level changes still require
updating `memory/agents/theo-confidence-state.csv`, documenting the reason, and running:

```powershell
python tools/agents/validate-area.py --area agents
```

Promotion of a candidate keyword/route to policy requires editing `apps/web/components/theo/theo-guide.tsx`
and a human-visible review. The trainer (Maestro) never auto-promotes.

## Sync

When `theo-guide.tsx` changes (new route or keyword added), refresh the snapshot:

```powershell
python tools/agents/train-theo.py --refresh-snapshot
```
