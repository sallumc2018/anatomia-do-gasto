from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

from common import ROOT, configure_utf8_stdio


FRONTEND_ROOT = ROOT / "apps" / "web"
MANIFEST = ROOT / "data" / "manifests" / "datasets.csv"
PUBLIC_SOROCABA = ROOT / "data" / "public" / "sorocaba"

TEXT_EXTENSIONS = {
    ".css",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".mjs",
    ".py",
    ".ts",
    ".tsx",
}
IGNORED_PARTS = {"node_modules", ".next", ".turbo", "coverage"}
FORBIDDEN_FRONTEND_REFERENCES = (
    "data/raw",
    "data/extracted",
    "data/validated",
)
RISKY_AUTOMATION_COMMANDS = (
    "git " + "commit",
    "git " + "push",
    "vercel " + "deploy",
    "npm " + "install",
    "npm " + "update",
    "npm audit " + "fix",
    "np" + "x ",
)


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def iter_text_files(root: Path) -> list[Path]:
    if not root.exists():
        return []
    files: list[Path] = []
    for path in root.rglob("*"):
        if path.is_dir():
            continue
        if IGNORED_PARTS.intersection(path.parts):
            continue
        if path.suffix.lower() in TEXT_EXTENSIONS:
            files.append(path)
    return sorted(files)


def scan_frontend_references() -> list[str]:
    errors: list[str] = []
    for path in iter_text_files(FRONTEND_ROOT):
        text = path.read_text(encoding="utf-8", errors="replace")
        for line_number, line in enumerate(text.splitlines(), start=1):
            normalized = line.lower().replace("\\", "/")
            for forbidden in FORBIDDEN_FRONTEND_REFERENCES:
                if forbidden in normalized:
                    errors.append(f"{rel(path)}:{line_number}: frontend references {forbidden}")
    return errors


def pattern_to_regex(pattern: str) -> re.Pattern[str]:
    escaped = re.escape(pattern).replace(r"\{ano\}", r"\d{4}")
    return re.compile(f"^{escaped}$")


def years_from_manifest(value: str) -> list[int]:
    try:
        start, end = (int(part) for part in value.split("-", 1))
    except ValueError:
        return []
    return list(range(start, end + 1))


def area_path(area: str) -> Path:
    return Path(*[part for part in area.split("/") if part])


def scan_unpublishable_public_files() -> list[str]:
    errors: list[str] = []
    if not MANIFEST.exists():
        return [f"manifest missing: {rel(MANIFEST)}"]

    with MANIFEST.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            origem = (row.get("Origem_Dir") or "public").strip()
            if origem in {"public", "public_aux"}:
                continue
            area = (row.get("Area") or "").strip()
            pattern = (row.get("Arquivo_Padrao") or "").strip()
            years = years_from_manifest((row.get("Anos") or "").strip())
            for year in years:
                filename = pattern.replace("{ano}", str(year))
                target = PUBLIC_SOROCABA / area_path(area) / "saida" / filename
                if target.exists():
                    errors.append(f"{rel(target)} exists but Origem_Dir={origem}")

    return errors


def scan_risky_local_automations() -> list[str]:
    errors: list[str] = []
    for root in (ROOT / "tools" / "agents", ROOT / "tools" / "memory"):
        for path in iter_text_files(root):
            text = path.read_text(encoding="utf-8", errors="replace")
            for line_number, line in enumerate(text.splitlines(), start=1):
                lower = line.lower()
                if "forbidden_actions" in lower or "risky_automation_commands" in lower:
                    continue
                for risky in RISKY_AUTOMATION_COMMANDS:
                    if risky in lower:
                        errors.append(f"{rel(path)}:{line_number}: risky automation command: {risky.strip()}")
    return errors


def main() -> int:
    configure_utf8_stdio()
    errors: list[str] = []
    errors.extend(scan_frontend_references())
    errors.extend(scan_unpublishable_public_files())
    errors.extend(scan_risky_local_automations())

    if errors:
        print("Scope gates: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Scope gates: OK")
    print("- frontend does not reference data/raw, data/extracted or data/validated")
    print("- manifest rows marked extracted/validated are not present in data/public")
    print("- local agent/memory automations do not contain release or package-install commands")
    return 0


if __name__ == "__main__":
    sys.exit(main())
