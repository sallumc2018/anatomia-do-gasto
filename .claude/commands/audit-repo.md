---
description: Auditoria do repositório - varre 100% do GitHub, docs, segurança, dependências e qualidade do código
allowed-tools: Read, Glob, Grep, Bash
---

Você é o **Auditor de Repositório** do Anatomia do Gasto.
Pedido recebido: **$ARGUMENTS**

Contrato: siga `memory/agents/registry.csv`. Quando reduzir contexto, consulte `tools/memory/query-rag.py`; RAG não substitui leitura direta dos arquivos. Registre handoff reutilizável com `tools/memory/write-handoff.py` quando houver continuidade útil.

Modo: **varredura completa, sem ação**. Apenas relatar. Não commitar, não fazer push, não alterar nada.

Raiz do projeto: `~/Documents/anatomia-do-gasto`
GitHub: `github.com/sallumc2018/anatomia-do-gasto`

---

## 1. Estado do repositório git

```bash
git status -sb
git log --oneline -10
git branch -a
git remote -v
```

Verificar:
- Branch atual é `main`?
- Working tree limpo?
- Algum commit não pushado (`git log origin/main..HEAD`)?
- Branches mortas (diferentes de `main`)?

```bash
git log origin/main..HEAD --oneline
git branch -r | grep -v "main\|HEAD"
```

---

## 2. Segredos e dados sensíveis no histórico

```bash
# Verificar se o pre-commit hook de segredos está ativo
cat .husky/pre-commit 2>/dev/null || ls .git/hooks/pre-commit 2>/dev/null || echo "hook não encontrado"

# Verificar .gitignore cobre os caminhos críticos
grep -E "data/private|data/raw|\.env|lgpd_reservado|__pycache__|\.venv|node_modules" .gitignore | sort
```

Paths que DEVEM estar no `.gitignore`:
- `data/raw/`
- `data/private/`
- `data/extracted/`
- `data/validated/`
- `.env`
- `.env.local`
- `data/private/lgpd_reservado/`
- `.venv/`
- `node_modules/`

```bash
# Verificar que data/private não está no repo
git ls-files data/private/ 2>/dev/null | head -5
git ls-files data/raw/ 2>/dev/null | head -5
```

---

## 3. Gate anti-CPF no pre-commit

```bash
# Verificar que gate de CPF está registrado no pre-commit
cat .husky/pre-commit 2>/dev/null
# ou
ls -la tools/scripts/ 2>/dev/null
cat tools/scripts/pre-commit-gate.sh 2>/dev/null | head -20

# Testar gate manualmente
.venv/bin/python3 pipelines/sanear_cpf_publicos.py --gate 2>/dev/null
```

---

## 4. Supply chain npm — dependências

```bash
cd apps/web
# Verificar versões instaladas vs declaradas
cat package.json | python3 -c "
import json, sys
pkg = json.load(sys.stdin)
print('name:', pkg.get('name'))
print('Dependências:', len(pkg.get('dependencies', {})))
print('DevDependências:', len(pkg.get('devDependencies', {})))
for k, v in sorted(pkg.get('dependencies', {}).items()):
    print(f'  {k}: {v}')
"

# Verificar se há lock file atualizado
stat package-lock.json | grep Modify
```

Atenção: `npm install`, `npm update`, `npm audit fix` são proibidos sem autorização explícita (Mini Shai-Hulud ativa).

---

## 5. Qualidade do código Python

```bash
cd ~/Documents/anatomia-do-gasto

# Compilar todos os scripts Python (detecta erros de sintaxe)
find pipelines/ tools/ -name "*.py" | xargs .venv/bin/python3 -m py_compile 2>&1 | head -20

# Verificar imports não usados ou quebrados nos pipelines principais
for f in pipelines/paths.py pipelines/sanear_cpf_publicos.py pipelines/gerar_datasets_json.py pipelines/gerar_qa_manifest.py; do
  .venv/bin/python3 -m py_compile "$f" 2>&1 && echo "OK: $f" || echo "ERRO: $f"
done
```

---

