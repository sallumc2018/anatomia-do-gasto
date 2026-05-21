from __future__ import annotations

import argparse
import sys

from common import read_agents


def main() -> int:
    parser = argparse.ArgumentParser(description="List registered Anatomia do Gasto agents.")
    parser.add_argument("--name", help="Filter by agent name.")
    args = parser.parse_args()

    entries = read_agents()
    if args.name:
        entries = [entry for entry in entries if entry.name == args.name]
    if not entries:
        print("No agents found.")
        return 1

    for entry in entries:
        print(f"{entry.name} [{entry.type}]")
        print(f"  command: {entry.command_path}")
        print(f"  autonomy: {entry.autonomy}")
        print(f"  reads: {entry.read_paths}")
        print(f"  writes: {entry.write_paths}")
        print(f"  validation: {entry.validation_commands}")
        print(f"  gates: {entry.gates}")
        print(f"  handoff: {entry.handoff_visibility}")
        print(f"  risks: {entry.risks}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
