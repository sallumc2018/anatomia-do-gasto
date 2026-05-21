from __future__ import annotations

import argparse
import re
import sys

from common import read_agents


ROUTES = [
    (
        re.compile(r"(completar|faltant|lacuna|ausente).*(dado|dados)|dados.*(faltant|ausente|lacuna)", re.I),
        ["analista", "dados", "pipeline", "qa", "frontend?", "deploy?"],
        "Complete missing published coverage without publication until QA and explicit approval.",
    ),
    (
        re.compile(r"(novo municipio|nova cidade|adicionar cidade|expandir|onboarding)", re.I),
        ["onboarding", "dados?", "pipeline?", "qa?", "frontend?", "deploy?"],
        "Map municipality first; defer execution agents until onboarding returns prerequisites.",
    ),
    (
        re.compile(r"(site|pagina|componente|layout|frontend|next)", re.I),
        ["frontend", "deploy?"],
        "Frontend changes use only data/public and require deploy approval.",
    ),
    (
        re.compile(r"(seguranca|supply|watchdog|firewall|alerta|hardening)", re.I),
        ["seguranca"],
        "Security checks are read-only unless explicit approval is given.",
    ),
    (
        re.compile(r"(tablet|adb|android|termux|sincron)", re.I),
        ["tablet"],
        "Tablet operations can sync public data; destructive actions require approval.",
    ),
    (
        re.compile(r"(deploy|publicar|push|producao|produção|vercel)", re.I),
        ["deploy"],
        "Release operations require explicit human authorization.",
    ),
]


def main() -> int:
    parser = argparse.ArgumentParser(description="Plan an agent route for a task.")
    parser.add_argument("objective", nargs="+", help="Task objective.")
    args = parser.parse_args()
    objective = " ".join(args.objective)
    registered = {entry.name for entry in read_agents()}

    for pattern, route, reason in ROUTES:
        if pattern.search(objective):
            missing = [agent.rstrip("?") for agent in route if agent.rstrip("?") not in registered]
            if missing:
                print(f"Route invalid; missing agents: {', '.join(missing)}")
                return 1
            print(" -> ".join(route))
            print(f"Reason: {reason}")
            return 0

    print("orquestrador")
    print("Reason: No specific route matched; classify with the orchestrator.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
