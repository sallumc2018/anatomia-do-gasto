from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))


def extract_prompt(payload: dict) -> str:
    for key in ("message", "prompt"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def main() -> int:
    try:
        # Read the JSON payload from stdin
        input_data = sys.stdin.read()
        if not input_data.strip():
            # If no input, just pass through
            print(json.dumps({}))
            return 0

        payload = json.loads(input_data)
        prompt = extract_prompt(payload)

        # Skip RAG query for short inputs, simple confirmations, or terminal commands
        # to avoid polluting context and causing unnecessary execution overhead
        if len(prompt) < 12 or prompt.lower() in ("sim", "não", "ok", "yes", "no", "help", "clear", "exit"):
            print(json.dumps({}))
            return 0

        # Run the local RAG query
        # Using a subprocess to keep this hook fast and isolated
        query_script = ROOT / "tools" / "memory" / "query-rag.py"
        if not query_script.exists():
            print(json.dumps({}))
            return 0

        # Execute query-rag.py
        result = subprocess.run(
            [
                sys.executable,
                str(query_script),
                "--agent",
                "orquestrador",
                "--query",
                prompt,
                "--limit",
                "3",
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=8,
        )

        if result.returncode == 0 and result.stdout.strip():
            context_header = (
                "=== [CONTEXTO SEMÂNTICO LOCAL AUTOMÁTICO] ===\n"
                "Trechos relevantes da memória do projeto encontrados para esta mensagem:\n\n"
            )
            context_body = result.stdout.strip()
            full_context = f"{context_header}{context_body}\n============================================="

            # Output the additionalContext key as JSON on stdout
            print(json.dumps({"additionalContext": full_context}, ensure_ascii=False))
        else:
            print(json.dumps({}))

    except Exception:
        # Never break the user experience; if anything fails, print empty JSON and exit 0
        print(json.dumps({}))

    return 0


if __name__ == "__main__":
    sys.exit(main())
