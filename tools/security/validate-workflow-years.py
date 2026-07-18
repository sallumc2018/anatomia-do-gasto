#!/usr/bin/env python3
"""Validate the year list accepted by manual GitHub Actions workflows."""

from __future__ import annotations

import argparse
import re
import sys

YEAR_LIST = re.compile(r"[0-9]{4}( [0-9]{4})*")
MAX_INPUT_LENGTH = 128


def validate_years(value: str, default: str) -> str:
    candidate = value if value else default
    if len(candidate) > MAX_INPUT_LENGTH or YEAR_LIST.fullmatch(candidate) is None:
        raise ValueError(
            "invalid year list: use four-digit years separated by one space"
        )
    return candidate


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("value", nargs="?", default="")
    parser.add_argument("--default", required=True)
    args = parser.parse_args()

    try:
        print(validate_years(args.value, args.default))
    except ValueError as exc:
        print(f"::error::{exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
