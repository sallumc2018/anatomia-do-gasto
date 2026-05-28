from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

from common import ROOT, configure_utf8_stdio


def frontend_command(script: str) -> dict:
    if os.name == "nt":
        command = ["npm.cmd", "--script-shell", "cmd.exe", "run", script]
    else:
        command = ["npm", "run", script]
    return {"command": command, "cwd": ROOT / "apps" / "web"}


COMMANDS: dict[str, list[dict]] = {
    "memory": [
        {"command": ["python", "-m", "compileall", "-q", "tools/memory"], "cwd": ROOT},
        {"command": ["python", "tools/memory/audit-memory-scope.py"], "cwd": ROOT},
        {"command": ["python", "tools/memory/validate-knowledge-base.py"], "cwd": ROOT},
        {"command": ["python", "tools/memory/validate-provenance-log.py"], "cwd": ROOT},
        {"command": ["python", "tools/memory/build-rag-index.py", "--check"], "cwd": ROOT},
        {"command": ["python", "tools/memory/write-token-economy.py", "--check"], "cwd": ROOT},
        {"command": ["python", "tools/memory/write-provenance.py", "--check"], "cwd": ROOT},
    ],
    "agents": [
        {"command": ["python", "-m", "compileall", "-q", "tools/agents"], "cwd": ROOT},
        {"command": ["python", "tools/agents/validate-agent-contracts.py"], "cwd": ROOT},
        {"command": ["python", "tools/agents/validate-maestro-learning.py"], "cwd": ROOT},
        {"command": ["python", "tools/agents/eval-maestro-training.py"], "cwd": ROOT},
        {"command": ["python", "tools/agents/watch-worktree.py", "--once", "--source-label", "validation"], "cwd": ROOT},
        {"command": ["python", "tools/agents/plan-route.py", "completar dados faltantes sorocaba"], "cwd": ROOT},
        {"command": ["python", "tools/agents/start-topic.py", "validar automacoes locais", "--rag-limit", "1"], "cwd": ROOT},
    ],
    "scope": [
        {"command": ["python", "tools/agents/check-scope-gates.py"], "cwd": ROOT},
    ],
    "pipeline": [
        {
            "command": [
                "python",
                "-m",
                "py_compile",
                "pipelines/paths.py",
                "pipelines/pipeline.py",
                "pipelines/publicar_dados.py",
            ],
            "cwd": ROOT,
        },
        {"command": ["python", "pipelines/testes/verificar_publicacao.py"], "cwd": ROOT},
    ],
    "publication": [
        {"command": ["python", "pipelines/testes/verificar_publicacao.py", "--strict"], "cwd": ROOT},
        {"command": ["python", "tools/agents/check-scope-gates.py"], "cwd": ROOT},
    ],
}


def get_commands(area: str) -> list[dict]:
    if area == "frontend":
        return COMMANDS["scope"] + [frontend_command("lint"), frontend_command("build")]
    if area == "all":
        commands: list[dict] = []
        for item in ("memory", "agents", "scope", "pipeline", "frontend"):
            commands.extend(get_commands(item))
        return commands
    return COMMANDS[area]


def run_command(item: dict) -> dict:
    env = os.environ.copy()
    env.setdefault("PYTHONIOENCODING", "utf-8")
    completed = subprocess.run(
        item["command"],
        cwd=item["cwd"],
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
        env=env,
    )
    return {
        "command": item["command"],
        "cwd": item["cwd"].relative_to(ROOT).as_posix() if item["cwd"] != ROOT else ".",
        "returncode": completed.returncode,
        "stdout": completed.stdout[-4000:].strip(),
        "stderr": completed.stderr[-4000:].strip(),
    }


def print_result(result: dict) -> None:
    command = " ".join(result["command"])
    print(f"- ({result['returncode']}) {result['cwd']}> {command}")
    output = result["stdout"] or result["stderr"]
    if output:
        print(output)


def main() -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(description="Run validation wrappers by project area.")
    parser.add_argument(
        "--area",
        required=True,
        choices=sorted([*COMMANDS.keys(), "frontend", "all"]),
        help="Validation area.",
    )
    parser.add_argument("--continue-on-error", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    results: list[dict] = []
    for item in get_commands(args.area):
        result = run_command(item)
        results.append(result)
        if result["returncode"] != 0 and not args.continue_on_error:
            break

    status = "ok" if all(result["returncode"] == 0 for result in results) else "fail"
    payload = {
        "area": args.area,
        "status": status,
        "results": results,
        "forbidden_actions": ["commit", "push", "deploy", "npm install", "data/public publication"],
    }

    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(f"Validation area '{args.area}': {status}")
        for result in results:
            print_result(result)

    return 0 if status == "ok" else 1


if __name__ == "__main__":
    sys.exit(main())
