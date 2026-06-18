# Handoff → próxima sessão (Sonnet OK)

**Data:** 2026-05-31
**De:** Claude (Opus), sessão de verificação pós-reorganização C:/G:
**Modelo recomendado:** Sonnet 4.6 (tarefas investigativas/mecânicas, sem necessidade de Opus)

---

## Contexto: o que já foi feito nesta sessão (NÃO refazer)

A reorganização do G: (feita pelo usuário + Gemini em 31/05) renomeou as pastas-raiz e quebrou referências. Já corrigido:

- **3 junctions repontadas** para os novos destinos:
  - `C:\Omega\Profissional\_Drive_Omega_Data` → `G:\Meu Drive\02-Profissional\03-Big-Data-Fiscal-Data`
  - `C:\Omega\Profissional\_Drive_Prof_Pesado` → `G:\Meu Drive\02-Profissional\01-ONG-Anatomia-do-Gasto`
  - `…\anatomia-do-gasto\data\extracted` → `…\03-Big-Data-Fiscal-Data\extracted`
- **`ANATOMIA_RAW_ROOT`** (User env) setado = `G:\Meu Drive\02-Profissional\03-Big-Data-Fiscal-Data\raw`
- **7 docs do repo** com path antigo `Omega-data` reescritos (CLAUDE.md, CLAUSULAS_PETRAS.md, AI_MASTER_PROMPT.md, docs/ambiente.md, docs/pipeline.md, docs/roadmap-sorocaba-100.md, docs/auditoria-cobertura-sorocaba.md). **NÃO commitado** — coordenar commit [Claude] com o Codex.
- **`C:\Omega\OMEGA.md`** é a fonte única de caminhos (seção 2.1). Docs legados `MAPA_OPERACIONAL_OMEGA.md` e `README_OMEGA_LOCAL.md` marcados com banner ⚠️ DESATUALIZADO.
- Memória atualizada: `project_storage_pipeline`, `reference_repo_canonical_path`, nova `reference_omega_path_map`.

**Padrão de nome canônico (G:\02-Profissional\):** kebab-case com hífen `NN-Nome-Do-Projeto` (sem ponto/underscore/espaço).

---

## Tarefas para esta sessão

### 1. Investigar os 4,6 GB do repo `anatomia-do-gasto` (PRIORIDADE)
O repo deveria ser leve (raw/extracted vivem no G: via junction), mas mede **4.600 MB** em C:. Descobrir onde está o peso:
- Suspeitos: `node_modules/`, `apps/web/.next/`, `.git/` inchado, ou o fallback local `data/raw` populado (violaria a regra "dados nunca em C:").
- Medir por subpasta (excluir junction `data/extracted`, que aponta pro G:).
- Se for `data/raw` local com dados pesados: mover para o acervo G: e confirmar que `.gitignore` cobre `data/raw` e `data/extracted`.
- Se for `node_modules`/`.next`: normal, deixar (mas reportar tamanho).
- **Regra de segurança:** NÃO rodar `npm install/update/audit` (worm npm ativo — ver memória `feedback_npm_security`). Só medir/mover, não reinstalar.

### 2. Portfólio → escopo AdG
Decisão do usuário: o `portfolio` agora deve ser **dentro do AdG e exclusivamente sobre o AdG**.
- Hoje vive em `C:\Omega\Profissional\Repositorios_Git_Projetos\portfolio` (0,1 MB, repo separado).
- Refocar o conteúdo para ser só sobre Anatomia do Gasto e integrá-lo ao escopo do AdG (confirmar com o usuário a forma exata: subpasta do repo AdG? página dentro do site? repo separado mas AdG-only?).

### 3. NÃO mexer: omega-workbench e omega-security-lab
Decisão do usuário: **não são deste projeto** — são ferramentas que ele está desenvolvendo para funcionar em **qualquer projeto**, principalmente no futuro **Projeto Omega**. Deixar onde estão; não dobrar dentro do AdG.

---

## Pendências herdadas (contexto, não urgente)
- Commit [Claude] dos 7 docs reescritos (coordenar com Codex).
- `tmp\` (257 MB) + `Sistema\Backups_Historico_e_Quarentena` (116 MB) são candidatos a arquivar no G: se precisar de espaço.
