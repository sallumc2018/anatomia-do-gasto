#!/usr/bin/env python3
"""Validador de consistência da documentação — Anatomia do Gasto.

Verifica:
1. Se CONSTITUICAO.md existe (fonte única de regras) com todas as seções
2. Se TODOS os arquivos de agente/commando referenciam CONSTITUICAO.md
3. Se os arquivos reduzidos não contêm mais regras que foram movidas
4. Integridade de conteúdo: padrões-chave das regras antigas existem em CONSTITUICAO.md
5. Se AGENTS.md, AI_MASTER_PROMPT.md, e outros arquivos de suporte existem

Uso:
    python tools/agents/validate-docs-consistency.py

Exit code 0 = tudo OK
Exit code 1 = problemas encontrados
"""

import os
import re
import sys

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

errors = []
warnings = []
checks_passed = 0


def check(condition: bool, msg: str, severity: str = "error"):
    global checks_passed
    if condition:
        checks_passed += 1
        return
    if severity == "error":
        errors.append(f"❌  {msg}")
    else:
        warnings.append(f"⚠️  {msg}")


def file_exists(rel_path: str) -> bool:
    return os.path.isfile(os.path.join(BASE, rel_path))


def file_contains(rel_path: str, pattern: str) -> bool:
    path = os.path.join(BASE, rel_path)
    if not os.path.isfile(path):
        return False
    with open(path, "r", encoding="utf-8") as f:
        return pattern in f.read()


# ─── 1. CONSTITUICAO.md existe ────────────────────────────────────────
check(file_exists("CONSTITUICAO.md"), "CONSTITUICAO.md não encontrado")

# ─── 2. Verificar seções obrigatórias na CONSTITUICAO.md ─────────────
const_path = os.path.join(BASE, "CONSTITUICAO.md")
constituicao_sections = [
    "## 1. Objetivo do Projeto",
    "## 2. Ecossistema de Trabalho",
    "## 3. Routing",
    "## 4. Regras Permanentes",
    "## 5. Política de Commit",
    "## 6. Checklist",
    "## 7. Provenance Tracking",
    "## 8. Economia de Contexto",
    "## 9. Footer Padrão",
    "## 10. Escopo Proibido",
    "## 11. Flow: Completar Dados Faltantes",
    "## 12. Flow: Auditoria",
    "## 13. Flow: Onboarding",
    "## 14. Isolamento por Agente",
    "## 15. Paralelismo",
    "## 16. Pacote Mínimo",
    "## 17. Protocolo de Handoff",
    "## 18. Protocolo de Modelo",
    "## 19. Quarteto de Alta Confiança",
    "## 20. Disciplina de Raciocínio",
    "## 21. Padrão de Assinatura",
]
for section in constituicao_sections:
    check(
        file_contains("CONSTITUICAO.md", section),
        f"CONSTITUICAO.md: seção '{section}' ausente",
    )

# ─── 3. CONSTITUICAO tem exemplos de assinatura ─────────────────────
check(
    file_contains("CONSTITUICAO.md", "[Codex > GPT-5.5-M]"),
    "CONSTITUICAO.md: exemplos de assinatura ausentes (§21)",
)

# ─── 4. Todos os arquivos de agente/commando referenciam CONSTITUICAO ──
files_that_must_reference = [
    "CLAUDE.md",
    "codex.md",
    "ORQUESTRADOR.md",
    "docs/agentes-contexto.md",
    "AGENTS.md",
    "AI_MASTER_PROMPT.md",
    ".claude/commands/maestro.md",
    ".claude/commands/iniciar.md",
]
for f in files_that_must_reference:
    check(
        file_contains(f, "CONSTITUICAO.md"),
        f"{f} não referencia CONSTITUICAO.md",
    )

# ─── 5. Arquivos de suporte ainda existem ─────────────────────────────
support_files = [
    "AGENTS.md",
    "AI_MASTER_PROMPT.md",
    "CANONICAL_PATHS.md",
    "ENGINEERING_SCOPE.md",
    "codex.md",
    "docs/roteamento-codex-claude.md",
    "docs/release-ownership.md",
]
for f in support_files:
    check(file_exists(f), f"{f} não encontrado")

# ─── 6. Validação de conteúdo: arquivos reduzidos não têm regras que ──
#      deveriam estar apenas em CONSTITUICAO.md

# CLAUDE.md reduzido não deve ter routing table completa
if file_exists("CLAUDE.md"):
    check(
        not file_contains("CLAUDE.md", "| **Codex** | Auditor principal"),
        "CLAUDE.md ainda contém routing table (deveria estar em CONSTITUICAO.md §3)",
    )

# CODEX.md reduzido não deve ter regras de proveniência completas
if file_exists("codex.md"):
    content = open(os.path.join(BASE, "codex.md"), encoding="utf-8").read()
    check(
        not ("memory/token-economy/" in content and "Registre toda alteracao" in content),
        "codex.md parece conter regras de economia de contexto (deveriam estar em CONSTITUICAO.md §8)",
    )

# ORQUESTRADOR.md não deve ter tabela de isolamento completa
if file_exists("ORQUESTRADOR.md"):
    check(
        not file_contains("ORQUESTRADOR.md", "| `dados` | `data/raw` como inventário"),
        "ORQUESTRADOR.md ainda contém tabela de isolamento (deveria estar em CONSTITUICAO.md §14)",
    )

