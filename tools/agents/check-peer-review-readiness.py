from __future__ import annotations

import csv
import sys
from pathlib import Path

from common import ROOT, configure_utf8_stdio


REQUIRED_PATHS = [
    "README.md",
    "CONTRIBUTING.md",
    "GOVERNANCE.md",
    "CODE_OF_CONDUCT.md",
    "AGENTS.md",
    "AI_MASTER_PROMPT.md",
    "CODEX.md",
    "CLAUDE.md",
    "ORQUESTRADOR.md",
    ".github/PULL_REQUEST_TEMPLATE.md",
    ".github/ISSUE_TEMPLATE/bug_report.yml",
    ".github/ISSUE_TEMPLATE/data_issue.yml",
    ".github/ISSUE_TEMPLATE/feature_request.yml",
    ".github/ISSUE_TEMPLATE/good_first_issue.yml",
    ".github/ISSUE_TEMPLATE/config.yml",
    "docs/revisao-pares-github.md",
    "docs/benchmark-publico.md",
    "docs/politica-publicacao-dados.md",
    "tasks.txt",
    "data/manifests/datasets.csv",
    "data/manifests/publication_classification.csv",
    "data/manifests/benchmark_targets.csv",
    "data/manifests/benchmark_http_latest.csv",
    "data/manifests/municipios_pipeline.csv",
    "memory/provenance/changes.csv",
    "memory/knowledge/problems.csv",
    "memory/knowledge/solutions.csv",
    "memory/token-economy/2026-05.md",
]

CSV_MIN_ROWS = {
    "data/manifests/datasets.csv": 1,
    "data/manifests/publication_classification.csv": 1,
    "data/manifests/benchmark_targets.csv": 1,
    "data/manifests/benchmark_http_latest.csv": 1,
    "data/manifests/municipios_pipeline.csv": 1,
    "memory/provenance/changes.csv": 1,
    "memory/knowledge/problems.csv": 1,
    "memory/knowledge/solutions.csv": 1,
}

TEXT_EXPECTATIONS = {
    ".github/PULL_REQUEST_TEMPLATE.md": [
        "Dados e fontes",
        "Validacao",
        "Proveniencia",
        "Nao publica score",
    ],
    "docs/revisao-pares-github.md": [
        "Checklist de PR",
        "Checklist de dados",
        "Checklist de frontend",
        "Checklist de agentes",
    ],
    "docs/benchmark-publico.md": [
        "Nao publicar nota",
        "evidencia armazenada",
    ],
    "tasks.txt": [
        "Benchmark como meta auditavel",
        "Validacao Maestro",
    ],
}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_csv_rows(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    errors: list[str] = []
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
    except Exception as exc:  # pragma: no cover - script diagnostics
        return [], [f"{rel(path)}: could not parse CSV: {exc}"]

    if not rows:
        errors.append(f"{rel(path)}: CSV has no rows")
    return rows, errors


def main() -> int:
    configure_utf8_stdio()
    errors: list[str] = []

    for item in REQUIRED_PATHS:
        path = ROOT / item
        if not path.exists():
            errors.append(f"missing required peer-review artifact: {item}")
        elif path.is_file() and path.stat().st_size == 0:
            errors.append(f"empty peer-review artifact: {item}")

    for item, minimum_rows in CSV_MIN_ROWS.items():
        path = ROOT / item
        if not path.exists():
            continue
        rows, csv_errors = read_csv_rows(path)
        errors.extend(csv_errors)
        if len(rows) < minimum_rows:
            errors.append(f"{item}: expected at least {minimum_rows} row(s), got {len(rows)}")

    for item, fragments in TEXT_EXPECTATIONS.items():
        path = ROOT / item
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for fragment in fragments:
            if fragment not in text:
                errors.append(f"{item}: missing expected review marker: {fragment}")

    if errors:
        print("Peer review readiness: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Peer review readiness: OK")
    print("- contribution, governance, conduct and PR template are present")
    print("- internal agent instructions and public review checklist are present")
    print("- data, benchmark, municipality and memory manifests are parseable")
    print("- benchmark policy requires measured evidence instead of simulated scores")
    return 0


if __name__ == "__main__":
    sys.exit(main())
