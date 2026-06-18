from __future__ import annotations

import csv
import subprocess
import sys
from pathlib import Path

from common import ROOT, configure_utf8_stdio


CASES = ROOT / "memory" / "training" / "maestro" / "cases.csv"
STATE = ROOT / "memory" / "agents" / "maestro-confidence-state.csv"

FIELDS = ["id", "objective", "expected_route", "required_confidence", "human_gate", "notes"]
LEVEL_ORDER = {"C0": 0, "C1": 1, "C2": 2, "C3": 3, "C4": 4}


def run_route(objective: str) -> tuple[int, str, str]:
    completed = subprocess.run(
        ["python", "tools/agents/plan-route.py", objective],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
    )
    first_line = ""
    for line in completed.stdout.splitlines():
        if line.strip():
            first_line = line.strip()
            break
    return completed.returncode, first_line, completed.stderr.strip()


def active_confidence() -> str:
    with STATE.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = [
            row
            for row in csv.DictReader(handle)
            if row.get("agent") == "maestro" and row.get("status") == "active"
        ]
    if len(rows) != 1:
        raise RuntimeError("expected exactly one active Maestro confidence row")
    return rows[0]["current_level"]


def main() -> int:
    configure_utf8_stdio()
    errors: list[str] = []
    if not CASES.exists():
        print(f"Maestro training eval: FAIL\n- missing {CASES.relative_to(ROOT).as_posix()}")
        return 1

    current_level = active_confidence()
    with CASES.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != FIELDS:
            errors.append("cases.csv has invalid header")
            rows = []
        else:
            rows = list(reader)

    above_current: list[str] = []
    human_gates: list[str] = []

    for index, row in enumerate(rows, start=2):
        case_id = row["id"]
        required = row["required_confidence"]
        if required not in LEVEL_ORDER:
            errors.append(f"{case_id}: invalid required_confidence {required!r}")
            continue
        if row["human_gate"] not in {"yes", "no"}:
            errors.append(f"{case_id}: invalid human_gate {row['human_gate']!r}")
        returncode, route, stderr = run_route(row["objective"])
        if returncode != 0:
            errors.append(f"{case_id}: plan-route failed: {stderr or route}")
            continue
        if route != row["expected_route"]:
            errors.append(f"{case_id}: expected {row['expected_route']!r}, got {route!r}")
        if LEVEL_ORDER[current_level] < LEVEL_ORDER[required]:
            above_current.append(f"{case_id}:{required}")
        if row["human_gate"] == "yes":
            human_gates.append(case_id)

    if errors:
        print("Maestro training eval: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Maestro training eval: OK")
    print(f"- cases: {len(rows)}")
    print(f"- active confidence: {current_level}")
    print(f"- above current confidence: {', '.join(above_current) if above_current else 'none'}")
    print(f"- human-gated cases: {', '.join(human_gates) if human_gates else 'none'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
