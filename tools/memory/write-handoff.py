from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

from common import ROOT, ensure_local_dirs, is_forbidden_path


REQUIRED = {
    "id",
    "date",
    "agent",
    "status",
    "visibility",
    "scope",
    "done",
    "output",
    "validation",
    "blockers",
    "next_step",
    "related_paths",
}

VALID_STATUS = {"active", "resolved", "superseded", "expired"}
VALID_VISIBILITY = {"public", "local-safe"}


def slugify(text: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return value[:80] or "handoff"


def validate_handoff(data: dict) -> list[str]:
    errors: list[str] = []
    missing = REQUIRED.difference(data)
    if missing:
        errors.append(f"missing fields: {', '.join(sorted(missing))}")
    if data.get("status") not in VALID_STATUS:
        errors.append("invalid status")
    if data.get("visibility") not in VALID_VISIBILITY:
        errors.append("invalid visibility")
    related = data.get("related_paths", [])
    if not isinstance(related, list):
        errors.append("related_paths must be a list")
        related = []
    for path in related:
        if not isinstance(path, str):
            errors.append("related_paths values must be strings")
            continue
        reason = is_forbidden_path(path)
        if reason:
            errors.append(f"related path forbidden: {path}: {reason}")
    text_fields = ["scope", "done", "output", "validation", "blockers", "next_step"]
    for field in text_fields:
        value = data.get(field, "")
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{field} must be non-empty text")
    return errors


def render_markdown(data: dict) -> str:
    return "\n".join(
        [
            "---",
            f"id: {data['id']}",
            f"date: {data['date']}",
            f"agent: {data['agent']}",
            f"status: {data['status']}",
            f"visibility: {data['visibility']}",
            "---",
            "",
            f"# Handoff - {data['agent']}",
            "",
            f"- Scope: {data['scope']}",
            f"- Done: {data['done']}",
            f"- Output: {data['output']}",
            f"- Validation: {data['validation']}",
            f"- Blockers: {data['blockers']}",
            f"- Next step: {data['next_step']}",
            f"- Related paths: {', '.join(data['related_paths']) if data['related_paths'] else 'none'}",
            "",
        ]
    )


def output_dir(visibility: str, today: date) -> Path:
    month = today.strftime("%Y-%m")
    if visibility == "public":
        return ROOT / "memory" / "handoffs" / month
    return ROOT / ".local" / "memory" / "handoffs" / month


def main() -> int:
    parser = argparse.ArgumentParser(description="Write a validated agent handoff.")
    parser.add_argument("--check", action="store_true", help="Validate writer and directories only.")
    parser.add_argument("--agent")
    parser.add_argument("--scope")
    parser.add_argument("--done")
    parser.add_argument("--output")
    parser.add_argument("--validation")
    parser.add_argument("--blockers", default="none")
    parser.add_argument("--next-step")
    parser.add_argument("--visibility", choices=sorted(VALID_VISIBILITY), default="public")
    parser.add_argument("--status", choices=sorted(VALID_STATUS), default="active")
    parser.add_argument("--related-path", action="append", default=[])
    args = parser.parse_args()

    ensure_local_dirs()
    if args.check:
        sample = {
            "id": "check",
            "date": date.today().isoformat(),
            "agent": "check",
            "status": "active",
            "visibility": "public",
            "scope": "check",
            "done": "writer validation",
            "output": "none",
            "validation": "local schema check",
            "blockers": "none",
            "next_step": "none",
            "related_paths": [],
        }
        errors = validate_handoff(sample)
        if errors:
            print("Handoff writer check: FAIL")
            for error in errors:
                print(f"- {error}")
            return 1
        print("Handoff writer check: OK")
        return 0

    missing_args = [
        name
        for name, value in {
            "--agent": args.agent,
            "--scope": args.scope,
            "--done": args.done,
            "--output": args.output,
            "--validation": args.validation,
            "--next-step": args.next_step,
        }.items()
        if not value
    ]
    if missing_args:
        print(f"Missing required arguments: {', '.join(missing_args)}")
        return 1

    today = date.today()
    handoff_id = f"{today.isoformat()}-{slugify(args.agent)}-{slugify(args.scope)}"
    data = {
        "id": handoff_id,
        "date": today.isoformat(),
        "agent": args.agent,
        "status": args.status,
        "visibility": args.visibility,
        "scope": args.scope,
        "done": args.done,
        "output": args.output,
        "validation": args.validation,
        "blockers": args.blockers,
        "next_step": args.next_step,
        "related_paths": args.related_path,
    }
    errors = validate_handoff(data)
    if errors:
        print("Handoff validation: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    target_dir = output_dir(args.visibility, today)
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"{handoff_id}.md"
    target.write_text(render_markdown(data), encoding="utf-8")
    print(f"Handoff written: {target.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
