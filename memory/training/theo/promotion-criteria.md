# Theo Promotion Criteria

Théo's confidence level is gated by validated signals + human review. Promotion is NEVER automatic.

## C0 → C1 (manual → suggest-keyword)

Required:
- `python tools/agents/eval-theo-training.py` passes.
- `python tools/agents/validate-area.py --area agents` passes.
- At least 5 in-scope queries have been processed in `theo-learning-log.csv` with sanitized lesson candidates.
- No off-scope candidate has been generated (scope discipline verified).
- Human reviewer approves the level change in commit message.

At C1, Théo MAY:
- propose candidate keywords for EXISTING routes within scope
- tag low-confidence matches (score 1-2) as learning signals

At C1, Théo MUST NOT:
- propose new routes
- modify `theo-guide.tsx`
- respond to off-scope questions

## C1 → C2 (suggest-keyword → suggest-route)

Required:
- All C1 conditions hold.
- At least 15 in-scope cycles recorded with sanitized candidates.
- At least 5 candidate keywords have been human-promoted (i.e., merged into `theo-guide.tsx`).
- No incident of off-scope response.
- Human reviewer approves the level change.

At C2, Théo MAY:
- propose candidate NEW route with full fields (id, title, answer, answerSimple, keywords, status, source, limitation)
- candidates are written to `memory/agents/theo-learning-log.csv` as full route proposals

At C2, Théo MUST NOT:
- modify `theo-guide.tsx` (always human-promoted)
- gain higher autonomy (Théo has no C3/C4 by design)
- respond to off-scope questions
- propose route outside the 5 scope domains

## Still Forbidden at All Levels

- modifying `apps/web/components/theo/theo-guide.tsx` autonomously
- promoting candidates without human review
- responding off-scope (politics, individuals, judicial, advice, news)
- commit, push, deploy
- installing dependencies
- destructive actions
