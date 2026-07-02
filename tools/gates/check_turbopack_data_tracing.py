#!/usr/bin/env python3
"""Gate contra regressao de tracing amplo de data/public no Next/Turbopack."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB_ROOT = ROOT / "apps" / "web"
SOURCE_ROOTS = (
    WEB_ROOT / "app",
    WEB_ROOT / "lib",
    WEB_ROOT / "components",
)
NEXT_CONFIG = WEB_ROOT / "next.config.ts"

API_DADOS_INCLUDE_RE = re.compile(
    r"outputFileTracingIncludes\s*:\s*\{.*?"
    r"[\"']/api/dados/\[\.\.\.slug\][\"']\s*:\s*\[[^\]]*?"
    r"[\"']\.\./\.\./data/public/\*\*/\*[\"']",
    re.DOTALL,
)


@dataclass(frozen=True)
class Finding:
    path: str
    line: int
    reason: str


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix() if path.is_relative_to(ROOT) else str(path)


def iter_source_files(roots: tuple[Path, ...] = SOURCE_ROOTS) -> list[Path]:
    files: list[Path] = []
    for root in roots:
        if not root.exists():
            continue
        files.extend(
            path
            for path in root.rglob("*")
            if path.suffix in {".ts", ".tsx"} and path.is_file()
        )
    return sorted(files)


def has_nearby_turbopack_ignore(lines: list[str], index: int) -> bool:
    start = max(0, index - 2)
    end = min(len(lines), index + 2)
    return any("turbopackIgnore" in line for line in lines[start:end])


def scan_source(path: Path) -> list[Finding]:
    findings: list[Finding] = []
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    for index, line in enumerate(lines):
        line_number = index + 1
        if "process.cwd()" in line and not has_nearby_turbopack_ignore(lines, index):
            findings.append(
                Finding(
                    path=relative(path),
                    line=line_number,
                    reason="process.cwd() em arquivo server-side sem /*turbopackIgnore: true*/ proximo",
                )
            )
        if re.search(r"path\.resolve\(\s*DATA_ROOT\s*\)", line):
            findings.append(
                Finding(
                    path=relative(path),
                    line=line_number,
                    reason="path.resolve(DATA_ROOT) reabre tracing amplo; normalize o root fora do resolved dinamico",
                )
            )
    return findings


def scan_next_config(path: Path = NEXT_CONFIG) -> list[Finding]:
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8", errors="replace")
    if not API_DADOS_INCLUDE_RE.search(text):
        return []
    line = text[: API_DADOS_INCLUDE_RE.search(text).start()].count("\n") + 1
    return [
        Finding(
            path=relative(path),
            line=line,
            reason="outputFileTracingIncludes de /api/dados/[...slug] nao pode incluir ../../data/public/**/*",
        )
    ]


def scan() -> list[Finding]:
    findings: list[Finding] = []
    for path in iter_source_files():
        findings.extend(scan_source(path))
    findings.extend(scan_next_config())
    return findings


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Verifica regressao de tracing Turbopack.")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    findings = scan()
    if args.json:
        print(json.dumps([asdict(item) for item in findings], ensure_ascii=False, indent=2))
    elif findings:
        print(f"Turbopack data tracing: FAIL ({len(findings)} achado(s))")
        for item in findings:
            print(f"- {item.path}:{item.line} - {item.reason}")
    else:
        print("Turbopack data tracing: OK")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
