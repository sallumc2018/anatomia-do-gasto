# Theo Learning Contract

This file defines how Théo becomes a learning routing agent while remaining 100% deterministic.

## Boundary

Théo answers ONLY within the scope defined in `memory/training/theo/scope.md`:

1. Anatomia do Gasto (ONG) identity, mission, governance
2. Transparência pública principles
3. Lei de Acesso à Informação (LAI 12.527/2011)
4. Navigation of the site anatomiadogasto.ong.br
5. GitHub access and contribution

Théo NEVER answers about: political opinion, named individuals, judicial process, financial/legal/medical advice,
current events outside published data, interpretation of dashboards (Plínio's job).

Théo remains deterministic. Learning means registering candidate route/keyword additions; it NEVER means
modifying production code (`apps/web/components/theo/theo-guide.tsx`) without explicit human review and promotion.

## Confidence

Autonomy is controlled by `memory/agents/theo-confidence-levels.csv` and `memory/agents/theo-confidence-state.csv`.

Default interpretation:
- C0 manual: log mismatched in-scope questions only; no candidate proposal
- C1 suggest-keyword: propose candidate keyword for existing route in scope; never propose new route
- C2 suggest-route: propose candidate new route within scope (full fields); never modify production code

Théo does NOT have C3/C4 — Théo cannot gain autonomy over production code by design. Promotion of any
candidate requires explicit human review + theo-guide.tsx edit + eval pass.

## Training

Training corpus: `memory/training/theo/cases.csv` (question + expected route or expected gap signal).

Static eval (cases format + route id existence + state consistency):
```
python tools/agents/eval-theo-training.py
```

Autonomous training cycle (run matcher against cases, write candidates):
```
python tools/agents/train-theo.py --cycle
```

Snapshot of THEO_ROUTES (id, keywords): `memory/training/theo/routes-snapshot.json`.

## Learning Loop

1. Maestro identifies a Théo-scope question (from /goal or user request).
2. Théo's matcher returns (route_id, score) or fallback.
3. Outcome signals:
   - score >= 3 + route matches expected: success.
   - score 1-2: low-confidence; candidate keyword suggested.
   - score 0 (fallback): missing route candidate; only at C2.
   - off-scope: log + decline.
4. Candidate logged to `memory/agents/theo-learning-log.csv` with `status=candidate`.
5. Maestro escalates candidates to user for review.
6. Promotion = update theo-guide.tsx + re-run train-theo.py + run eval-theo-training.py.

## Outcome Signals

Good:
- in-scope query matched expected route with score >= 3
- novice formality detected and respected
- off-scope query correctly declined (would be tagged as off-scope by trainer)

Bad:
- in-scope query returned fallback ("fontes" default)
- in-scope query returned wrong route id
- low score (1-2) on a query the user reformulated
- off-scope query was answered (scope leak)

## Promotion Rules

Candidate becomes policy ONLY after:
- the lesson is public and sanitized (no PII, no credentials)
- the proposed route/keyword change is explicit in `apps/web/components/theo/theo-guide.tsx`
- `python tools/agents/eval-theo-training.py` passes with the case added/updated
- `python tools/agents/validate-area.py --area agents` passes
- a human reviewer approves (commit message documents the promotion)

## Privacy

Learning records must NOT include: private user data, IP addresses, credentials, unpublished data contents,
PII. Only sanitized question text + matched route + score + scope flag.

## Trainer

The trainer of Théo is the **Maestro** (per `/maestro` command). The Maestro:
- selects training cases from the in-scope corpus
- runs `tools/agents/train-theo.py` periodically
- summarizes candidates for the user
- never auto-promotes a candidate
- escalates if a candidate would touch out-of-scope domain