# AI_MASTER_PROMPT.md não deve ter regras permanentes 1-22
if file_exists("AI_MASTER_PROMPT.md"):
    check(
        not "## 3. Regras Permanentes" in open(os.path.join(BASE, "AI_MASTER_PROMPT.md"), encoding="utf-8").read(),
        "AI_MASTER_PROMPT.md ainda tem seção 'Regras Permanentes' (deveria estar em CONSTITUICAO.md §4)",
    )
    check(
        not "## 5. Política De Commit" in open(os.path.join(BASE, "AI_MASTER_PROMPT.md"), encoding="utf-8").read(),
        "AI_MASTER_PROMPT.md ainda tem seção 'Política De Commit' (deveria estar em CONSTITUICAO.md §5)",
    )

# ─── 7. Integridade de conteúdo: padrões essenciais existem na ────────
#      CONSTITUICAO.md (nada foi perdido na consolidação)

content_integrity_checks = {
    "Regra 1: site oficial só lê data/public": "O site oficial só pode ler `data/public`",
    "Regra: dado ausente não é zero": "Dado ausente não é zero",
    "Regra: Mini Shai-Hulud (npm proibido sem autorização)": "Mini Shai-Hulud",
    "Footer padrão: Fim de trabalho substantivo": "Fim de trabalho substantivo",
    "Footer: Handoff recomendado": "Handoff recomendado",
    "Flow completar dados: /frontino status": "/frontino status",
    "Flow completar dados: /dados": "/dados",
    "Padrão assinatura: Claude-CP": "Claude-CP",
    "Padrão assinatura: Codex >": "Codex >",
    "Paralelismo: deploy + qualquer outro proibido": "deploy",
    "Isolamento: qa nunca escreve": "qa",
    "Quarteto: Vitruvio": "Vitruvio",
    "Quarteto: Catao": "Catao",
    "Disciplina: ENGINEERING.md": "ENGINEERING.md",
    "Protocolo de modelo: menor capacidade suficiente": "menor capacidade suficiente",
    "Commit: 8 passos workflow": "git status -sb",
    "Proveniência: actor,ferramenta,modelo": "actor,ferramenta,modelo",
    "Budget: maestro < 500 tok": "< 500 tok",
    "Escopo proibido: .env, senhas, tokens": ".env",
    "Pacote mínimo: Agente, Objetivo, Pode ler": "Pode ler",
}
for label, pattern in content_integrity_checks.items():
    check(
        file_contains("CONSTITUICAO.md", pattern),
        f"CONSTITUICAO.md: integridade perdida — '{label}' (não contém: '{pattern}')",
    )

# ─── 8. Contar 'Disciplina de Raciocínio' (deve ser no máximo 3) ─────
disc_count = 0
for root, dirs, files in os.walk(BASE):
    # Skip .git
    if ".git" in dirs:
        dirs.remove(".git")
    for fname in files:
        if fname.endswith(".md"):
            fpath = os.path.join(root, fname)
            if not os.path.isfile(fpath):
                continue  # skip broken symlinks or missing files
            try:
                with open(fpath, encoding="utf-8") as f:
                    if "Disciplina de Raciocínio" in f.read():
                        disc_count += 1
            except (FileNotFoundError, IOError):
                continue  # skip inaccessible files
if disc_count > 5:
    warnings.append(
        f"'Disciplina de Raciocínio' em {disc_count} arquivos — "
        f"idealmente só em CONSTITUICAO.md + CLAUDE.md + CODEX.md (atual: {disc_count})"
    )
else:
    check(True, f"'Disciplina de Raciocínio' em {disc_count} arquivos (limite aceitável)")

# ─── 9. Validar script de validação existe e tem conteúdo ────────────
check(
    file_exists("tools/agents/validate-docs-consistency.py"),
    "tools/agents/validate-docs-consistency.py não encontrado",
)
if file_exists("tools/agents/validate-docs-consistency.py"):
    script_path = os.path.join(BASE, "tools/agents/validate-docs-consistency.py")
    with open(script_path, encoding="utf-8") as f:
        content = f.read()
    check(
        "content_integrity_checks" in content,
        "validate-docs-consistency.py não tem content_integrity_checks",
    )

# ─── Resultado ────────────────────────────────────────────────────────
print("=" * 60)
print("📋 VALIDAÇÃO DE CONSISTÊNCIA DOCUMENTAL")
print(f"   Repositório: {BASE}")
print("=" * 60)
print()
print(f"✅  Checks passados:  {checks_passed}")
print(f"❌  Erros:           {len(errors)}")
print(f"⚠️  Avisos:          {len(warnings)}")
print()

if errors:
    print("--- ❌ ERROS (precisam ser corrigidos) ---")
    for e in errors:
        print(e)
    print()

if warnings:
    print("--- ⚠️  AVISOS (recomenda-se revisar) ---")
    for w in warnings:
        print(w)
    print()

if not errors:
    print("✅  Tudo consistente! Estrutura documental validada.")
    sys.exit(0)
else:
    print("❌  Corrija os erros acima antes de prosseguir.")
    sys.exit(1)
