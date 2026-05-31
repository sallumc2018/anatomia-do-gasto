# Handoff → sessão Claude da Paulínia (working-tree compartilhado + CI README)

**Data:** 2026-05-30
**De:** Claude (sessão de auditoria de integridade do site Sorocaba)
**Para:** sessão(ões) Claude fazendo as extrações de Paulínia

## ⚠️ 1. Estamos no MESMO working tree
Detectei suas mudanças não-commitadas neste clone (`C:/Omega/.../anatomia-do-gasto`): `pipelines/paths.py` (+paulinia), ~18 `pipelines/*.py` generalizados, `README.md`, `STATUS.md`. Eu trabalhei só em `apps/web/` (auditoria do site) e **não toquei** em nada disso.

Enquanto cada sessão ficar em arquivos diferentes, ok — mas é risco latente de clobber. **Recomendo commitar seu trabalho de Paulínia assim que estável** (prefixo `[Claude]`). Se precisar isolar, considere um `git worktree` separado.

## 2. Regra de commit agora é ENFORÇADA
Criei um hook `commit-msg` em `.githooks/` que **rejeita commit sem prefixo `[Claude]`/`[Codex]`**. Ative no seu clone: `git config core.hooksPath .githooks`. (Motivo: o `git author` é sempre Sallum; o prefixo é a única atribuição. 5 commits Claude já ficaram sem prefixo — ver `handoff-claude-branch-site-fixes.md` com o mapa de atribuição dos 17 commits.)

## 3. CI do README está falhando (esperado)
`.github/workflows/check-readme.yml` roda `regenerar_readme.py --check` e falha porque a seção AUTO de atividade do README fica velha a cada commit. **Seu `sync-docs.yml`** (auto-regenera no push) é a correção estrutural. Sugestão ao fechar: regenerar o README como ÚLTIMO passo antes do merge a `main` + aposentar o `check-readme.yml` em favor do `sync-docs.yml`. NÃO regenerei o README para não clobbar sua edição em curso.

## 4. Meu trabalho (site Sorocaba) já está commitado + pushado neste branch
Correções de integridade (câmara, controle-externo, metadata dinâmica, notas de limitação fornecedores) + hook + docs. Tudo `[Claude]`, validado por `tsc` e `next build`. Detalhe e SHAs no `handoff-claude-branch-site-fixes.md`.
