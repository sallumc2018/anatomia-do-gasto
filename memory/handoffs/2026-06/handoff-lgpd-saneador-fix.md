# Handoff: Fix pós-reescrita de histórico LGPD

**Data:** 2026-06-18  
**Para:** Codex  
**De:** Claude Code (claude-opus-4-8 → claude-sonnet-4-6)  
**Repo:** `~/Documentos/Projects/anatomia-do-gasto`
**Prioridade:** Alta — segurança LGPD

---

## Contexto

Varredura de segurança (SEC-1) identificou CPFs de PF em CSVs públicos. Em 2026-06-16
foram mascarados 5.719 CPFs em `data/public/*.csv` pelo `pipelines/sanear_cpf_publicos.py`.
Em 2026-06-18, ao fazer a reescrita completa do histórico git via `git-filter-repo`,
o callback revelou **3 arquivos adicionais com CPF real** que o saneador deixou passar
(ele só varreia `*.csv`). Esses 3 arquivos ainda estão no HEAD em produção.

---

## O que falta implementar

### 1. Corrigir `pipelines/sanear_cpf_publicos.py`

**Problema:** o saneador usa `rglob("*.csv")` — ignora `.json` e outros formatos
em `data/public/`, e não varre `pipelines/`, `docs/` ou outros caminhos.

**Três arquivos com CPF real no HEAD atual:**

| Arquivo | CPF encontrado | Contexto |
|---------|---------------|---------|
| `data/public/.schemas/paulinia/camara/saida/camara_empenhos_paulinia_2024.json` | `***.532.498-**` | campo `"cnpj"` com CPF de PF |
| `docs/auditoria-seguranca-2026-06-16.md` | `***.072.078-**` | foi usado como CPF-exemplo no texto |
| `pipelines/sanear_cpf_publicos.py` | mesmo CPF em bare | aparecia num comentário de exemplo |

**Solução desejada:** o saneador deve aceitar extensões configuráveis. Para `data/public/`,
varrer `**/*.csv` e `**/*.json`. Para `docs/` e `pipelines/`, varrer apenas em `--extra`
ou um mode `--all` que cubra todo o repo. O `--gate` do pre-commit deve cobrir **ao menos**
`data/public/**/*.csv` e `data/public/**/*.json`.

Também mascarar os 3 arquivos acima no working tree e commitar junto.

### 2. Atualizar `.husky/pre-commit` (Layer 3.5: CPF scan)

O gate atual verifica apenas staged `data/public/**/*.csv`. Estender para:
```bash
# data/public: CSV e JSON
git diff --cached --name-only | grep -E '^data/public/.*\.(csv|json)$' | ...
```

### 3. Atualizar `docs/auditoria-seguranca-2026-06-16.md`

- SEC-1 camada B (reescrita de histórico): marcar como **CONCLUÍDA**
- Adicionar nota sobre os 3 arquivos adicionais encontrados durante a reescrita
- Registrar data de conclusão da varredura completa

### 4. Commit e push

Assinatura obrigatória no corpo (não no subject):

```
[Claude Code > claude-sonnet-4-6 > Medium]
```

Push por Antigravity (não commitar → push direto do Codex sem autorização explícita).

---

## Estado atual do repo

- HEAD: `2d9ead8` (branch `main`)
- `data/public/*.csv`: 0 CPF ✅
- `data/public/.schemas/**/*.json`: 1 CPF ❌ (aguarda este fix)
- `docs/auditoria-seguranca-2026-06-16.md`: 1 CPF ❌ (aguarda este fix)
- `pipelines/sanear_cpf_publicos.py`: 1 CPF em comentário ❌ (aguarda este fix)
- `data/private/lgpd_reservado/inventario_cpf.csv`: 289 CPFs distintos preservados ✅ (gitignored)
- Pre-commit gate Layer 3.5: funcional para CSV, precisa de JSON ❌

---

## Notas

- `data/private/` está gitignored — não commitar.
- Deploy é sempre via `npx vercel deploy --prod --yes` (Antigravity); Codex não dá push.
- Regex correta de mascaramento (padrão CGU):
  - CPF formatado: `\b(\d{3})\.(\d{3})\.(\d{3})-(\d{2})\b` → `***.\2.\3-**`
  - CPF puro colado a nome: `(?<=[A-Za-zÀ-ÿ] )(\d{3})(\d{3})(\d{3})(\d{2})\b` → `***.\2.\3-**`
- CNPJ tem `/` no formato (NN.NNN.NNN/NNNN-NN) — as regex acima NÃO casam CNPJ.
