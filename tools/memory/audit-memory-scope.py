from __future__ import annotations

import sys

from common import REGISTRY, is_forbidden_path, iter_entry_files, read_registry, relative


VALID_VISIBILITY = {"public", "local-safe"}
VALID_AUTHORITY = {"canonical", "reference", "historical", "deprecated"}
VALID_STATUS = {"active", "resolved", "superseded", "expired"}


def main() -> int:
    errors: list[str] = []
    ids: set[str] = set()
    try:
        entries = read_registry(REGISTRY)
    except Exception as exc:
        print(f"FAIL registry: {exc}")
        return 1

    for entry in entries:
        if not entry.id:
            errors.append("missing id")
        if entry.id in ids:
            errors.append(f"duplicate id: {entry.id}")
        ids.add(entry.id)
        if entry.visibility not in VALID_VISIBILITY:
            errors.append(f"{entry.id}: invalid visibility {entry.visibility!r}")
        if entry.authority not in VALID_AUTHORITY:
            errors.append(f"{entry.id}: invalid authority {entry.authority!r}")
        if entry.status not in VALID_STATUS:
            errors.append(f"{entry.id}: invalid status {entry.status!r}")
        if entry.visibility == "public" and entry.path.startswith(".local/"):
            errors.append(f"{entry.id}: public entry cannot point to .local")
        reason = is_forbidden_path(entry.path)
        if reason:
            errors.append(f"{entry.id}: {entry.path}: {reason}")
            continue
        try:
            for path in iter_entry_files(entry):
                rel = relative(path)
                file_reason = is_forbidden_path(rel)
                if file_reason:
                    errors.append(f"{entry.id}: {rel}: {file_reason}")
        except Exception as exc:
            errors.append(f"{entry.id}: {exc}")

    if errors:
        print("Memory scope audit: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"Memory scope audit: OK ({len(entries)} registry entries)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
