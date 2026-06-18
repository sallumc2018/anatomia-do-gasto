#!/usr/bin/env python3
# Hook PreToolUse (Bash): bloqueia winget install de binario nao auditado.
# Porte cross-platform do check_winget_install.ps1. winget e Windows-only:
# em Linux o comando nunca aparece, entao o hook fica inerte (sem custo).
# Allowlist = IDs winget marcados em requirements-audit.txt nas linhas "via:winget <ID>".
# Mesma politica do pip gate, para binarios externos.
import json
import re
import sys
from pathlib import Path


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0

    cmd = (data.get("tool_input") or {}).get("command")
    if not cmd:
        return 0

    # remove trechos entre aspas (mencoes em string/doc nao sao comando)
    scan = re.sub(r'"[^"]*"', "", cmd)
    scan = re.sub(r"'[^']*'", "", scan)
    # so age em "winget install" como comando real (inicio de segmento)
    seg_match = False
    for seg in re.split(r"&&|\|\||\||;|\r?\n", scan):
        if re.match(r"^winget\s+install\b", seg.strip()):
            seg_match = True
            break
    if not seg_match:
        return 0

    # allowlist de IDs winget a partir do requirements-audit.txt
    audit_path = Path(__file__).resolve().parents[2] / "requirements-audit.txt"
    allow = []
    if audit_path.exists():
        for line in audit_path.read_text(encoding="utf-8", errors="replace").splitlines():
            m = re.search(r"via:winget\s+(\S+)", line)
            if m:
                allow.append(m.group(1).lower())

    # extrai o ID do pacote apos "winget install" (corta no primeiro operador de shell)
    after = re.sub(r"(?s).*?winget\s+install\s+", "", cmd)
    after = re.split(r"(\&\&|\|\||\||;|2>|>|\n)", after)[0]
    tokens = [t for t in re.split(r"\s+", after) if t and not t.startswith("-")]
    pkg = tokens[0].lower().strip() if tokens else ""

    if pkg and pkg not in allow:
        reason = (
            f"Bloqueado: binario winget nao auditado -> {pkg}. "
            f"Audite com /catao e registre em requirements-audit.txt (linha 'via:winget {pkg}') antes de instalar."
        )
        out = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }
        }
        print(json.dumps(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
