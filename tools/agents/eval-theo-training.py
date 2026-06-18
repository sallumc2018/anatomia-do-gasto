"""Théo training eval — static checks.

Validates:
  - cases.csv format
  - all expected_route IDs (except OFF_SCOPE) exist in theo-guide.tsx
  - confidence-state.csv has exactly one active row for théo
  - confidence-levels.csv has C0/C1/C2 rows

Does NOT run the matcher. The matcher is run by tools/agents/train-theo.py --cycle.
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

from common import ROOT, configure_utf8_stdio


CASES = ROOT / "memory" / "training" / "theo" / "cases.csv"
STATE = ROOT / "memory" / "agents" / "theo-confidence-state.csv"
LEVELS = ROOT / "memory" / "agents" / "theo-confidence-levels.csv"
SCOPE = ROOT / "memory" / "training" / "theo" / "scope.md"
THEO_TSX = ROOT / "apps" / "web" / "components" / "theo" / "theo-guide.tsx"

CASE_FIELDS = [
    "id", "query", "expected_route", "expected_score_min",
    "scope_check", "human_gate", "gap_type", "notes",
]
LEVEL_ORDER = {"C0": 0, "C1": 1, "C2": 2}


def parse_route_ids() -> set[str]:
    if not THEO_TSX.exists():
        return set()
    text = THEO_TSX.read_text(encoding="utf-8")
    return set(re.findall(r'id:\s*"([^"]+)"', text))


def active_level() -> str | None:
    if not STATE.exists():
        return None
    with STATE.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if row.get("agent") == "theo" and row.get("status") == "active":
                return row.get("current_level")
    return None


def main() -> int:
    configure_utf8_stdio()
    errors: list[str] = []
    warnings: list[str] = []

    if not CASES.exists():
        errors.append(f"missing {CASES.relative_to(ROOT).as_posix()}")
    if not STATE.exists():
        errors.append(f"missing {STATE.relative_to(ROOT).as_posix()}")
    if not LEVELS.exists():
        errors.append(f"missing {LEVELS.relative_to(ROOT).as_posix()}")
    if not SCOPE.exists():
        errors.append(f"missing {SCOPE.relative_to(ROOT).as_posix()}")

    if errors:
        print("Théo training eval: FAIL")
        for err in errors:
            print(f"- {err}")
        return 1

    with CASES.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != CASE_FIELDS:
            errors.append(
                f"cases.csv has invalid header: {reader.fieldnames} != {CASE_FIELDS}"
            )
            case_rows: list[dict] = []
        else:
            case_rows = list(reader)

    route_ids = parse_route_ids()
    if not route_ids:
        errors.append("could not parse any route id from theo-guide.tsx")

    for row in case_rows:
        case_id = row.get("id", "?")
        scope = row.get("scope_check")
        if scope not in {"in", "off"}:
            errors.append(f"{case_id}: invalid scope_check {scope!r}")
        if row.get("human_gate") not in {"yes", "no"}:
            errors.append(f"{case_id}: invalid human_gate {row.get('human_gate')!r}")
        expected = row.get("expected_route", "")
        if scope == "in" and expected not in route_ids and expected != "OFF_SCOPE":
            errors.append(
                f"{case_id}: expected_route {expected!r} does not exist in theo-guide.tsx"
            )
        if scope == "off" and expected != "OFF_SCOPE":
            errors.append(
                f"{case_id}: off-scope case must use expected_route=OFF_SCOPE"
            )
        try:
            int(row.get("expected_score_min", "0") or "0")
        except ValueError:
            errors.append(
                f"{case_id}: expected_score_min must be integer, got {row.get('expected_score_min')!r}"
            )

    with LEVELS.open("r", encoding="utf-8-sig", newline="") as handle:
        levels = list(csv.DictReader(handle))
    level_ids = {row["level"] for row in levels}
    if not {"C0", "C1", "C2"}.issubset(level_ids):
        errors.append(
            f"confidence-levels.csv must define C0, C1, C2 (got {sorted(level_ids)})"
        )

    level = active_level()
    if level is None:
        errors.append("no active théo confidence row in confidence-state.csv")
    elif level not in LEVEL_ORDER:
        errors.append(f"active confidence level invalid: {level!r}")

    if errors:
        print("Théo training eval: FAIL")
        for err in errors:
            print(f"- {err}")
        return 1

    print("Théo training eval: OK")
    print(f"- cases: {len(case_rows)}")
    print(f"- in-scope cases: {sum(1 for r in case_rows if r['scope_check'] == 'in')}")
    print(f"- off-scope cases: {sum(1 for r in case_rows if r['scope_check'] == 'off')}")
    print(f"- routes in theo-guide.tsx: {len(route_ids)}")
    print(f"- active confidence: {level}")
    if warnings:
        for w in warnings:
            print(f"- warn: {w}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
