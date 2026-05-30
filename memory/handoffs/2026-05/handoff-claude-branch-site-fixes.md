# Handoff — correções [Claude] de integridade do site (para a sessão que monta o branch Claude)

**Data:** 2026-05-30
**De:** Claude (sessão de auditoria de integridade numérica do site)
**Para:** sessão Claude que está criando o branch `claude/*` + Codex (dono do branch atual)

## Contexto
Auditei o site inteiro (números vs fonte oficial). Veredito: todo número de destaque confere; deploy ao vivo da `/sorocaba/saude` confirmado correto. Apliquei correções pequenas e fiz commits `[Claude]` — mas eles foram parar no branch do Codex (`codex/institutional-audit-data-catalog`), porque o branch `claude/*` ainda não existia.

## ⚠️ MAPA DEFINITIVO DE ATRIBUIÇÃO — 17 commits à frente do `main` (30/mai)
> **TODOS têm `git author = Sallum`** (identidade git = usuário). O agente está SÓ no prefixo da mensagem — e a convenção VAZOU: vários commits Claude ficaram sem `[Claude]`. Atribuição abaixo confirmada pelo usuário/conteúdo. **NÃO reescrever histórico** (branch compartilhado e pushado) — usar este mapa para cherry-pick/consolidação.

### CLAUDE (13) → consolidar no branch `claude/*`
| SHA | prefixo | descrição |
|---|---|---|
| `3a654d6` | [Claude] | handoff (esta sessão de auditoria) |
| `09689eb` | [Claude] | notas de limitação crédito fornecedores 22/23 (/metodologia + /fornecedores) |
| `8661004` | [Claude] | câmara: corpo dinâmico (`LOA_SERIE[0]`) + controle-externo: paleta âmbar |
| `f666615` | — (sem prefixo!) | metadata dinâmica câmara/executivo + editorial controle-externo + arredondamento + fix alias `camara/page.tsx` |
| `7d64a4f` | — | página `/fluxo-financeiro` (Sankey) — confirmado Claude |
| `baf1c4f` | — | `/fluxo-financeiro` no header + sitemap — confirmado Claude |
| `e907512` | — | seções AUTO dos READMEs — confirmado Claude |
| `5ae3878` | — | `STATUS.md` + `DECISIONS.md` — confirmado Claude |
| `29393df` | — | `/sorocaba/transferencias` no header — **inferido Claude (confirmar)** |
| `25381cc` | [Claude] | sandbox: perguntas rápidas + cores dos cards (outra sessão) |
| `2502af4` | [Claude] | governança: hooks de segurança + Théo training (outra sessão) |
| `91c41d7` | [Claude] | dados Sorocaba: SICONFI fiscal + SAAE (outra sessão) |
| `1d75b5e` | [Claude] | Théo: 4 rotas + camada de comunicação (outra sessão) |

### CODEX (4) → permanecem no fluxo do Codex / main
| SHA | prefixo | descrição |
|---|---|---|
| `fa98b7e` | — | pncp: formato Playwright no consolidador — confirmado Codex |
| `8e1b300` | [Codex] | publish SAAE and Camara QA data |
| `2b5f111` | [Codex] | governance triage readiness |
| `93ab00d` | — | institutional audit + data catalog pages (base do branch) — **inferido Codex (confirmar)** |

**A confirmar com o usuário:** `29393df` (transferencias→header, inferido Claude pelo padrão dos outros header-adds) e `93ab00d` (institutional audit, inferido Codex pelo nome do branch).

**Validação do trabalho de site (Claude):** `tsc --noEmit` E `next build --webpack` passam (EXIT=0). Arquivos: `apps/web/app/{metodologia,sorocaba/camara-municipal,sorocaba/camara,sorocaba/controle-externo,sorocaba/executivo,sorocaba/fornecedores}/page.tsx`.

**Cuidado na consolidação:** Claude e Codex se **interlaçam cronologicamente** (não são blocos contíguos) e `main` está 15 commits atrás. Cherry-pick seletivo sobre branch novo a partir do `main` pode conflitar. `git log --grep="\[Claude\]"` NÃO basta (perde os 5 sem prefixo: f666615, 7d64a4f, baf1c4f, e907512, 5ae3878) — usar este mapa.

## Deploy — SEGURADO (não fazer ainda)
Produção builda do `main` (ver [[reference_deploy_vercel]]); `main` está **15 commits atrás** do codex branch e **não tem** nenhum desses fixes. Deployar agora = inócuo (main velho) ou publicaria WIP do Codex. Aguardar a estratégia de branch + merge a `main`. Não urgente: a `/sorocaba/saude` (linkada nos posts já publicados) já está correta em produção.

## Pendência diagnosticada (NÃO bloqueia): fornecedores crédito 2022/2023
Coluna `credito` de `fornecedores_agregado_2022/2023` anômala (provável sub-captura na extração): crédito ≪ débito só em 2022/2023; demais anos crédito≈débito. (A "quebra de saldo corrente" NÃO é evidência confiável — 2021 deu 27% com crédito normal; usar só o desequilíbrio bruto.) **Invisível no site** (página usa só `debito`). JÁ documentado em /metodologia (LIMITACOES) + nota na /fornecedores. NÃO reparsear agora (PDF 1,4 GB, OOM). Corrigir só se o crédito for exibido. Fonte: `G:\Omega-data\raw\sorocaba\execucao\livros_contabeis\2022\`; extrator `pipelines/extrator_conta_corrente_fornecedor.py`.

## Não meu (deixar quieto na árvore de trabalho)
`.claude/settings.json` (M) e `.claude/claude-security-guidance.md`, `.claude/security-patterns.yaml`, `.github/workflows/sorocaba-pipeline.yml` (untracked) — não são desta auditoria.
