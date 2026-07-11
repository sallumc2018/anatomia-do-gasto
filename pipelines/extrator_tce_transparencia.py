"""
Consolida JSONs mensais da API TCE-SP Transparencia em CSVs anuais por dataset.

Le data/raw/<municipio>/tce/<run>/transparencia/{despesas,receitas}/ano=XXXX/mes=XX.json
Grava data/extracted/<municipio>/tce/transparencia/{despesas,receitas}_{municipio}_{ano}.csv

Uso:
    MUNICIPIO=paulinia py extrator_tce_transparencia.py
    MUNICIPIO=paulinia py extrator_tce_transparencia.py --dataset despesas --ano 2024
"""
import argparse
import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from paths import MUNICIPIO, RAW_DIR, EXTRACTED_DIR

TCE_EXTRACTED = EXTRACTED_DIR / "tce" / "transparencia"
TCE_EXTRACTED.mkdir(parents=True, exist_ok=True)


def encontrar_run_mais_recente(dataset: str) -> Path | None:
    base = RAW_DIR / "tce"
    runs = sorted(base.iterdir(), reverse=True) if base.exists() else []
    for run in runs:
        pasta = run / "transparencia" / dataset
        if pasta.exists() and any(pasta.rglob("*.json")):
            return pasta
    return None


def consolidar(dataset: str, anos: list[int]) -> dict[int, int]:
    pasta = encontrar_run_mais_recente(dataset)
    if not pasta:
        print(f"  AVISO: nenhum raw encontrado para {dataset}. Rode baixar_tce_sorocaba.py primeiro.")
        return {}

    campos: list[str] = []
    totais: dict[int, int] = {}

    for ano in anos:
        ano_dir = pasta / f"ano={ano}"
        if not ano_dir.exists():
            print(f"  {ano}: pasta ausente ({ano_dir}) — pulando")
            continue

        linhas: list[dict] = []
        for mes in range(1, 13):
            json_path = ano_dir / f"mes={mes:02d}.json"
            if not json_path.exists():
                continue
            try:
                data = json.loads(json_path.read_bytes().decode("utf-8", errors="replace"))
                if not isinstance(data, list):
                    continue
                for row in data:
                    row["ano"] = ano
                    row["mes_num"] = mes
                    linhas.append(row)
                if data and not campos:
                    campos = ["ano", "mes_num"] + [k for k in data[0].keys()]
            except Exception as e:
                print(f"  {ano}/{mes:02d}: erro {e}", file=sys.stderr)

        if not linhas:
            print(f"  {ano}: 0 registros")
            continue

        if not campos:
            campos = list(linhas[0].keys())

        destino = TCE_EXTRACTED / f"{dataset}_{MUNICIPIO}_{ano}.csv"
        with open(destino, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(linhas)

        totais[ano] = len(linhas)
        print(f"  {ano}: {len(linhas):,} registros -> {destino.name}")

    return totais


def main() -> None:
    parser = argparse.ArgumentParser(description="Consolida TCE-SP transparencia para municipio.")
    parser.add_argument("--dataset", choices=["despesas", "receitas", "ambos"], default="ambos")
    parser.add_argument("--ano", type=int, action="append")
    args = parser.parse_args()

    anos = args.ano or list(range(2020, 2027))
    datasets = ["despesas", "receitas"] if args.dataset == "ambos" else [args.dataset]

    for ds in datasets:
        print(f"\n=== {ds.upper()} ===")
        totais = consolidar(ds, anos)
        total_geral = sum(totais.values())
        print(f"  Total: {total_geral:,} registros em {len(totais)} anos")


if __name__ == "__main__":
    main()
