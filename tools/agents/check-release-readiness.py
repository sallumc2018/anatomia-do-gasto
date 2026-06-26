#!/usr/bin/env python3
"""Gate local para push/deploy com ownership explicito."""

from __future__ import annotations

import argparse
import subprocess
import sys

from common import ROOT, configure_utf8_stdio


def git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
    )


def print_output(result: subprocess.CompletedProcess[str]) -> None:
    output = (result.stdout or result.stderr).strip()
    if output:
        print(output)


def ensure_clean() -> bool:
    result = git("status", "--porcelain")
    if result.returncode != 0:
        print_output(result)
        return False
    if result.stdout.strip():
        print("[BLOCK] working tree nao esta limpo:")
        print(result.stdout.rstrip())
        return False
    return True


def ahead_behind() -> tuple[int, int] | None:
    result = git("rev-list", "--left-right", "--count", "origin/main...HEAD")
    if result.returncode != 0:
        print("[BLOCK] nao foi possivel comparar com origin/main.")
        print_output(result)
        return None
    left, right = result.stdout.strip().split()
    return int(left), int(right)


def local_commits() -> list[str]:
    result = git("log", "--oneline", "origin/main..HEAD")
    if result.returncode != 0:
        return []
    return [line for line in result.stdout.splitlines() if line.strip()]


def run_gate(*args: str) -> bool:
    result = subprocess.run(
        [sys.executable, *args],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    return result.returncode == 0


def main(argv: list[str] | None = None) -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(description="Verifica prontidao para push/deploy.")
    parser.add_argument("--stage", choices=("push", "deploy"), required=True)
    parser.add_argument(
        "--allow-no-local-commits",
        action="store_true",
        help="permite deploy quando HEAD ja esta alinhado com origin/main",
    )
    args = parser.parse_args(argv)

    ok = True
    ok = ensure_clean() and ok

    comparison = ahead_behind()
    if comparison is None:
        ok = False
        ahead = 0
    else:
        behind, ahead = comparison
        if behind:
            print(f"[BLOCK] branch esta {behind} commit(s) atras de origin/main.")
            ok = False
        if args.stage == "push" and ahead == 0:
            print("[BLOCK] nao ha commits locais para push.")
            ok = False
        if args.stage == "deploy" and ahead:
            print(f"[BLOCK] ha {ahead} commit(s) local(is) ainda nao pushados.")
            ok = False

    commits = local_commits()
    if commits:
        print("Commits locais pendentes:")
        for item in commits:
            print(f"- {item}")
    elif args.stage == "deploy" and args.allow_no_local_commits:
        print("Commits locais pendentes: nenhum; HEAD alinhado com origin/main.")

    if not run_gate("tools/agents/check-commit-gate.py", "--full", "--no-warn"):
        ok = False
    if not run_gate("tools/agents/check-scope-gates.py"):
        ok = False

    if ok:
        print(f"Release readiness: OK ({args.stage})")
        return 0
    print(f"Release readiness: FAIL ({args.stage})")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
