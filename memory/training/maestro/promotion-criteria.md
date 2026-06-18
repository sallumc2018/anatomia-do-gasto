# Maestro C2 to C3 Promotion Criteria

Maestro may be considered for C3 only after all conditions below are true.

## Required Evidence

- `python tools/agents/eval-maestro-training.py` passes.
- `python tools/agents/validate-area.py --area agents` passes.
- `python tools/agents/validate-area.py --area memory` passes.
- At least 5 real routed work cycles are recorded as validated in the knowledge base or handoffs.
- No unresolved high or critical problem is linked to Maestro routing.

## C3 Scope

At C3, Maestro may decide local semi-autonomous routes when:

- the target agent is in `memory/agents/registry.csv`;
- the task does not cross a human gate;
- the package has explicit read paths, write paths, non-read constraints, and validation;
- the working tree has no unrelated changes in the target paths;
- validation is available and locally runnable.

## Still Forbidden

C3 does not allow Maestro to approve:

- publication to `data/public`;
- commit, push, deploy;
- dependency installation;
- destructive actions;
- changes to DNS, hosting, environment variables, gates, or autonomy;
- promotion of learning candidates into policy.

