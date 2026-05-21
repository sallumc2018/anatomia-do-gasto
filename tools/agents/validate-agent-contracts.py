from __future__ import annotations

import sys
import re
from pathlib import Path

from common import (
    COMMANDS_DIR,
    FORBIDDEN_DECLARATIONS,
    FORBIDDEN_WRITE_PATHS,
    ROOT,
    command_exists,
    command_names,
    read_agents,
)


VALID_AUTONOMY = {"automatic-readonly", "semi-autonomous-local", "supervised-write", "supervised-only"}


def contains_forbidden_write(write_paths: str) -> str | None:
    lower = write_paths.lower()
    if lower in {"none", ""}:
        return None
    for forbidden in FORBIDDEN_WRITE_PATHS:
        if forbidden in lower:
            return forbidden
    return None


def contains_forbidden_declaration(entry_text: str) -> str | None:
    lower = entry_text.lower()
    safe_negations = (
        "no secrets",
        "no secret",
        "never secrets",
        "never secret",
        "sem secrets",
        "sem secret",
        "no .env",
        "sem .env",
        "requires approval",
        "explicit approval",
    )
    for forbidden in FORBIDDEN_DECLARATIONS:
        if forbidden in {"secret", "secrets"} and re.search(r"\b(no|sem|never)\b[^;,.]{0,40}\bsecrets?\b", lower):
            continue
        if forbidden in lower and not any(negation in lower for negation in safe_negations):
            return forbidden
    return None


def main() -> int:
    errors: list[str] = []
    entries = read_agents()
    by_name = {entry.name: entry for entry in entries}
    command_stems = command_names()

    if len(by_name) != len(entries):
        errors.append("duplicate agent names in registry")

    missing_in_registry = sorted(command_stems.difference(by_name))
    extra_in_registry = sorted(set(by_name).difference(command_stems))
    if missing_in_registry:
        errors.append(f"commands missing from registry: {', '.join(missing_in_registry)}")
    if extra_in_registry:
        errors.append(f"registry agents without command files: {', '.join(extra_in_registry)}")

    for entry in entries:
        if not command_exists(entry):
            errors.append(f"{entry.name}: command path not found: {entry.command_path}")
        if entry.autonomy not in VALID_AUTONOMY:
            errors.append(f"{entry.name}: invalid autonomy: {entry.autonomy}")
        if not entry.validation_commands:
            errors.append(f"{entry.name}: missing validation")
        if not entry.handoff_visibility:
            errors.append(f"{entry.name}: missing handoff visibility")
        forbidden_write = contains_forbidden_write(entry.write_paths)
        if forbidden_write:
            errors.append(f"{entry.name}: forbidden write path declaration: {forbidden_write}")
        forbidden_decl = contains_forbidden_declaration(
            " ".join(
                [
                    entry.read_paths,
                    entry.write_paths,
                    entry.validation_commands,
                    entry.gates,
                    entry.risks,
                ]
            )
        )
        if forbidden_decl:
            errors.append(f"{entry.name}: unsafe declaration without approval gate: {forbidden_decl}")

    for command in COMMANDS_DIR.glob("*.md"):
        text = command.read_text(encoding="utf-8", errors="replace")
        stem = command.stem
        if stem in by_name and "tools/memory/query-rag.py" not in text:
            errors.append(f"{stem}: command does not mention memory/RAG")
        if stem in by_name and "write-handoff.py" not in text:
            errors.append(f"{stem}: command does not mention persistent handoff")

    if errors:
        print("Agent contract validation: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Agent contract validation: OK ({len(entries)} agents)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
