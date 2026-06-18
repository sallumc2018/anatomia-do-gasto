"""
QA estrutural dos CSVs publicados em data/public/sorocaba/.

Verifica cada CSV: parseável, tem header, tem dados, sem colunas 100% vazias,
campos monetários/anuais com fill rate razoável.

Uso:
    .venv/bin/python3 tools/data/qa_public_sorocaba.py
    .venv/bin/python3 tools/data/qa_public_sorocaba.py --strict   # exit 1 se houver fail
    .venv/bin/python3 tools/data/qa_public_sorocaba.py --area camara
    .venv/bin/python3 tools/data/qa_public_sorocaba.py --json
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC_ROOT = ROOT / "data" / "public" / "sorocaba"

# Colunas que, se presentes, devem ter fill rate >= threshold
CRITICAL_FILL: dict[str, float] = {
    "ano":       0.90,
    "valor":     0.80,
    "municipio": 0.80,
    "cnpj":      0.60,
}

MIN_ROWS = 1
# Arquivos pequenos por design (sumários, metadados)
SMALL_FILE_OK = {
    "empresas_municipais_tce_2020_2025.csv",
    "empresas_municipais_tce_2020_2026.csv",
    "funserv_rpps_sorocaba.csv",
    "camara_documentos_orcamentarios_sorocaba_2017_2027.csv",
    "subsidios_camara_sorocaba_2017.csv",
    "subsidios_camara_sorocaba_2019.csv",
    "subsidios_camara_sorocaba_2022.csv",
}
# Padrões de nome onde fill rate baixo é esperado — rebaixar fail → warn
# _ocr_indice_: índice de extração OCR, campos nem sempre extraídos
# inventario_: catálogo de arquivos, campos opcionais
# instrumentos_: convenios/transferências, muitos campos vazios por design
# pncp_*_2022_2026: PNCP consolidado mistura compras/atas (sem valor) + contratos
# fnde_repasses_: repasses do FNDE podem conter placeholders "sem_dados" por design
SPARSE_OK_PATTERNS = (
    "_ocr_indice_",
    "inventario_",
    "instrumentos_",
    "pncp_sorocaba_2022_2026",
    "fnde_repasses_",
)


@dataclass
class FileResult:
    path: str
    area: str
    rows: int | None
    cols: int | None
    status: str        # ok | warn | fail
    issues: list[str]
    notes: list[str]


def fill_rate(rows: list[dict], col: str) -> float:
    if not rows:
        return 0.0
    filled = sum(1 for r in rows if (r.get(col) or "").strip())
    return filled / len(rows)


def qa_csv(path: Path) -> FileResult:
    rel = path.relative_to(ROOT).as_posix()
    # derive area from path: data/public/sorocaba/<area>/...
    parts = path.relative_to(PUBLIC_ROOT).parts
    area = parts[0] if parts else "unknown"

    issues: list[str] = []
    notes: list[str] = []

    try:
        with path.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            fieldnames = list(reader.fieldnames or [])
            rows = list(reader)
    except Exception as exc:
        return FileResult(rel, area, None, None, "fail",
                          [f"parse_error:{type(exc).__name__}:{exc}"], [])

    if not fieldnames:
        issues.append("missing_header")
    if not rows:
        if path.name not in SMALL_FILE_OK:
            issues.append("no_data_rows")

    # Duplicate columns
    seen: dict[str, int] = {}
    for col in fieldnames:
        seen[col] = seen.get(col, 0) + 1
    dupes = [c for c, n in seen.items() if n > 1]
    if dupes:
        issues.append(f"duplicate_cols:{','.join(dupes)}")

    if rows and fieldnames:
        # Dead columns (100% empty)
        dead = [c for c in fieldnames
                if all(not (r.get(c) or "").strip() for r in rows)]
        if dead:
            notes.append(f"dead_cols:{','.join(dead[:6])}")

        # Critical fill rate checks
        for col_key, threshold in CRITICAL_FILL.items():
            matches = [c for c in fieldnames if col_key in c.lower()]
            for col in matches:
                fr = fill_rate(rows, col)
                if fr < threshold:
                    issues.append(f"low_fill:{col}:{fr:.2f}<{threshold}")

        notes.append(f"rows:{len(rows)}")
        notes.append(f"cols:{len(fieldnames)}")

    # Files with known-sparse fields: downgrade low_fill from fail → warn
    is_sparse_ok = any(pat in path.name for pat in SPARSE_OK_PATTERNS)
    hard_issues = [i for i in issues
                   if i.startswith(("parse_error", "missing_header", "no_data_rows", "duplicate_cols"))
                   or (i.startswith("low_fill") and not is_sparse_ok)]
    status = "fail" if hard_issues else "warn" if issues else "ok"

    return FileResult(rel, area, len(rows) if rows is not None else None,
                      len(fieldnames), status, issues, notes)


def scan(area_filter: str | None = None) -> list[FileResult]:
    results = []
    paths = sorted(PUBLIC_ROOT.rglob("*.csv"))
    for path in paths:
        parts = path.relative_to(PUBLIC_ROOT).parts
        area = parts[0] if parts else "unknown"
        if area_filter and area != area_filter:
            continue
        results.append(qa_csv(path))
    return results


def summarize(results: list[FileResult]) -> dict:
    from collections import Counter
    by_area: dict[str, Counter] = {}
    for r in results:
        by_area.setdefault(r.area, Counter())[r.status] += 1
    total: Counter = Counter()
    for c in by_area.values():
        total.update(c)
    return {
        "total": dict(total),
        "by_area": {area: dict(c) for area, c in sorted(by_area.items())},
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true",
                        help="Exit 1 se houver qualquer fail")
    parser.add_argument("--area", default=None,
                        help="Filtrar por área (ex: camara, fiscal)")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    results = scan(args.area)
    summary = summarize(results)
    flagged = [r for r in results if r.status != "ok"]

    if args.json:
        print(json.dumps({
            "summary": summary,
            "flagged": [asdict(r) for r in flagged],
        }, ensure_ascii=False, indent=2))
        return 1 if (args.strict and any(r.status == "fail" for r in results)) else 0

    total = summary["total"]
    print(f"qa_public_sorocaba: {len(results)} arquivos — "
          f"ok={total.get('ok', 0)} warn={total.get('warn', 0)} fail={total.get('fail', 0)}")
    print()

    if flagged:
        print("Problemas encontrados:")
        for r in flagged:
            print(f"  [{r.status}] {r.path}")
            for issue in r.issues:
                print(f"    ! {issue}")
            for note in r.notes:
                print(f"    · {note}")
    else:
        print("Nenhum problema encontrado.")

    if args.strict and any(r.status == "fail" for r in results):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
