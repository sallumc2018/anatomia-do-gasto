from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from common import LOCAL_RUN_DIR, LocalLock, ensure_local_agent_dirs, now_id


ROOT = Path(__file__).resolve().parents[2]


COMMANDS = [
    ["python", "-m", "compileall", "-q", "tools/memory"],
    ["python", "-m", "compileall", "-q", "tools/agents"],
    ["python", "tools/memory/audit-memory-scope.py"],
    ["python", "tools/memory/build-rag-index.py", "--check"],
    ["python", "tools/memory/build-rag-index.py"],
    ["python", "tools/agents/validate-agent-contracts.py"],
    ["python", "tools/agents/plan-route.py", "completar dados faltantes sorocaba"],
]


def run_command(command: list[str]) -> dict:
    completed = subprocess.run(
        command,
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    return {
        "command": command,
        "returncode": completed.returncode,
        "stdout": completed.stdout[-4000:],
        "stderr": completed.stderr[-4000:],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run safe read-only/local-safe agent maintenance cycle.")
    parser.add_argument("--json", action="store_true", help="Print JSON summary.")
    args = parser.parse_args()

    ensure_local_agent_dirs()
    run_id = now_id("readonly-cycle")
    with LocalLock("readonly-cycle"):
        results = [run_command(command) for command in COMMANDS]
        status = "ok" if all(item["returncode"] == 0 for item in results) else "fail"
        payload = {
            "id": run_id,
            "time": datetime.now(timezone.utc).isoformat(),
            "status": status,
            "commands": results,
            "writes": [".local/rag/anatomia_public.sqlite", ".local/memory/agent-runs"],
            "forbidden_actions": ["data/public", "git commit", "git push", "deploy", "delete", "G:", "GitHub", "Vercel", "Registro.br"],
        }
        target = LOCAL_RUN_DIR / f"{run_id}.json"
        target.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(f"Readonly cycle: {status}")
        print(f"Run log: {target.relative_to(ROOT)}")
        for item in results:
            print(f"- {' '.join(item['command'])}: {item['returncode']}")
    return 0 if status == "ok" else 1


if __name__ == "__main__":
    sys.exit(main())
