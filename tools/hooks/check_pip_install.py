#!/usr/bin/env python3
# Hook PreToolUse (Bash): bloqueia pip install de pacote nao auditado.
# Porte cross-platform do check_pip_install.ps1 (origem Windows; agora Linux/python3).
# Espelha a politica de seguranca npm para pip. Le requirements-audit.txt como allowlist.
# Permite uso explicito de -r requirements-audit.txt. Caso contrario, exige que cada
# pacote esteja listado no arquivo auditado (Catao aprova antes de adicionar la).
#
# Entrada: JSON do hook via stdin (tool_input.command)
# Saida: JSON com permissionDecision=deny quando ha pacote nao listado.
import json
import re
import sys
from pathlib import Path


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0  # sem payload valido -> nao interfere

    cmd = (data.get("tool_input") or {}).get("command")
    if not cmd:
        return 0

    # Detecta "pip install" apenas como COMANDO real (inicio de um segmento de shell).
    # Remove trechos entre aspas primeiro: "pip install X" dentro de string/heredoc/echo
    # (provenance, docs) nao eh comando. Comando real nao fica entre aspas.
    scan = re.sub(r'"[^"]*"', "", cmd)
    scan = re.sub(r"'[^']*'", "", scan)
    pip_seg = None
    for seg in re.split(r"&&|\|\||\||;|\r?\n", scan):
        s = seg.strip()
        if re.match(r"^(?:py(?:thon3?)?(?:\s+-\S+)*\s+-m\s+)?pip3?\s+install\b", s):
            pip_seg = s
            break
    if not pip_seg:
        return 0  # nenhum pip install como comando real

    # uso do arquivo auditado e sempre permitido
    if re.search(r"requirements-audit\.txt", pip_seg):
        return 0

    # allowlist a partir do requirements-audit.txt
    audit_path = Path(__file__).resolve().parents[2] / "requirements-audit.txt"
    listed = []
    if audit_path.exists():
        for line in audit_path.read_text(encoding="utf-8", errors="replace").splitlines():
            if re.match(r"^\s*#", line) or not line.strip():
                continue
            name = re.split(r"[=<>\s\\]", line)[0].lower().strip()
            if name:
                listed.append(name)

    # extrai pacotes do trecho apos "pip install" (non-greedy desde o primeiro pip install)
    after = re.sub(r"(?s).*?pip\s+install\s+", "", cmd)
    # corta no primeiro operador de shell (&&, ||, |, ;, >, 2>, nova linha)
    after = re.split(r"(\&\&|\|\||\||;|2>|>|\n)", after)[0]
    tokens = [t for t in re.split(r"\s+", after) if t and not t.startswith("-")]
    unlisted = []
    for t in tokens:
        name = re.split(r"[=<>\[]", t)[0].lower().strip()
        if name and name not in listed:
            unlisted.append(name)

    if unlisted:
        reason = (
            "Bloqueado: pacote(s) nao auditado(s) em requirements-audit.txt -> "
            + ", ".join(unlisted)
            + ". Audite com /catao e adicione ao requirements-audit.txt antes de instalar "
            + "(ou use: pip install --require-hashes -r requirements-audit.txt)."
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
