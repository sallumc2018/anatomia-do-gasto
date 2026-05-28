from __future__ import annotations

import csv
import sys
from pathlib import Path

from common import ROOT


PROBLEMS = ROOT / "memory" / "knowledge" / "problems.csv"
SOLUTIONS = ROOT / "memory" / "knowledge" / "solutions.csv"

PROBLEM_FIELDS = [
    "id",
    "date",
    "source",
    "area",
    "severity",
    "status",
    "summary",
    "evidence",
    "impact",
    "related_path",
    "solution_id",
    "privacy",
]

SOLUTION_FIELDS = [
    "id",
    "date",
    "source",
    "problem_id",
    "status",
    "summary",
    "action",
    "validation",
    "related_path",
    "reuse_notes",
    "privacy",
]

VALID_PROBLEM_STATUS = {"open", "resolved", "monitoring", "superseded"}
VALID_SOLUTION_STATUS = {"candidate", "implemented", "validated", "rejected", "superseded"}
VALID_SEVERITY = {"low", "medium", "high", "critical"}
BLOCKED_FRAGMENTS = {
    "BEGIN PRIVATE KEY",
    "password=",
    "pwd=",
    "authorization: bearer",
    "set-cookie:",
}


def read_csv(path: Path, fields: list[str]) -> tuple[list[dict[str, str]], list[str]]:
    errors: list[str] = []
    if not path.exists():
        return [], [f"missing file: {path.relative_to(ROOT).as_posix()}"]
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != fields:
            errors.append(f"{path.name}: invalid header")
        rows = list(reader)
    return rows, errors


def scan_blocked(path: Path, rows: list[dict[str, str]]) -> list[str]:
    errors: list[str] = []
    for index, row in enumerate(rows, start=2):
        text = " ".join(row.values())
        lowered = text.lower()
        for fragment in BLOCKED_FRAGMENTS:
            if fragment.lower() in lowered:
                errors.append(f"{path.name}:{index}: blocked fragment {fragment!r}")
    return errors


def main() -> int:
    errors: list[str] = []
    problems, problem_errors = read_csv(PROBLEMS, PROBLEM_FIELDS)
    solutions, solution_errors = read_csv(SOLUTIONS, SOLUTION_FIELDS)
    errors.extend(problem_errors)
    errors.extend(solution_errors)

    problem_ids = {row["id"] for row in problems}
    solution_ids = {row["id"] for row in solutions}

    if len(problem_ids) != len(problems):
        errors.append("problems.csv contains duplicate ids")
    if len(solution_ids) != len(solutions):
        errors.append("solutions.csv contains duplicate ids")

    for index, row in enumerate(problems, start=2):
        if row["severity"] not in VALID_SEVERITY:
            errors.append(f"problems.csv:{index}: invalid severity {row['severity']!r}")
        if row["status"] not in VALID_PROBLEM_STATUS:
            errors.append(f"problems.csv:{index}: invalid status {row['status']!r}")
        solution_id = row["solution_id"].strip()
        if solution_id and solution_id not in solution_ids:
            errors.append(f"problems.csv:{index}: unknown solution_id {solution_id!r}")
        if "public sanitized" not in row["privacy"]:
            errors.append(f"problems.csv:{index}: privacy must state public sanitized")

    for index, row in enumerate(solutions, start=2):
        if row["status"] not in VALID_SOLUTION_STATUS:
            errors.append(f"solutions.csv:{index}: invalid status {row['status']!r}")
        problem_id = row["problem_id"].strip()
        if problem_id and problem_id not in problem_ids:
            errors.append(f"solutions.csv:{index}: unknown problem_id {problem_id!r}")
        if "public sanitized" not in row["privacy"]:
            errors.append(f"solutions.csv:{index}: privacy must state public sanitized")

    errors.extend(scan_blocked(PROBLEMS, problems))
    errors.extend(scan_blocked(SOLUTIONS, solutions))

    if errors:
        print("Knowledge base validation: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Knowledge base validation: OK")
    print(f"- problems: {len(problems)}")
    print(f"- solutions: {len(solutions)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
