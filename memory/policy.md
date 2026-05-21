# Agent Memory Policy

## Boundary

The public memory layer may index and store only:

- repository instructions such as `AI_MASTER_PROMPT.md`, `ORQUESTRADOR.md`,
  `CODEX.md`, `CLAUDE.md`, and `AGENTS.md`;
- public docs in `docs/`;
- public data manifests in `data/manifests/`;
- public, sanitized handoffs in `memory/handoffs/`;
- public, sanitized token-economy logs in `memory/token-economy/`;
- safe catalog or summary files that describe `data/public` without copying
  large datasets wholesale.

The public memory layer must not index or store:

- `data/raw`, `data/extracted`, `data/validated`;
- `.env`, secrets, credentials, keys, cookies, recovery codes;
- `.git`, `.vercel`, `.local`, `tmp`, `node_modules`, `.next`, caches;
- `G:\` or other external operator drives;
- private operational notes or full chat transcripts.
- private prompts, full chat transcripts, secrets, or unpublished data in token-economy logs.

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
- public token-economy logging when the content is sanitized, concise, and non-sensitive.

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

## Token Economy Logs

Persistent token-economy logs must be concise and auditable. Public logs go to
`memory/token-economy/YYYY-MM.md` and must include only metadata: date,
agent/tool, scope, consulted files, avoided files or sections, consolidated
commands, qualitative or range-based estimate, and privacy notes.

Never store prompts, full chat transcripts, secrets, unpublished data, raw
outputs, local caches, RTK databases, or private operational details in these
logs.
