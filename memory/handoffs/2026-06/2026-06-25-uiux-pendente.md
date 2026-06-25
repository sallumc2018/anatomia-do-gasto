# Handoff: UI/UX Pendente — branch worktree-uiux-anatomia

**Data:** 2026-06-25 · **Destino:** sessão dedicada UI/UX · **Autor:** Claude Code > claude-sonnet-4-6 > Medium

---

## Objetivo desta sessão

Revisar, testar e fazer merge do commit `cccb666 feat(ui): 5 melhorias UI/UX` para `origin/main`. O commit foi criado em 23/Jun/2026 num worktree isolado e **nunca chegou a produção**.

---

## Estado atual do repositório

- **Branch com o trabalho:** `worktree-uiux-anatomia` (local, `cccb666` no topo)
- **`origin/main` atual:** `39020fb` — Merge PR #12 (sem as melhorias UI/UX)
- **Worktree físico removido** (era 268MB em `.claude/worktrees/uiux-anatomia/`) — **mas a branch e o commit existem no git**
- **Verificar antes de começar:** `git log --oneline worktree-uiux-anatomia | head -3`

---

## Mudanças de paths importantes (reorganização 2026-06-23)

O GDrive foi reorganizado. Os pipelines locais já foram atualizados, mas qualquer script que você criar ou ajustar nesta sessão precisa usar os **novos paths**:

| Finalidade | Path ANTIGO (obsoleto) | Path NOVO (correto) |
|---|---|---|
| Raw staging | `gdrive:Omega-data/raw/` | `gdrive:02-Profissional/00-Omega/04_staging/anatomia-do-gasto/raw/` |
| Extracted staging | `gdrive:Omega-data/extracted/` | `gdrive:02-Profissional/00-Omega/04_staging/anatomia-do-gasto/extracted/` |
| Public (produção) | `gdrive:Omega-data/public/` | `gdrive:02-Profissional/00-Omega/05_bases-operacionais/anatomia-do-gasto-dados/public/` |

**`DIRECTORY_MAP.md`** na raiz do repo documenta esses paths com detalhes.

**`data/raw/` está vazio localmente** (deletado em 25/Jun/2026 após sync com GDrive). O próximo `coleta_noturna.sh` recria conforme necessário.

---

## O que está no commit `cccb666`

6 arquivos alterados, 608 inserções, 47 remoções:

### 1. `apps/web/app/comparativo/page.tsx` — NOVA PÁGINA `/comparativo`
Server Component que lê os CSVs SICONFI 2025 dos 3 municípios base (`sorocaba`, `paulinia`, `sao_paulo`) e exibe:
- Tabela comparativa com totais por função, % execução, per capita
- Gráfico de barras horizontal em CSS puro
- Sem dependências extras

**Atenção:** `next.config.ts` foi atualizado com `outputFileTracingIncludes` para `/comparativo` apontando para `data/public/sorocaba/executivo/saida/**/*` etc. — necessário para o build Vercel não exceder 250MB.

### 2. `apps/web/app/globals.css`
`.tile-link:hover` usa `var(--bg-raised)` em vez de `#2c2c2c` hardcoded. Correção pequena mas importante: sem isso, o hover quebrава nos temas claro e alto-contraste.

### 3. `apps/web/app/page.tsx` (home)
- Strip de stats abaixo do hero: "20 municípios · série desde 2015 · coleta diária · meta LATAM"
- Cards com acento colorido por cidade (teal para SP, azul para Sorocaba, etc.)
- Seção Sprint 1 com 17 municípios listados
- Tile "Comparativo" adicionado à seção "Explore o projeto"

### 4. `apps/web/components/layout/shell-header.tsx`
Menu "Mais" dividido em duas seções com cabeçalhos:
- **Município** (Sorocaba, Paulínia, São Paulo, São Bernardo, Campinas)
- **Geral** (API Pública, Atualizações, Glossário, Comparativo)

### 5. `apps/web/components/municipio/MunicipioHub.tsx`
- Estado **zero-data**: bloco explicativo + CTAs "Ver Atualizações" e "Receber notificações"
- Estado **parcial**: mostra contagem de áreas pendentes ("X de Y áreas disponíveis") e horário estimado da coleta
- Label "Em coleta" → "Aguardando coleta" (mais preciso)

---

## Como fazer o merge

```bash
# 1. Verificar que o commit existe
git log --oneline worktree-uiux-anatomia | head -3

# 2. Testar localmente primeiro
cd apps/web && npm run dev
# Verificar: / (home) | /comparativo | menu Mais | tema claro+escuro

# 3. Se ok, cherry-pick para main
git checkout main
git cherry-pick cccb666

# 4. Resolver gate de publicação se houver (improvável — são só arquivos web)
# 5. Push + deploy
git push origin main
npx vercel deploy --prod --yes
```

---

## Contexto adicional

- **10 PRs Dependabot abertos** no repo principal (bumps de Next, React, ESLint, actions) — podem ser avaliados nesta sessão ou separadamente.
- **`anatomia-do-gasto-old`** no GitHub: repo legado mantido ativo, 4 workflows desabilitados em 25/Jun/2026. "Dependabot Updates" e "Dependency Graph" ficaram ativos (built-ins, não desabilitáveis via CLI).
- **`local main` agora sincronizado** com `origin/main` — não há mais divergência.
- **`publish-coleta-20260625`** branch local ainda existe, pode ser deletada: `git branch -d publish-coleta-20260625`.

---

*Gerado por: Claude Code > claude-sonnet-4-6 > Medium · 2026-06-25*
