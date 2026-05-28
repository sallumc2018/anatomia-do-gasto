from __future__ import annotations

import csv
import sys

from common import ROOT, configure_utf8_stdio


CONTRACT = ROOT / "memory" / "agents" / "maestro-learning.md"
LOG = ROOT / "memory" / "agents" / "maestro-learning-log.csv"
CONFIDENCE_LEVELS = ROOT / "memory" / "agents" / "maestro-confidence-levels.csv"
CONFIDENCE_STATE = ROOT / "memory" / "agents" / "maestro-confidence-state.csv"

FIELDS = [
    "date",
    "source",
    "goal",
    "route_decision",
    "outcome_signal",
    "lesson",
    "action",
    "status",
    "related_path",
    "privacy",
]

VALID_STATUS = {"candidate", "promoted", "rejected", "superseded"}
VALID_CONFIDENCE_LEVELS = {"C0", "C1", "C2", "C3", "C4"}
CONFIDENCE_LEVEL_FIELDS = [
    "level",
    "name",
    "min_validated_signals",
    "allowed_solo_decisions",
    "requires_human",
    "forbidden_always",
]
CONFIDENCE_STATE_FIELDS = [
    "agent",
    "current_level",
    "effective_date",
    "evidence",
    "review_due",
    "status",
    "notes",
]
BLOCKED_TERMS = {
    ".env",
    "password",
    "cookie",
    "private key",
    "recovery code",
    "id_rsa",
    "id_ed25519",
}


def main() -> int:
    configure_utf8_stdio()
    errors: list[str] = []

    if not CONTRACT.exists():
        errors.append(f"missing contract: {CONTRACT.relative_to(ROOT).as_posix()}")
    if not LOG.exists():
        errors.append(f"missing log: {LOG.relative_to(ROOT).as_posix()}")
    if not CONFIDENCE_LEVELS.exists():
        errors.append(f"missing confidence levels: {CONFIDENCE_LEVELS.relative_to(ROOT).as_posix()}")
    if not CONFIDENCE_STATE.exists():
        errors.append(f"missing confidence state: {CONFIDENCE_STATE.relative_to(ROOT).as_posix()}")

    if errors:
        print("Maestro learning validation: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    with LOG.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != FIELDS:
            errors.append("maestro-learning-log.csv has invalid header")
        for index, row in enumerate(reader, start=2):
            status = (row.get("status") or "").strip()
            if status and status not in VALID_STATUS:
                errors.append(f"line {index}: invalid status {status!r}")
            text = " ".join((row.get(field) or "") for field in FIELDS).lower()
            for term in BLOCKED_TERMS:
                if term in text:
                    errors.append(f"line {index}: blocked term {term!r}")

    with CONFIDENCE_LEVELS.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != CONFIDENCE_LEVEL_FIELDS:
            errors.append("maestro-confidence-levels.csv has invalid header")
        levels = list(reader)
    seen_levels = {row.get("level", "") for row in levels}
    missing_levels = VALID_CONFIDENCE_LEVELS.difference(seen_levels)
    if missing_levels:
        errors.append(f"missing confidence levels: {', '.join(sorted(missing_levels))}")
    for index, row in enumerate(levels, start=2):
        level = row.get("level", "")
        if level not in VALID_CONFIDENCE_LEVELS:
            errors.append(f"maestro-confidence-levels.csv:{index}: invalid level {level!r}")
        try:
            int(row.get("min_validated_signals", ""))
        except ValueError:
            errors.append(f"maestro-confidence-levels.csv:{index}: invalid min_validated_signals")
        forbidden = row.get("forbidden_always", "").lower()
        for required in ("commit", "push", "deploy"):
            if required not in forbidden:
                errors.append(f"maestro-confidence-levels.csv:{index}: forbidden_always missing {required}")

    with CONFIDENCE_STATE.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != CONFIDENCE_STATE_FIELDS:
            errors.append("maestro-confidence-state.csv has invalid header")
        states = list(reader)
    active = [row for row in states if row.get("agent") == "maestro" and row.get("status") == "active"]
    if len(active) != 1:
        errors.append("maestro-confidence-state.csv must contain exactly one active maestro row")
    for index, row in enumerate(states, start=2):
        level = row.get("current_level", "")
        if level not in VALID_CONFIDENCE_LEVELS:
            errors.append(f"maestro-confidence-state.csv:{index}: invalid current_level {level!r}")

    contract_text = CONTRACT.read_text(encoding="utf-8", errors="replace").lower()
    required_phrases = [
        "pure dispatcher",
        "candidate lessons are not policy",
        "maestro-confidence-levels.csv",
        "validate-area.py --area agents",
    ]
    for phrase in required_phrases:
        if phrase not in contract_text:
            errors.append(f"contract missing phrase: {phrase}")

    if errors:
        print("Maestro learning validation: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Maestro learning validation: OK")
    print("- contract present")
    print("- learning log schema valid")
    print("- confidence schema valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
