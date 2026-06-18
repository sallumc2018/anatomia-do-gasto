from __future__ import annotations

import csv
import sys
from pathlib import Path

from common import ROOT


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

VALID_STATUSES = {"planned", "implemented", "validated", "reverted", "superseded"}
BLOCKED_FRAGMENTS = {
    "BEGIN PRIVATE KEY",
    "password=",
    "pwd=",
    "authorization: bearer",
    "set-cookie:",
    ".env.local",
    "recovery code",
    "secret=",
    "token=",
}


def read_rows() -> tuple[list[dict[str, str]], list[str]]:
    if not LOG.exists():
        return [], [f"missing file: {LOG.relative_to(ROOT).as_posix()}"]
    with LOG.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        errors = [] if reader.fieldnames == FIELDS else ["changes.csv: invalid header"]
        return list(reader), errors


def main() -> int:
    rows, errors = read_rows()
    ids: set[str] = set()
    for index, row in enumerate(rows, start=2):
        row_id = row.get("id", "").strip()
        if not row_id:
            errors.append(f"changes.csv:{index}: missing id")
        if row_id in ids:
            errors.append(f"changes.csv:{index}: duplicate id {row_id!r}")
        ids.add(row_id)
        for field in ("actor", "tool", "model", "summary", "paths_changed", "privacy"):
            if not row.get(field, "").strip():
                errors.append(f"changes.csv:{index}: missing {field}")
        if row.get("status", "").strip() not in VALID_STATUSES:
            errors.append(f"changes.csv:{index}: invalid status {row.get('status')!r}")
        if "public sanitized" not in row.get("privacy", ""):
            errors.append(f"changes.csv:{index}: privacy must state public sanitized")
        text = " ".join(row.values()).lower()
        for fragment in BLOCKED_FRAGMENTS:
            if fragment.lower() in text:
                errors.append(f"changes.csv:{index}: blocked fragment {fragment!r}")

    if errors:
        print("Provenance log validation: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Provenance log validation: OK")
    print(f"- changes: {len(rows)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
