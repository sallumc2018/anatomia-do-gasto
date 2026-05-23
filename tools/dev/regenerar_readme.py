#!/usr/bin/env python3
"""
Regenerate README sections marked with AUTO tags from authoritative sources.
Supports --check mode for CI/CD validation (exits with 1 if outdated).
"""

import os
import re
import sys
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, Tuple

ROOT = Path(__file__).resolve().parents[2]

def read_municipios() -> Dict[str, dict]:
    """Read MUNICIPIOS registry from paths.py."""
    paths_py = ROOT / "pipelines" / "paths.py"
    if not paths_py.exists():
        return {}

    content = paths_py.read_text(encoding="utf-8")
    municipios = {}

    in_dict = False
    for line in content.split("\n"):
        if "MUNICIPIOS = {" in line:
            in_dict = True
        elif in_dict and line.strip().startswith("}"):
            break
        elif in_dict and ":" in line and "{" in line:
            match = re.search(r'"(\w+)":\s*{([^}]+)}', line)
            if match:
                slug = match.group(1)
                content_dict = match.group(2)
                ibge = re.search(r'"ibge":\s*"(\d+)"', content_dict)
                uf = re.search(r'"uf":\s*"(\w+)"', content_dict)
                nome = re.search(r'"nome":\s*"([^"]+)"', content_dict)
                if ibge and uf and nome:
                    municipios[slug] = {
                        "ibge": ibge.group(1),
                        "uf": uf.group(1),
                        "nome": nome.group(1)
                    }

    return municipios

def read_datasets_csv() -> Tuple[int, int]:
    """Count public and validated datasets from datasets.csv."""
    csv_file = ROOT / "data" / "manifests" / "datasets.csv"
    if not csv_file.exists():
        return 0, 0

    content = csv_file.read_text(encoding="utf-8")
    lines = [l for l in content.split("\n") if l.strip() and not l.startswith("municipio")]

    public = 0
    validated = 0
    for line in lines:
        parts = line.split(",")
        if len(parts) >= 10:
            origem = parts[-1].strip().lower()
            if origem == "public":
                public += 1
            elif origem == "validated":
                validated += 1

    return public, validated

def get_last_commit_date() -> str:
    """Get the date of the last commit."""
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%cd", "--date=short"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return ""

def get_last_commits(n: int = 5) -> str:
    """Get last N commits as formatted list."""
    try:
        result = subprocess.run(
            ["git", "log", f"-{n}", "--oneline"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split("\n")
            return "\n".join(f"- {line}" for line in lines if line.strip())
    except Exception:
        pass
    return ""

def generate_coverage_section() -> str:
    """Generate coverage summary section."""
    municipios = read_municipios()
    public, validated = read_datasets_csv()

    lines = [
        "**Cobertura atual:**",
        "",
        f"- **Cidades:** {', '.join(municipios[k]['nome'] for k in sorted(municipios.keys()))}",
        f"- **Datasets publicados:** {public}",
        f"- **Datasets em validação:** {validated}",
        f"- **Atualizado em:** {get_last_commit_date()}",
    ]

    return "\n".join(lines)

def generate_activity_section() -> str:
    """Generate recent activity section."""
    commits = get_last_commits(10)
    lines = [
        "**Atividade recente:**",
        "",
        commits if commits else "Nenhum commit encontrado.",
    ]
    return "\n".join(lines)

def update_readme(filepath: Path) -> bool:
    """
    Update AUTO sections in a README file.
    Returns True if file was modified, False otherwise.
    """
    if not filepath.exists():
        return False

    original = filepath.read_text(encoding="utf-8")
    content = original

    auto_pattern = re.compile(
        r"(<!-- AUTO:(\w+)-start -->)(.*?)(<!-- AUTO:\2-end -->)",
        re.DOTALL
    )

    modified = False
    for match in auto_pattern.finditer(original):
        tag_name = match.group(2)
        start_tag = match.group(1)
        end_tag = match.group(4)

        new_body = ""
        if tag_name == "coverage":
            new_body = generate_coverage_section()
        elif tag_name == "activity":
            new_body = generate_activity_section()

        if new_body:
            old_section = match.group(0)
            new_section = f"{start_tag}\n{new_body}\n{end_tag}"
            if old_section != new_section:
                content = content.replace(old_section, new_section, 1)
                modified = True

    if modified:
        filepath.write_text(content, encoding="utf-8")

    return modified

def process_readmes(check_mode: bool = False) -> bool:
    """
    Process all README files with AUTO sections.
    Returns True if any changes were made (or would be made in check mode).
    """
    readme_files = [
        ROOT / "README.md",
        ROOT / "apps" / "web" / "README.md",
        ROOT / "data" / "manifests" / "README.md",
        ROOT / "docs" / "auditoria" / "README.md",
        ROOT / "tools" / "dev" / "README.md",
    ]

    any_modified = False
    for readme in readme_files:
        if readme.exists():
            modified = update_readme(readme)
            if modified:
                status = "WOULD UPDATE" if check_mode else "UPDATED"
                print(f"{status}: {readme.relative_to(ROOT)}")
                any_modified = True

    return any_modified

def main():
    """Main entry point."""
    check_mode = "--check" in sys.argv

    if check_mode:
        modified = process_readmes(check_mode=True)
        if modified:
            print("\n[ERROR] README sections are out of date. Run regenerar_readme.py to update.")
            sys.exit(1)
        else:
            print("[OK] All README sections are up to date.")
            sys.exit(0)
    else:
        modified = process_readmes(check_mode=False)
        if modified:
            print("\n[OK] README sections updated successfully.")
        else:
            print("[INFO] No updates needed.")
        sys.exit(0)

if __name__ == "__main__":
    main()
