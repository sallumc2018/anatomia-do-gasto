from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

from common import ROOT, configure_utf8_stdio


BUDGETS = {
    "maestro": "< 800 tok",
    "orquestrador": "< 800 tok",
    "goal": "< 800 tok",
    "dados": "< 3 K tok",
    "pipeline": "< 5 K tok",
    "qa": "< 4 K tok",
    "analista": "< 8 K tok",
    "frontend": "< 12 K tok",
    "deploy": "< 2 K tok",
    "tablet": "< 2 K tok",
    "seguranca": "< 3 K tok",
    "engenheiro": "por tarefa",
    "onboarding": "< 6 K tok",
    "monitor": "< 3 K tok",
    "playwright": "< 6 K tok",
    "dba": "< 4 K tok",
}


def run_command(command: list[str], cwd: Path = ROOT) -> dict:
    env = os.environ.copy()
    env.setdefault("PYTHONIOENCODING", "utf-8")
    completed = subprocess.run(
        command,
        cwd=cwd,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
        env=env,
    )
    return {
        "command": command,
        "cwd": cwd.relative_to(ROOT).as_posix() if cwd != ROOT else ".",
        "returncode": completed.returncode,
        "stdout": completed.stdout.strip(),
        "stderr": completed.stderr.strip(),
    }


def first_output_line(result: dict) -> str:
    for line in result["stdout"].splitlines():
        line = line.strip()
        if line:
            return line
    return ""


def first_agent(route_line: str) -> str:
    agent = route_line.split("->", 1)[0].strip().rstrip("?")
    return agent or "orquestrador"


def print_text(payload: dict) -> None:
    print("## Inicio de topico - read-only")
    print(f"- Objetivo: {payload['objective']}")
    print(f"- Rota sugerida: {payload['route'] or 'indefinida'}")
    print(f"- Budget alvo: {payload['budget_agent']} {payload['budget']}")
    print(f"- Gate inicial: nao commitar, nao fazer push/deploy, nao publicar data/public sem autorizacao")
    print("")
    print("### Git")
    print(payload["git_status"]["stdout"] or payload["git_status"]["stderr"] or "sem saida")
    print("")
    print("### Contexto RAG")
    rag = payload["rag"]
    if rag["returncode"] == 0:
        print(rag["stdout"])
    else:
        print(rag["stdout"] or rag["stderr"] or "RAG indisponivel")
    print("")
    print("### Pedido recomendado")
    print(
        "Novo topico: <area>. Objetivo: <resultado>. Pode editar: <paths>. "
        "Nao pode: <gates>. Validacao: <comandos>. Entrega: diff + validacao + handoff curto."
    )


def main() -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(description="Start a read-only optimized topic.")
    parser.add_argument("objective", nargs="+", help="Topic objective.")
    parser.add_argument("--agent", default="orquestrador", help="Agent allowed to query RAG.")
    parser.add_argument("--rag-limit", type=int, default=3)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    objective = " ".join(args.objective)
    git_status = run_command(["git", "status", "-sb"])
    route_result = run_command(["python", "tools/agents/plan-route.py", objective])
    route_line = first_output_line(route_result)
    budget_agent = first_agent(route_line)
    budget = BUDGETS.get(budget_agent, "por tarefa")
    rag_result = run_command(
        [
            "python",
            "tools/memory/query-rag.py",
            "--agent",
            args.agent,
            "--query",
            objective,
            "--limit",
            str(args.rag_limit),
        ]
    )

    payload = {
        "objective": objective,
        "git_status": git_status,
        "route_result": route_result,
        "route": route_line,
        "budget_agent": budget_agent,
        "budget": budget,
        "rag": rag_result,
        "writes": [],
        "forbidden_actions": ["commit", "push", "deploy", "npm install", "data/public publication"],
    }

    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print_text(payload)

    if git_status["returncode"] != 0 or route_result["returncode"] != 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
