#!/usr/bin/env python3
"""Detecta páginas indexáveis que herdariam o canonical da home."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP_ROOT = ROOT / "apps" / "web" / "app"

OWN_METADATA_PATTERNS = (
    re.compile(r"\balternates\s*:"),
    re.compile(r"\bgenerateMetadata\b"),
    re.compile(r"export\s*\{\s*generateMetadata\s*\}"),
)
NOINDEX_PATTERN = re.compile(
    r"robots\s*:\s*\{[^}]*index\s*:\s*false",
    re.DOTALL,
)


@dataclass(frozen=True)
class Finding:
    route: str
    page: str
    reason: str


def route_for(page: Path, app_root: Path) -> str:
    relative = page.parent.relative_to(app_root)
    return "/" if relative == Path(".") else f"/{relative.as_posix()}"


def declares_metadata(text: str) -> bool:
    return any(pattern.search(text) for pattern in OWN_METADATA_PATTERNS)


def declares_noindex(text: str) -> bool:
    return bool(NOINDEX_PATTERN.search(text))


def metadata_sources(page: Path) -> list[Path]:
    sources = [page]
    layout = page.parent / "layout.tsx"
    if layout.is_file():
        sources.append(layout)
    return sources


def scan(app_root: Path = APP_ROOT) -> list[Finding]:
    findings: list[Finding] = []
    if not app_root.is_dir():
        return [Finding(route="/", page=str(app_root), reason="app root not found")]

    for page in sorted(app_root.rglob("page.tsx")):
        route = route_for(page, app_root)
        if route == "/":
            continue

        sources = metadata_sources(page)
        texts = [source.read_text(encoding="utf-8", errors="replace") for source in sources]
        if any(declares_noindex(text) for text in texts):
            continue
        if any(declares_metadata(text) for text in texts):
            continue

        findings.append(
            Finding(
                route=route,
                page=page.relative_to(ROOT).as_posix() if page.is_relative_to(ROOT) else str(page),
                reason="indexable page has no route-specific canonical or noindex metadata",
            )
        )
    return findings


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Verifica canonicals das rotas Next.js.")
    parser.add_argument("--app-root", type=Path, default=APP_ROOT)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    findings = scan(args.app_root)
    if args.json:
        print(json.dumps([asdict(item) for item in findings], ensure_ascii=False, indent=2))
    elif findings:
        print(f"Canonical routes: FAIL ({len(findings)} rota(s))")
        for item in findings:
            print(f"- {item.route}: {item.page} - {item.reason}")
    else:
        print("Canonical routes: OK")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
