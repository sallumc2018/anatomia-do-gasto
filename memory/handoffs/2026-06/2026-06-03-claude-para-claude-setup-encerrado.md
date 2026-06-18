# Handoff: Setup Claude Code — encerrado
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Claude Opus (próxima sessão — Sorocaba 100%)
**Data:** 2026-06-03 11:43
**Branch ativo ao encerrar:** `codex/institutional-audit-data-catalog`

---

## O que foi feito nesta sessão

### MCPs configurados (todos funcionando)
- **filesystem** — binário global `C:\Users\user\AppData\Roaming\npm\mcp-server-filesystem.cmd`; vault: `G:\Meu Drive\00-Omega\Sallum_Omega_Vault\` ✅
- **GitHub MCP** — binário `C:\Omega\tools\github-mcp-server.exe`; token em `claude_desktop_config.json` ✅
- **Windows-MCP** — extensão `ant.dir.cursortouch`; uv instalado via winget; `C:\Users\user\AppData\Local\Microsoft\WinGet\Links` adicionado à machine-level PATH ✅

### Memória privada criada (`~/.claude/projects/C--Omega/memory/`)
- `user_profile.md` — identidade, cognição, projetos, hardware
- `user_writing_style.md` — padrão de escrita e regras de resposta
- `decisions_privado.md` — regras de colaboração, projetos exclusivos, MCPs ativos
- `project_branch_strategy.md` — separação claude/* vs codex/*
- `project_symbiosis_files.md` — protocolo dos 4 arquivos de simbiose
- `MEMORY.md` — índice atualizado com todas as entradas acima

### Branches criados (locais, não pushados)
```
claude/governanca           — DECISIONS.md, STATUS.md, handoffs, KPIs
claude/infra-multi-municipio — pipelines parametrizados, hooks, segurança
claude/sorocaba-frontend    — câmara, controle-externo, fluxo-financeiro
claude/paulinia             — dados + páginas Paulínia
```
Todos criados via cherry-pick a partir de `main`. **Nenhum foi pushado para o GitHub ainda.**

### Arquivos de simbiose no repo
- `IDEAS.md` — criado e commitado ✅
- `TASKS.md` — criado, **não commitado** (untracked no branch codex)
- `DECISIONS.md` — atualizado com protocolo cross-tool, branches, mcps, **não commitado**

### Omega meta-repo
- `git init C:\Omega` — feito ✅
- 4 submodules registrados: `anatomia-do-gasto`, `omega-security-lab`, `omega-workbench`, `portfolio` ✅
- Repo privado no GitHub: `https://github.com/sallumc2018/omega-ecossistema` ✅
- Branch: `master`, 1 commit inicial ✅

### trusted folders
```json
"localAgentModeTrustedFolders": [
  "C:\\Omega",
  "C:\\Omega\\Profissional\\Repositorios_Git_Projetos\\anatomia-do-gasto"
]
```

---

## O que fazer na próxima sessão

### Prioridade 1 — Commits pendentes

```bash
cd C:/Omega/Profissional/Repositorios_Git_Projetos/anatomia-do-gasto

# 1. Commit no branch claude/governanca
git checkout claude/governanca
git add DECISIONS.md TASKS.md
git commit -m "[Claude] chore: symbiosis files — DECISIONS atualizado + TASKS criado (2026-06-03)"

# 2. Push todos os branches claude/*
git push origin claude/governanca
git push origin claude/infra-multi-municipio
git push origin claude/sorocaba-frontend
git push origin claude/paulinia
```

### Prioridade 2 — Sorocaba 100%

Verificar STATUS.md e TASKS.md para o estado exato. Itens conhecidos pendentes:
- Câmara: realizado 2020-2021 (LAI pendente)
- PNCP: workaround Playwright (API bloqueada)
- Reconciliação de manifestos: score 80% conservador, aguarda revisão

### Referências rápidas
- Repo: `C:\Omega\Profissional\Repositorios_Git_Projetos\anatomia-do-gasto\`
- Config MCP: `C:\Users\user\AppData\Roaming\Claude\claude_desktop_config.json`
- Memória privada: `C:\Users\user\.claude\projects\C--Omega\memory\`
- Deploy: `vercel deploy --prod --yes` (integração GitHub desativada)
- Token GitHub no config: válido, escopo repo+org+user

---

## Estado dos MCPs ao encerrar
| MCP | Status |
|---|---|
| filesystem (Obsidian) | ✅ connected |
| GitHub | ✅ connected |
| Windows-MCP | ✅ connected (confirmado após machine PATH fix) |
