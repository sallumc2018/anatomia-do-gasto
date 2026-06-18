"""Auditoria local para detectar mocks obvios em dados publicaveis.

Este script e um complemento de triagem. Ele nao substitui validacao de fonte,
manifesto e gates de publicacao.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIRS = [ROOT / "data" / "public", ROOT / "data" / "manifests"]

CPF_REPETIDO_RE = re.compile(r"(?<!\.)(?<!\d)\b([0-9])\1{10}\b")
MOCK_PATTERNS = [
    re.compile(r"\bmock\b", re.IGNORECASE),
    re.compile(r"\bplaceholder\b", re.IGNORECASE),
    re.compile(r"\bficticio\b", re.IGNORECASE),
    re.compile(r"\bficticio\b", re.IGNORECASE),
    re.compile(r"\b12345678900\b"),
    re.compile(r"\bempresa\s+teste\b", re.IGNORECASE),
    re.compile(r"\bfornecedor\s+teste\b", re.IGNORECASE),
    re.compile(r"\bnome\s+ficticio\b", re.IGNORECASE),
    re.compile(r"\bdado\s+ficticio\b", re.IGNORECASE),
    re.compile(r"(?:^|,)\s*[\"']?(?:teste|test)[\"']?\s*(?:,|$)", re.IGNORECASE),
]


def iter_data_files(target_dir: Path):
    if not target_dir.exists():
        return
    for path in target_dir.rglob("*"):
        parts = {part.lower() for part in path.parts}
        if {"test", "tests"} & parts:
            continue
        if path.suffix.lower() in {".csv", ".json", ".txt", ".tsv"}:
            yield path


def scan_file(path: Path) -> list[dict[str, str | int]]:
    violations: list[dict[str, str | int]] = []
    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        for line_num, line in enumerate(handle, 1):
            cpf_match = CPF_REPETIDO_RE.search(line)
            if cpf_match:
                violations.append(
                    {
                        "file": path.relative_to(ROOT).as_posix(),
                        "line": line_num,
                        "term": cpf_match.group(0),
                        "content": line.strip(),
                    }
                )
                continue

            for pattern in MOCK_PATTERNS:
                match = pattern.search(line)
                if match:
                    violations.append(
                        {
                            "file": path.relative_to(ROOT).as_posix(),
                            "line": line_num,
                            "term": match.group(0),
                            "content": line.strip(),
                        }
                    )
                    break
    return violations


def main() -> int:
    violations: list[dict[str, str | int]] = []
    for target_dir in DATA_DIRS:
        for path in iter_data_files(target_dir) or []:
            violations.extend(scan_file(path))

    if not violations:
        print("Nenhum mock obvio detectado em data/public ou data/manifests.")
        return 0

    print("Possiveis mocks ou dados ficticios detectados:")
    for violation in violations:
        print(
            f"- {violation['file']}:{violation['line']} "
            f"termo={violation['term']!r} conteudo={str(violation['content'])[:120]!r}"
        )
    return 1


if __name__ == "__main__":
    sys.exit(main())
