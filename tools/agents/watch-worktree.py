from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from common import LOCAL_AGENT_DIR, LOCAL_RUN_DIR, ROOT, configure_utf8_stdio, ensure_local_agent_dirs


STATE_PATH = LOCAL_AGENT_DIR / "worktree-watch-state.json"
CURRENT_PATH = LOCAL_AGENT_DIR / "worktree-watch-current.json"
LOG_PATH = LOCAL_RUN_DIR / "worktree-watch.jsonl"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def run_git_status() -> list[str]:
    completed = subprocess.run(
        ["git", "status", "--porcelain=v1", "-uall"],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or "git status failed")
    return sorted(line for line in completed.stdout.splitlines() if line.strip())


def parse_path(line: str) -> str:
    if len(line) < 4:
        return line.strip()
    value = line[3:].strip()
    if " -> " in value:
        value = value.split(" -> ", 1)[1].strip()
    return value.replace("\\", "/")


def classify(path: str) -> str:
    if path.startswith("apps/web/"):
        return "frontend"
    if path.startswith("tools/tablet/") or path == "docs/ambiente.md":
        return "tablet"
    if path.startswith("data/public/"):
        return "publication"
    if path.startswith(("data/raw/", "data/extracted/", "data/validated/")):
        return "internal-data"
    if path.startswith(("tools/agents/", "tools/memory/", "memory/", ".claude/commands/")):
        return "agents-memory"
    if path in {"AI_MASTER_PROMPT.md", "CODEX.md", "CLAUDE.md", "ORQUESTRADOR.md", "AGENTS.md"}:
        return "agents-memory"
    if path.startswith("docs/"):
        return "docs"
    return "other"


def summarize(lines: list[str]) -> dict:
    paths = [parse_path(line) for line in lines]
    scopes: dict[str, int] = {}
    for path in paths:
        scope = classify(path)
        scopes[scope] = scopes.get(scope, 0) + 1
    return {
        "count": len(lines),
        "scopes": dict(sorted(scopes.items())),
        "paths": paths,
    }


def read_state() -> dict:
    if not STATE_PATH.exists():
        return {"lines": []}
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"lines": []}


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def append_log(event: dict) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, ensure_ascii=False) + "\n")


def build_event(lines: list[str], previous_lines: list[str], source_label: str) -> dict:
    current_set = set(lines)
    previous_set = set(previous_lines)
    added = sorted(current_set.difference(previous_set))
    removed = sorted(previous_set.difference(current_set))
    summary = summarize(lines)
    return {
        "timestamp": utc_now(),
        "source_label": source_label,
        "event": "worktree_changed",
        "summary": summary,
        "added": [{"status": line[:2], "path": parse_path(line), "scope": classify(parse_path(line))} for line in added],
        "removed": [{"status": line[:2], "path": parse_path(line), "scope": classify(parse_path(line))} for line in removed],
        "recommended_action": recommend(summary),
    }


def recommend(summary: dict) -> str:
    scopes = set(summary["scopes"])
    if "internal-data" in scopes or "publication" in scopes:
        return "pause and inspect data/publication gates before any action"
    if len(scopes) > 1:
        return "separate changes by scope before editing or committing"
    if "frontend" in scopes:
        return "route to frontend/vitruvio only after checking target paths"
    if "agents-memory" in scopes:
        return "route to maestro/agents validation"
    if "tablet" in scopes:
        return "route to tablet; destructive actions require approval"
    return "inspect changed paths before routing"


def print_event(event: dict, bell: bool) -> None:
    if bell:
        print("\a", end="")
    summary = event["summary"]
    print(f"[{event['timestamp']}] {event['event']} source={event['source_label']}")
    print(f"- files: {summary['count']}")
    print(f"- scopes: {summary['scopes']}")
    print(f"- action: {event['recommended_action']}")
    if event["added"]:
        print("- new/changed:")
        for item in event["added"][:12]:
            print(f"  {item['status']} {item['scope']} {item['path']}")
        if len(event["added"]) > 12:
            print(f"  ... +{len(event['added']) - 12} more")
    print("", flush=True)


def current_payload(lines: list[str], source_label: str) -> dict:
    summary = summarize(lines)
    return {
        "updated_at": utc_now(),
        "source_label": source_label,
        "summary": summary,
        "recommended_action": recommend(summary),
    }


def write_state(lines: list[str], source_label: str, mirror_path: Path | None = None) -> None:
    write_json(
        STATE_PATH,
        {
            "updated_at": utc_now(),
            "source_label": source_label,
            "lines": lines,
            "summary": summarize(lines),
        },
    )
    payload = current_payload(lines, source_label)
    write_json(CURRENT_PATH, payload)
    if mirror_path is not None:
        write_json(mirror_path, payload)


def run_once(args: argparse.Namespace) -> int:
    ensure_local_agent_dirs()
    previous = read_state().get("lines", [])
    lines = run_git_status()
    event = build_event(lines, previous, args.source_label)
    mirror_path = Path(args.mirror_path) if args.mirror_path else None
    write_state(lines, args.source_label, mirror_path)
    append_log(event)
    print_event(event, args.bell)
    return 0


def run_watch(args: argparse.Namespace) -> int:
    ensure_local_agent_dirs()
    mirror_path = Path(args.mirror_path) if args.mirror_path else None
    previous = read_state().get("lines", [])
    if args.baseline or not STATE_PATH.exists():
        previous = run_git_status()
        write_state(previous, args.source_label, mirror_path)
        print(f"Baseline written: {CURRENT_PATH.relative_to(ROOT).as_posix()}")
        if mirror_path is not None:
            print(f"Mirror written: {mirror_path}")
    print(f"Watching worktree every {args.interval}s. Press Ctrl+C to stop.")
    try:
        while True:
            lines = run_git_status()
            if lines != previous:
                event = build_event(lines, previous, args.source_label)
                write_state(lines, args.source_label, mirror_path)
                append_log(event)
                print_event(event, args.bell)
                previous = lines
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("Stopped.")
        return 0


def print_status() -> int:
    if not CURRENT_PATH.exists():
        print("No worktree watch status yet.")
        return 1
    print(CURRENT_PATH.read_text(encoding="utf-8").strip())
    return 0


def main() -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(description="Watch the git worktree and report external changes.")
    parser.add_argument("--once", action="store_true", help="Record and print one event.")
    parser.add_argument("--status", action="store_true", help="Print latest summary.")
    parser.add_argument("--baseline", action="store_true", help="Set current status as baseline before watching.")
    parser.add_argument("--interval", type=float, default=5.0, help="Polling interval in seconds.")
    parser.add_argument("--source-label", default="unknown", help="Expected external source label, e.g. Antigravity/Gemini.")
    parser.add_argument("--mirror-path", default="", help="Optional JSON path to mirror the current summary for dashboards.")
    parser.add_argument("--bell", action="store_true", help="Emit terminal bell on change.")
    args = parser.parse_args()

    if args.status:
        return print_status()
    if args.once:
        return run_once(args)
    return run_watch(args)


if __name__ == "__main__":
    sys.exit(main())
