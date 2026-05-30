# Handoff — correções [Claude] de integridade do site (para a sessão que monta o branch Claude)

**Data:** 2026-05-30
**De:** Claude (sessão de auditoria de integridade numérica do site)
**Para:** sessão Claude que está criando o branch `claude/*` + Codex (dono do branch atual)

## Contexto
Auditei o site inteiro (números vs fonte oficial). Veredito: todo número de destaque confere; deploy ao vivo da `/sorocaba/saude` confirmado correto. Apliquei correções pequenas e fiz commits `[Claude]` — mas eles foram parar no branch do Codex (`codex/institutional-audit-data-catalog`), porque o branch `claude/*` ainda não existia.

## ⚠️ AÇÃO NECESSÁRIA: consolidar commits [Claude] no branch Claude
Ao separar o trabalho Claude para o branch dedicado, **incluir estes commits** (todos em `codex/institutional-audit-data-catalog`, já pushados):

- `09689eb` — notas de limitação do crédito de fornecedores 2022-2023 em `/metodologia` (LIMITACOES) + `/sorocaba/fornecedores`. (meu, hoje)
- `8661004` — câmara: corpo dinâmico (hero/números-chave/custo derivam de `LOA_SERIE[0]`, alinha com a metadata) + controle-externo: paleta vermelho→âmbar. (meu, hoje)
- `f666615` — metadata dinâmico em câmara e executivo (`generateMetadata`) + editorial controle-externo + arredondamento câmara + fix alias `camara/page.tsx` (reexporta `generateMetadata`, senão build quebra).
- `1d75b5e` — `[Claude]` Théo: 4 rotas + camada de comunicação (outra sessão Claude; tocou os mesmos arquivos — cherry-pick precisa considerar).

Arquivos tocados: `apps/web/app/sorocaba/{camara-municipal,camara,controle-externo,executivo}/page.tsx`.
**Validação:** `tsc --noEmit` E `next build --webpack` passam (EXIT=0). câmara/controle-externo prerenderizam Static; Tailwind âmbar compila.

Obs: cherry-pick desses commits direto sobre `main` pode dar conflito (os 3 se interlaçam nos mesmos arquivos + `main` está 15 commits atrás). Mais seguro: levar o conjunto coerente.

## Deploy — SEGURADO (não fazer ainda)
Produção builda do `main` (ver [[reference_deploy_vercel]]); `main` está **15 commits atrás** do codex branch e **não tem** nenhum desses fixes. Deployar agora = inócuo (main velho) ou publicaria WIP do Codex. Aguardar a estratégia de branch + merge a `main`. Não urgente: a `/sorocaba/saude` (linkada nos posts já publicados) já está correta em produção.

## Pendência diagnosticada (NÃO bloqueia): fornecedores crédito 2022/2023
Coluna `credito` de `fornecedores_agregado_2022/2023` anômala (provável sub-captura na extração): crédito ≪ débito só em 2022/2023; demais anos crédito≈débito. (A "quebra de saldo corrente" NÃO é evidência confiável — 2021 deu 27% com crédito normal; usar só o desequilíbrio bruto.) **Invisível no site** (página usa só `debito`). JÁ documentado em /metodologia (LIMITACOES) + nota na /fornecedores. NÃO reparsear agora (PDF 1,4 GB, OOM). Corrigir só se o crédito for exibido. Fonte: `G:\Omega-data\raw\sorocaba\execucao\livros_contabeis\2022\`; extrator `pipelines/extrator_conta_corrente_fornecedor.py`.

## Não meu (deixar quieto na árvore de trabalho)
`.claude/settings.json` (M) e `.claude/claude-security-guidance.md`, `.claude/security-patterns.yaml`, `.github/workflows/sorocaba-pipeline.yml` (untracked) — não são desta auditoria.
