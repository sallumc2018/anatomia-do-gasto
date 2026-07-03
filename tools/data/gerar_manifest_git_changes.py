#!/usr/bin/env python3
"""Gera manifest CSV dos arquivos alterados no Git.

Uso principal: auditar dados publicos antes de commit/push, sem depender de
saida longa de `git status`.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=True,
        capture_output=True,
        text=True,
    )
    return Path(result.stdout.strip())


def git_status(root: Path) -> list[tuple[str, str]]:
    result = subprocess.run(
        ["git", "status", "--porcelain=v1", "-z", "--untracked-files=all"],
        cwd=root,
        check=True,
        capture_output=True,
    )
    entries: list[tuple[str, str]] = []
    parts = [part for part in result.stdout.split(b"\0") if part]
    i = 0
    while i < len(parts):
        raw = parts[i].decode("utf-8", errors="replace")
        status = raw[:2]
        path = raw[3:]
        if status.startswith("R") or status.startswith("C"):
            i += 1
            if i < len(parts):
                path = parts[i].decode("utf-8", errors="replace")
        entries.append((status.strip(), path))
        i += 1
    return entries


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prefix", action="append", default=[], help="Prefixo relativo a incluir.")
    parser.add_argument("--output", required=True, help="CSV de saida relativo ao repo ou absoluto.")
    args = parser.parse_args()

    root = repo_root()
    prefixes = tuple(prefix.rstrip("/") + "/" for prefix in args.prefix)
    output = Path(args.output)
    if not output.is_absolute():
        output = root / output
    output.parent.mkdir(parents=True, exist_ok=True)

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    rows = []
    for status, relpath in git_status(root):
        if prefixes and not relpath.startswith(prefixes):
            continue
        fullpath = root / relpath
        exists = fullpath.exists()
        rows.append(
            {
                "generated_at_utc": generated_at,
                "status": status,
                "path": relpath,
                "exists": "yes" if exists else "no",
                "size_bytes": fullpath.stat().st_size if exists and fullpath.is_file() else "",
                "sha256": sha256_file(fullpath) if exists and fullpath.is_file() else "",
            }
        )

    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["generated_at_utc", "status", "path", "exists", "size_bytes", "sha256"],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"manifest={output}")
    print(f"rows={len(rows)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
