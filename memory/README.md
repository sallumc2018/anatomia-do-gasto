# Public Agent Memory

This directory is the canonical, versioned memory layer for Anatomia do Gasto
agents.

It stores only public, reusable context that can safely live in the public
repository. It is designed for agent retrieval, handoff continuity, and audit
traceability without exposing operational secrets or unpublished data.

## What Belongs Here

- Durable decisions that should guide future agents.
- Public handoffs that do not include private operational details.
- Retrieval registry entries for public documentation, manifests, and safe
  catalogs.
- Schemas that define how agent memory is written and validated.
- RAG usage documentation.

## What Does Not Belong Here

- Secrets, credentials, tokens, cookies, private keys, recovery codes, `.env`
  files, screenshots with sensitive information, personal files, or private
  operational memory.
- `data/raw`, `data/extracted`, or `data/validated`.
- Local status, logs, caches, generated indexes, or temporary work.
- Full conversation history when a short traceable summary is enough.

## Local Memory

Operational memory that is useful only on this machine belongs under
`.local/memory/`. Local RAG indexes belong under `.local/rag/`. Both locations
are ignored by Git and Vercel.

## Retrieval Rule

RAG output is context, not authority. Before editing code, data flow, pipeline,
publication rules, or deployment behavior, agents must read the relevant source
files directly.
