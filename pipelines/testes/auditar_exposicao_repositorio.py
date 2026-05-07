"""
Audita a exposicao do repositorio segundo a politica de publicacao de dados.

Uso:
    python pipelines/testes/auditar_exposicao_repositorio.py
    python pipelines/testes/auditar_exposicao_repositorio.py --strict

Modo padrao:
- imprime um relatorio;
- sai com codigo 0, mesmo havendo exposicao fora da politica.

Modo --strict:
- falha se encontrar arquivos versionados fora das camadas publicas por padrao.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PUBLIC_PREFIXES = (
    "apps/",
    "docs/",
    "pipelines/",
    "tools/",
    "data/public/",
    "data/manifests/",
    ".claude/",
    "README.md",
    "AI_MASTER_PROMPT.md",
    "CODEX.md",
    "CLAUDE.md",
    "ORQUESTRADOR.md",
    ".gitignore",
    "requirements.txt",
    "package.json",
)
RESTRICTED_PREFIXES = (
    "data/raw/",
    "data/extracted/",
    "data/validated/",
)


def git_ls_files() -> list[str]:
    proc = subprocess.run(
        ["git", "ls-files"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return [line.strip().replace("\\", "/") for line in proc.stdout.splitlines() if line.strip()]


def classify(paths: list[str]) -> tuple[list[str], list[str], list[str]]:
    public = []
    restricted = []
    other = []
    for path in paths:
        if path.startswith(RESTRICTED_PREFIXES):
            restricted.append(path)
        elif (
            path.startswith(PUBLIC_PREFIXES)
            or path in PUBLIC_PREFIXES
            or "/" not in path and (path.endswith(".md") or path in {"LICENSE", ".gitattributes"})
        ):
            public.append(path)
        else:
            other.append(path)
    return public, restricted, other


def summarize_by_prefix(paths: list[str]) -> dict[str, int]:
    summary: dict[str, int] = {}
    for path in paths:
        if "/" in path:
            prefix = path.split("/", 2)
            key = "/".join(prefix[:2]) if len(prefix) > 1 else prefix[0]
        else:
            key = path
        summary[key] = summary.get(key, 0) + 1
    return dict(sorted(summary.items(), key=lambda item: (-item[1], item[0])))


def print_group(title: str, paths: list[str], limit: int = 20) -> None:
    print(f"\n{title}: {len(paths)}")
    for path in paths[:limit]:
        print(f"  - {path}")
    if len(paths) > limit:
        print(f"  ... +{len(paths) - limit} restantes")


def main() -> int:
    parser = argparse.ArgumentParser(description="Audita exposicao do repositorio")
    parser.add_argument("--strict", action="store_true", help="falha se encontrar camadas restritas versionadas")
    args = parser.parse_args()

    tracked = git_ls_files()
    public, restricted, other = classify(tracked)

    print("Auditoria de exposicao do repositorio")
    print(f"Arquivos rastreados: {len(tracked)}")
    print(f"Publicos por padrao: {len(public)}")
    print(f"Restritos por padrao: {len(restricted)}")
    print(f"Fora da classificacao: {len(other)}")

    if restricted:
        print_group("Arquivos em camadas restritas", restricted)
        print("\nResumo por prefixo restrito:")
        for prefix, count in summarize_by_prefix(restricted).items():
            print(f"  - {prefix}: {count}")

    if other:
        print_group("Arquivos fora da classificacao", other)

    if args.strict and (restricted or other):
        print("\nFALHA: repositorio ainda expoe arquivos fora da politica publica por padrao.")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
