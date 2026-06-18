#!/usr/bin/env python3
# Hook PreToolUse (Write/Edit): quando o arquivo alvo esta em data/public,
# injeta um lembrete (additionalContext) para rodar verificar_publicacao.py e
# registrar em qa.csv antes de considerar publicado. Nao bloqueia.
# Porte cross-platform do remind_public_qa.ps1.
#
# additionalContext vai para o modelo (Claude), nao gera ruido visual para o usuario.
import json
import re
import sys


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0

    fp = (data.get("tool_input") or {}).get("file_path")
    if not fp:
        return 0

    if re.search(r"data[\\/]public[\\/]", fp):
        msg = (
            "Lembrete (hook): este arquivo esta em data/public. Antes de considerar publicado: "
            "(1) rode python3 pipelines/testes/verificar_publicacao.py; "
            "(2) garanta entrada em data/manifests/datasets.csv; "
            "(3) registre em data/manifests/sorocaba/qa.csv. "
            "Nao publique texto bruto como serie estruturada."
        )
        out = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "additionalContext": msg,
            }
        }
        print(json.dumps(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
