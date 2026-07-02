---
id: 2026-07-02-codex-sprint2-slug-collision-gate
date: 2026-07-02
agent: Codex
status: active
visibility: public
---

# Handoff - Codex

- Scope: sprint2-slug-collision-gate
- Done: Criado gate read-only para auditar diretórios Sprint 2 com slugs municipais ambíguos; padrão advisory, modo --strict bloqueante e integração advisory no pre-push.
- Output: tools/gates/check_sprint2_slug_collisions.py, tools/gates/test_check_sprint2_slug_collisions.py e tools/scripts/pre-push-gate.sh ainda pendentes de validação/commit nesta sessão.
- Validation: Pendente final: unittest, py_compile, diff --check e execução resumida no repo real.
- Blockers: Worktree contém muitos arquivos staged/dirty de dados/coleta/conteúdo de outro agente; Codex não deve unstage/reverter nem commitar esses arquivos.
- Next step: Claude pode continuar coleta/dados/servidor; evitar mexer em tools/gates/check_sprint2_slug_collisions.py até Codex validar e commitar. Se publicar dados, preferir chaves canônicas key_uf para municípios com key duplicada.
- Related paths: tools/gates/check_sprint2_slug_collisions.py, tools/gates/test_check_sprint2_slug_collisions.py, tools/scripts/pre-push-gate.sh, pipelines/sprint2_keys.py
