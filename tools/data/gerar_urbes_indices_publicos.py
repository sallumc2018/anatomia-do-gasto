from __future__ import annotations

import argparse
import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
EXTRACTED = ROOT / "data" / "extracted" / "sorocaba" / "urbes"
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "transporte" / "urbes" / "saida"

SUBPASTAS = ("contratos_outros", "contratos_receitas", "contratos_transporte")
PUBLIC_COLUMNS = [
    "subpasta",
    "arquivo",
    "paginas_ocr",
    "chars",
    "status_ocr",
    "numero_contrato",
    "cnpj",
    "valor",
    "data_assinatura",
]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=PUBLIC_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows({column: row.get(column, "") for column in PUBLIC_COLUMNS} for row in rows)


def build(write_public: bool) -> int:
    exit_code = 0
    for sub in SUBPASTAS:
        extracted = EXTRACTED / f"contratos_{sub}_ocr.csv"
        public = PUBLIC / f"urbes_{sub}_ocr_indice_sorocaba.csv"
        if not extracted.exists():
            print(f"{sub}: missing extracted {extracted.relative_to(ROOT).as_posix()}")
            exit_code = 1
            continue
        rows = read_csv(extracted)
        current_rows = len(read_csv(public)) if public.exists() else 0
        mode = "write" if write_public else "dry-run"
        print(f"{sub}: {mode}; extracted={len(rows)} public_current={current_rows} public_target={len(rows)}")
        if write_public:
            write_csv(public, rows)
    return exit_code


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate sanitized public URBES OCR indexes from extracted OCR outputs.")
    parser.add_argument("--write-public", action="store_true", help="Write sanitized indexes to data/public.")
    args = parser.parse_args()
    return build(args.write_public)


if __name__ == "__main__":
    raise SystemExit(main())
