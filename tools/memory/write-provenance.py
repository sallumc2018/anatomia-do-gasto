from __future__ import annotations

import argparse
import csv
import sys
from datetime import datetime, timezone
from pathlib import Path

from common import ROOT, configure_utf8_stdio


LOG = ROOT / "memory" / "provenance" / "changes.csv"
FIELDS = [
    "id",
    "date",
    "time_utc",
    "actor",
    "tool",
    "model",
    "environment",
    "change_type",
    "scope",
    "summary",
    "paths_changed",
    "validation",
    "status",
    "privacy",
]


def read_existing_ids() -> set[str]:
    if not LOG.exists():
        return set()
    with LOG.open("r", encoding="utf-8-sig", newline="") as handle:
        return {row["id"] for row in csv.DictReader(handle) if row.get("id")}


def next_id(today: str) -> str:
    prefix = f"PV-{today}-"
    numbers = []
    for row_id in read_existing_ids():
        if row_id.startswith(prefix):
            try:
                numbers.append(int(row_id.removeprefix(prefix)))
            except ValueError:
                continue
    return f"{prefix}{(max(numbers) + 1 if numbers else 1):03d}"


def main() -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(description="Append a public sanitized change provenance row.")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--actor", required=False)
    parser.add_argument("--tool", required=False)
    parser.add_argument("--model", required=False)
    parser.add_argument("--environment", default="unknown")
    parser.add_argument("--change-type", default="change")
    parser.add_argument("--scope", required=False)
    parser.add_argument("--summary", required=False)
    parser.add_argument("--paths-changed", action="append", default=[])
    parser.add_argument("--validation", default="not run")
    parser.add_argument("--status", choices=("planned", "implemented", "validated", "reverted", "superseded"), default="implemented")
    parser.add_argument("--privacy", default="public sanitized")
    parser.add_argument("--id")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.check:
        LOG.parent.mkdir(parents=True, exist_ok=True)
        print("Provenance writer check: OK")
        return 0

    missing = [
        name
        for name, value in {
            "--actor": args.actor,
            "--tool": args.tool,
            "--model": args.model,
            "--scope": args.scope,
            "--summary": args.summary,
            "--paths-changed": args.paths_changed,
        }.items()
        if not value
    ]
    if missing:
        print(f"Missing required arguments: {', '.join(missing)}")
        return 1

    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    row = {
        "id": args.id or next_id(today),
        "date": today,
        "time_utc": now.strftime("%H:%M:%S"),
        "actor": args.actor,
        "tool": args.tool,
        "model": args.model,
        "environment": args.environment,
        "change_type": args.change_type,
        "scope": args.scope,
        "summary": args.summary,
        "paths_changed": "; ".join(item.strip() for item in args.paths_changed if item.strip()),
        "validation": args.validation,
        "status": args.status,
        "privacy": args.privacy,
    }

    if args.dry_run:
        print(row)
        return 0

    LOG.parent.mkdir(parents=True, exist_ok=True)
    new_file = not LOG.exists()
    with LOG.open("a", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        if new_file:
            writer.writeheader()
        writer.writerow(row)
    print(f"Provenance row written: {row['id']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
