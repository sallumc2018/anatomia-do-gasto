# Handoff URGENTE: Segurança — o que falta agora
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Catão (/catao) supervisionado por Claude Opus — branch `claude/seguranca-gaps`
**Prioridade:** Alta — token em plain text + sem scanner de secrets + LGPD sem automação

---

## Estado atual (auditado em 2026-06-03)

**Temos (funcionando):**
- Hooks de segurança: PreToolUse, PostToolUse, Stop (sg-runner.ps1)
- `check_pip_install.ps1` e `check_winget_install.ps1` — bloqueia installs não auditados
- `tools/security/` — 15 scripts: check-data-integrity, security-watch, supply chain
- `docs/seguranca-dependencias-npm.md` — protocolo npm worm documentado
- `.githooks/commit-msg` — exige prefixo [Claude]/[Codex]
- `.gitignore` — protege `.claude/projects/`, `.env`, credenciais

**Gaps confirmados:**
1. **Token GitHub em plain text** — `claude_desktop_config.json` tem token sem proteção
2. **Sem scanner de secrets no pre-commit** — commit-msg verifica prefixo, não conteúdo
3. **LGPD sem automação** — verificação de CPF/dados pessoais antes de publicar é manual
4. **Sem pre-commit hook de conteúdo** — nada impede `git add arquivo_com_senha.env`

---

## O que fazer (em ordem de risco)

### GAP 1 — Scanner de secrets no pre-commit (CRÍTICO)
Adicionar hook em `.githooks/pre-commit`:
```bash
#!/bin/sh
# Bloqueia commit se encontrar padrões de secrets
patterns=(
  "ghp_[A-Za-z0-9]{36}"          # GitHub PAT
  "password\s*=\s*['\"][^'\"]+['\"]"  # password = "..."
  "PRIVATE KEY"                    # chave privada
  "aws_secret_access_key"          # AWS
)
for pattern in "${patterns[@]}"; do
  if git diff --cached | grep -qiE "$pattern"; then
    echo "ERRO: possível secret detectado no diff. Verifique antes de commitar."
    echo "Padrão: $pattern"
    exit 1
  fi
done
```
Instalar: o arquivo já existe em `.githooks/` — adicionar `pre-commit`.
Ativar: `git config core.hooksPath .githooks` (já deveria estar ativo).

### GAP 2 — Token GitHub fora do plain text
Opção A (simples): variável de ambiente em `.env.local` (não commitado):
```bash
# .env.local (no .gitignore)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
```
Atualizar `claude_desktop_config.json`:
```json
"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
```
Verificar se Claude Desktop suporta expansão de variável de ambiente no config.
Se não suportar: manter no config mas garantir que o arquivo não é commitado
(já está fora do repo, em AppData — risco é de processo local lendo o arquivo).

Opção B (mais seguro): Windows Credential Manager via PowerShell:
```powershell
cmdkey /generic:github-pat /user:sallumc2018 /pass:ghp_...
# Recuperar: (Get-StoredCredential -Target "github-pat").Password
```

### GAP 3 — Verificação LGPD antes de publicar
Adicionar a `tools/qa/duckdb_checks.py`:
```python
import re

PADROES_PESSOAIS = {
    "cpf": r"\d{3}\.?\d{3}\.?\d{3}-?\d{2}",
    "rg": r"\d{1,2}\.?\d{3}\.?\d{3}-?\d{1}",
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "telefone": r"\(?\d{2}\)?\s?\d{4,5}-?\d{4}",
}

def check_dados_pessoais(arquivo_csv):
    """Detecta padrões de dados pessoais antes de publicar."""
    conteudo = open(arquivo_csv, encoding='utf-8', errors='ignore').read()
    encontrados = {}
    for nome, padrao in PADROES_PESSOAIS.items():
        matches = re.findall(padrao, conteudo)
        if matches:
            encontrados[nome] = len(matches)
    return encontrados  # vazio = ok para publicar
```
Integrar ao portão de publicação — bloqueia se encontrar.

### GAP 4 — Auditar permissões do token GitHub
Token atual: `ghp_REVOGADO-E-PURGADO-DO-HISTORICO`
Permissões atuais: repo completo + org read + user read
Ação: rever se `org read` é necessário para as operações atuais.
Se não for: revogar e recriar com escopo mínimo (repo + read:user apenas).
**NÃO fazer isso agora** — confirmar com Alexandre primeiro.

---

## Protocolo de supervisão do Catão

Catão pode executar os GAPs 1 e 3 autonomamente (são adições, não remoções).
GAP 2 (token) e GAP 4 (revogar permissões) exigem aprovação explícita do usuário antes.

Catão deve:
1. Implementar o pre-commit hook
2. Implementar `check_dados_pessoais()`
3. Gerar relatório de auditoria em `tools/security/audit-2026-06.md`
4. NÃO mexer no token sem aprovação

## Restrições
- Token: não commitar em nenhuma circunstância
- Pre-commit hook: testar com `git commit --dry-run` antes de ativar
- `check_dados_pessoais()`: falso positivo é melhor que falso negativo — manter conservador
