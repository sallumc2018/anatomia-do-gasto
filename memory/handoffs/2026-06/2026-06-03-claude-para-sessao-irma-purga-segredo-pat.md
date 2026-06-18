# Handoff — Purga de segredo (GitHub PAT) do histórico

**De:** Claude (Opus 4.8) — sessão de varredura/blindagem de segredos
**Para:** sessão irmã (Claude/Codex) que conduzirá a purga
**Data:** 2026-06-03
**Privacidade:** público-sanitizado — este arquivo NÃO contém o valor do token (já revogado).

---

## 1. O que aconteceu

Um **GitHub PAT real** foi colado inline (valor literal) no arquivo
`memory/handoffs/2026-06/2026-06-03-urgente-seguranca.md` (linha "Token atual:")
e commitado. O **GitHub Push Protection barrou** a tentativa de `git push origin main`.

- O token **já foi REVOGADO e rotacionado** pelo usuário; o JSON local foi atualizado.
- Mesmo revogado, o valor **precisa sair do histórico git** (higiene + desbloqueio do push).

## 2. Fato-chave que reduz o blast radius

**O segredo NUNCA foi para o `origin`.** As refs que o contêm não têm upstream:

| Commit (token) | Refs locais afetadas | Pushado? |
|---|---|---|
| `437484b` | `claude/tenacity-retry` (HEAD) + `main` (local) | ❌ não |
| `670bbf3` | `claude/governanca` | ❌ não |

`origin/main` está em `7e0c340` (limpo). **Branches INTACTAS (zero ação):**
`claude/paulinia`, `claude/infra-multi-municipio`, `claude/sorocaba-frontend`,
`codex/institutional-audit-data-catalog`.

→ Purga é **100% local**: sem force-push, sem colaborador externo, sem re-clone remoto.

## 3. O que JÁ está feito (não refazer)

- ✅ Valor do token **redatado na cópia viva** do handoff (working tree).
- ✅ Scanner de conteúdo criado: `tools/agents/check-secrets.py` (BLOCK/WARN/allowlist; `--staged`/`--all`/`--selftest`). Selftest 5/5, árvore limpa.
- ✅ Hook `.githooks/pre-commit` (core.hooksPath=.githooks já ativo) — bloqueia commit com segredo. Testado e2e via `GIT_INDEX_FILE` descartável.
- ✅ Área `secrets` no `tools/agents/validate-area.py` + plugada no gate `scope`.
- ✅ Registros: `P-2026-06-03-002` (monitoring) / `S-2026-06-03-002` / proveniência `PV-2026-06-03-005`.
- ✅ Varredura completa (árvore + histórico, todos os branches): **único segredo real** = este PAT. Demais hits = falso-positivo (literais do dicionário do detector de dados pessoais; URL pública anônima do TCE-SP Pentaho).

## 4. Ferramenta

`git filter-repo` **NÃO está instalado** e `pip install` está **vetado** (campanha do worm Mini Shai-Hulud). → Usar **`git filter-branch`** (nativo). Não instalar nada.

---

## 5. PROCEDIMENTO DE PURGA (executar com NENHUMA outra sessão escrevendo)

### Passo 0 — Pré-condições
- Confirmar que TODAS as outras sessões pararam de escrever.
- A árvore está suja com trabalho em voo (publicação SAAE + tooling de segurança). Esse trabalho **não está no histórico**; a reescrita reseta o working tree, então é preciso guardá-lo.

### Passo 1 — Guardar o trabalho em voo
```sh
cd /c/Omega/Profissional/Repositorios_Git_Projetos/anatomia-do-gasto
git stash push -u -m "pre-purga: SAAE em voo + tooling de seguranca"
git status --porcelain   # deve ficar VAZIO
```

### Passo 2 — Script de redação (casa por PADRÃO, nunca embute o token)
Criar `tools/scrub-token.sh` (fora do conteúdo que será reescrito):
```sh
#!/bin/sh
f="memory/handoffs/2026-06/2026-06-03-urgente-seguranca.md"
[ -f "$f" ] && sed -i 's#`ghp_[A-Za-z0-9]\{20,\}`#`ghp_***REVOGADO-E-PURGADO-DO-HISTORICO***`#g' "$f"
exit 0
```
```sh
export SCRUB="$PWD/tools/scrub-token.sh"
chmod +x tools/scrub-token.sh
```

### Passo 3 — Reescrever as 3 refs afetadas
```sh
git filter-branch --force --tree-filter 'sh "$SCRUB"' -- \
  claude/tenacity-retry claude/governanca main
```
> Windows: rodar em Git Bash (o `sed` do Git for Windows é GNU sed). É lento (checa cada commit) — normal.

### Passo 4 — Confirmar que o token sumiu da história
```sh
git log --all -G 'ghp_[A-Za-z0-9]{20,}' --oneline   # deve vir VAZIO
git grep -nI 'ghp_[A-Za-z0-9]\{20,\}' $(git rev-list --all) -- \
  memory/handoffs/2026-06/2026-06-03-urgente-seguranca.md 2>/dev/null | head  # vazio
```

### Passo 5 — Purgar backups, reflog e objetos soltos (sem isto o blob fica reachable)
```sh
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now
git log --all -S 'ghp_' --oneline | head   # confirmar vazio
```

### Passo 6 — Restaurar o trabalho em voo
```sh
git stash pop
# Esperado: aplica limpo (a reescrita só editou 1 linha do .md; SAAE mexe em outros arquivos).
# Se houver conflito no .md do handoff: manter a versão redatada.
```

### Passo 7 — Revalidar
```sh
python tools/agents/check-secrets.py --all
python tools/agents/validate-area.py --area secrets
python tools/agents/validate-area.py --area scope
```

### Passo 8 — Commitar tooling + (re)publicar SAAE
- Commitar o pacote de segurança: `check-secrets.py`, `.githooks/pre-commit`, `tools/scrub-token.sh`, `validate-area.py`, handoff redatado, entradas de memória. Prefixo `[Claude]`/`[Codex]` conforme autor.
- O pre-commit agora roda automático — se barrar, é sinal de outro segredo: investigar, não dar bypass.

### Passo 9 — Push (só com autorização do usuário)
- `git push origin main` deve passar agora (Push Protection não acha mais o segredo).

---

## 6. Retrabalho esperado pós-purga (resumo)

| Item | Custo |
|---|---|
| SHAs novos em ~9 commits (tenacity-retry/main) + 1 (governanca) | conteúdo idêntico, identidade git muda |
| **Re-sync de sessões/checkouts** baseados nos SHAs antigos | `git reset --hard <ref-rescrita>` — **custo dominante é coordenação** |
| Re-aplicar trabalho em voo | `stash pop` (limpo) |
| Purga de reflog/objetos | passos 5 |
| Remoto | **nenhum** (nada foi pushado) |
| Branches paulinia/infra/sorocaba-frontend/codex-* | **nenhum** (não contêm o token) |

## 7. Lições gravadas
- `.gitignore` protege ARQUIVOS, não CONTEÚDO inline → por isso o scanner de conteúdo no pre-commit.
- Nunca colar VALOR de segredo, nem em doc/handoff — referenciar por local. Para doc/teste legítimo: placeholder ou marcador `allowlist-secret` com justificativa.

---
*Origem: Claude (Opus 4.8). Proveniência PV-2026-06-03-005; P/S-2026-06-03-002.*
