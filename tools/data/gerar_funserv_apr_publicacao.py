from __future__ import annotations

import argparse
import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
EXTRACTED = ROOT / "data" / "extracted" / "sorocaba" / "funserv" / "funserv_apr_sorocaba_2020_2026.csv"
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "autarquias" / "funserv" / "saida" / "funserv_apr_sorocaba_2020_2026.csv"

PUBLIC_COLUMNS = ["ano", "mes", "tipo_operacao", "valor_brl", "data_apr", "fonte"]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=PUBLIC_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows({column: row.get(column, "") for column in PUBLIC_COLUMNS} for row in rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate sanitized public FUNSERV APR data from extracted APR rows.")
    parser.add_argument("--write-public", action="store_true", help="Write sanitized APR data to data/public.")
    args = parser.parse_args()

    if not EXTRACTED.exists():
        print(f"missing extracted APR: {EXTRACTED.relative_to(ROOT).as_posix()}")
        return 1

    extracted_rows = read_csv(EXTRACTED)
    current_rows = len(read_csv(PUBLIC)) if PUBLIC.exists() else 0
    mode = "write" if args.write_public else "dry-run"
    print(f"funserv_apr: {mode}; extracted={len(extracted_rows)} public_current={current_rows} public_target={len(extracted_rows)}")

    if args.write_public:
        write_csv(PUBLIC, extracted_rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
