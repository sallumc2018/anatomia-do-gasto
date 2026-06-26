---
id: 2026-06-25-claude-ui-ux-canonicals-e-titulos-do-frontend
date: 2026-06-25
agent: Claude UI UX
status: active
visibility: public
---

# Handoff - Claude UI UX

- Scope: Canonicals e titulos do frontend
- Done: Codex criou um gate local que detecta paginas indexaveis sem canonical proprio ou noindex e confirmou quatro rotas afetadas.
- Output: Gate em tools/gates/check_canonical_routes.py e testes unitarios em tools/gates/test_check_canonical_routes.py.
- Validation: 2 testes unitarios, Ruff, py_compile e JSON valido; rotas encontradas: /fluxo, /fluxo-financeiro, /mapa-interativo e /sandbox.
- Blockers: O gate ainda nao deve entrar no CI enquanto as quatro rotas estiverem pendentes.
- Next step: Adicionar metadata por layout nas paginas client; decidir noindex para /sandbox; corrigir titulos de /atualizacoes que duplicam a marca; executar o gate e so entao integra-lo ao validate-area frontend.
- Related paths: docs/auditoria/auditoria-codigo-2026-06-25.md, tools/gates/check_canonical_routes.py, tools/gates/test_check_canonical_routes.py, apps/web/app
