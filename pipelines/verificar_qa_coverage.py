"""
Gate de CI: verifica que todo CSV em data/public/{municipio}/ tem entrada em
data/manifests/{municipio}/qa.csv. Falha com exit code 1 se houver gap.

Uso:
    python3 pipelines/verificar_qa_coverage.py
    python3 pipelines/verificar_qa_coverage.py --municipio paulinia
    python3 pipelines/verificar_qa_coverage.py --quiet   # só exit code
"""
import argparse
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

MUNICIPIOS = ["sorocaba", "paulinia", "sao_paulo"]


def check_municipio(municipio: str, quiet: bool) -> list[str]:
    pub_dir = ROOT / "data" / "public" / municipio
    qa_file = ROOT / "data" / "manifests" / municipio / "qa.csv"

    if not pub_dir.exists():
        return []
    if not qa_file.exists():
        gaps = [str(p.relative_to(ROOT)) for p in pub_dir.rglob("*.csv")]
        if not quiet and gaps:
            print(f"[{municipio}] qa.csv inexistente — {len(gaps)} CSVs sem cobertura")
        return gaps

    registered = set()
    with open(qa_file) as f:
        for row in csv.DictReader(f):
            registered.add(row["arquivo"])

    gaps = []
    for p in sorted(pub_dir.rglob("*.csv")):
        if p.name not in registered:
            gaps.append(str(p.relative_to(ROOT)))

    if not quiet and gaps:
        print(f"[{municipio}] {len(gaps)} CSVs sem entrada em qa.csv:")
        for g in gaps:
            print(f"  {g}")

    return gaps


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--municipio", help="Filtrar por município")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    targets = [args.municipio] if args.municipio else MUNICIPIOS
    total_gaps = []
    for m in targets:
        total_gaps.extend(check_municipio(m, args.quiet))

    if total_gaps:
        if not args.quiet:
            print(f"\n❌ {len(total_gaps)} arquivo(s) sem cobertura QA.")
            print("   Execute: python3 pipelines/gerar_qa_manifest.py --municipio <nome>")
        sys.exit(1)

    if not args.quiet:
        print(f"✅ QA coverage OK — {', '.join(targets)}")


if __name__ == "__main__":
    main()
