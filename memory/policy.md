# Agent Memory Policy

## Boundary

The public memory layer may index and store only:

- repository instructions such as `AI_MASTER_PROMPT.md`, `ORQUESTRADOR.md`,
  `CODEX.md`, `CLAUDE.md`, and `AGENTS.md`;
- public docs in `docs/`;
- public data manifests in `data/manifests/`;
- public, sanitized handoffs in `memory/handoffs/`;
- safe catalog or summary files that describe `data/public` without copying
  large datasets wholesale.

The public memory layer must not index or store:

- `data/raw`, `data/extracted`, `data/validated`;
- `.env`, secrets, credentials, keys, cookies, recovery codes;
- `.git`, `.vercel`, `.local`, `tmp`, `node_modules`, `.next`, caches;
- `G:\` or other external operator drives;
- private operational notes or full chat transcripts.

## Authority

Every memory source has an authority level:

- `canonical`: current source of truth for agent behavior or publication rules.
- `reference`: useful supporting context.
- `historical`: past state; excluded from normal retrieval.
- `deprecated`: not used by active retrieval.

Agents query `canonical` and `reference` sources by default.

## Autonomy

Allowed without human approval:

- read-only inventory and retrieval over allowed public sources;
- local index rebuilds under `.local/rag/`;
- local handoff drafting under `.local/memory/`;
- public handoff writing when the content is sanitized and non-sensitive.

Requires explicit human approval:

- copying to `data/public`;
- commit, push, deploy, release, or Vercel operations;
- DNS, Registro.br, hosting, environment variable, or infrastructure changes;
- destructive actions, deletes, or branch rewrites;
- operations that affect the user's PC, GitHub, Vercel, Registro.br, or `G:\`.

Never allowed:

- exposing secrets or unpublished data through public memory;
- treating `data/extracted` or `data/validated` as published data;
- using RAG output as proof that a validation was run.

## Handoffs

Persistent handoffs must be concise and structured. Public handoffs go to
`memory/handoffs/YYYY-MM/`; local/private handoffs go to
`.local/memory/handoffs/YYYY-MM/`.

Each handoff must include status:

- `active`
- `resolved`
- `superseded`
- `expired`

Agents should retrieve only `active` handoffs by default.