## 6. Documentação — CLAUDE.md, README, docs/

```bash
# CLAUDE.md existe e menciona os municípios atuais?
grep -c "sao_paulo\|sao_bernardo\|paulinia\|sorocaba" CLAUDE.md

# Verificar se docs/ está atualizado
ls -la docs/
stat docs/auditoria-seguranca-2026-06-16.md

# Verificar links de docs no CLAUDE.md
grep -o "docs/[a-z.-]*" CLAUDE.md | sort -u
# Para cada link, verificar se o arquivo existe
```

---

## 7. Configuração Vercel

```bash
# Verificar .vercel/project.json
cat .vercel/project.json 2>/dev/null

# Verificar vercel.json ou next.config.ts para configurações críticas
grep -n "outputFileTracingIncludes\|turbopackIgnore\|rootDirectory" apps/web/next.config.ts

# Verificar se rootDirectory está configurado (ausência quebra GitHub integration)
cat .vercel/project.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('rootDirectory:', d.get('settings', {}).get('rootDirectory', 'NÃO DEFINIDO'))" 2>/dev/null
```

---

## 8. Hooks e automações

```bash
# Verificar hooks ativos
ls -la .husky/ 2>/dev/null || echo "Husky não encontrado"
cat .claude/settings.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
hooks = d.get('hooks', {})
for event, hlist in hooks.items():
    for h in hlist:
        for hook in h.get('hooks', []):
            print(f'{event}: {hook[\"command\"][:80]}')
"
```

---

## 9. Issues e estado do GitHub

```bash
# Listar issues abertas
gh issue list --repo sallumc2018/anatomia-do-gasto --state open 2>/dev/null | head -10

# Verificar último deploy bem-sucedido
gh run list --repo sallumc2018/anatomia-do-gasto --limit 5 2>/dev/null
```

---

## 10. Conformidade com regras do CLAUDE.md

Verificar as regras críticas declaradas em `CLAUDE.md`:

```bash
# 1. turbopackIgnore em pages com process.cwd()
echo "=== turbopackIgnore ==="
pages_cwd=$(grep -rl "process.cwd()" apps/web/app/ 2>/dev/null)
for p in $pages_cwd; do
  if grep -q "turbopackIgnore" "$p"; then
    echo "OK: $p"
  else
    echo "FALTANDO: $p"
  fi
done

# 2. outputFileTracingIncludes para cada rota com process.cwd()
echo "=== outputFileTracingIncludes ==="
grep -A1 "outputFileTracingIncludes" apps/web/next.config.ts | grep -v "^--$" | head -30

# 3. Assinatura de commit
echo "=== Assinatura nos últimos commits ==="
git log --format="%s%n%b" -5 | grep -c "Claude Code" || echo "0 commits com assinatura nos últimos 5"
```

---

## Saída esperada

```text
## Audit Repo — [data]

### Git
- Branch: main ✓/✗
- Working tree: limpo/N mudanças pendentes
- Commits não pushados: N
- Branches extras: [lista ou "nenhuma"]

### Segredos e .gitignore
- data/private/ gitignored: ✓/✗
- data/raw/ gitignored: ✓/✗
- .env gitignored: ✓/✗
- data/private no repo: [não/SIM ← CRÍTICO]

### Gate CPF
- pre-commit ativo: ✓/✗
- Gate manual: 0 CPFs / N CPFs detectados

### NPM
- Dependências: N deps, N devDeps
- lock file: atualizado em [data]

### Python
- Scripts com erro de sintaxe: N [lista ou "nenhum"]

### Documentação
- CLAUDE.md menciona todos os municípios: ✓/✗
- Docs existentes: [lista]

### Vercel
- rootDirectory: [valor ou "NÃO DEFINIDO"]
- outputFileTracingIncludes: N entradas

### Hooks
- [evento]: [comando]

### turbopackIgnore
- OK: [lista]
- FALTANDO: [lista ← risco deploy]

### GitHub Issues abertas: N

### Itens críticos: N
### Itens recomendados: N
### Próximo passo: [ação específica ou "nenhuma"]
```
