"""
Agrega transferencias federais para Sorocaba por ano, tipo e orgao concedente.

Entrada:
  data/extracted/sorocaba/transferencias_federais/saida/transferencias_federais_sorocaba_{ano}.csv

Saida:
  data/validated/sorocaba/transferencias_federais/saida/transferencias_federais_agregado_sorocaba_{ano}.csv

Colunas do CSV de saida:
  ano, tipo_transferencia, orgao_superior_nome, total_transferencias, valor_total
"""
import argparse
import csv
from collections import defaultdict
from pathlib import Path

from paths import TRANSFERENCIAS_EXTRACTED_DIR, TRANSFERENCIAS_VALIDATED_DIR


def br_float(valor: str | float) -> float:
    if isinstance(valor, float):
        return valor
    if isinstance(valor, int):
        return float(valor)
    s = str(valor).strip()
    if not s or s == "None":
        return 0.0
    try:
        return float(s.replace(".", "").replace(",", "."))
    except ValueError:
        return 0.0


def agregar(ano: int) -> list[dict]:
    entrada = (
        TRANSFERENCIAS_EXTRACTED_DIR / "saida" / f"transferencias_federais_sorocaba_{ano}.csv"
    )
    if not entrada.exists():
        raise FileNotFoundError(
            f"CSV nao encontrado: {entrada}\n"
            f"Execute primeiro: python baixar_transferencias_federais.py --ano {ano}"
        )

    acumulado: dict[tuple, dict] = defaultdict(lambda: {"total_transferencias": 0, "valor_total": 0.0})

    with entrada.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            chave = (
                row["ano"],
                row["tipo_transferencia"] or "Nao classificado",
                row["orgao_superior_nome"] or "Nao identificado",
            )
            acumulado[chave]["total_transferencias"] += 1
            acumulado[chave]["valor_total"] += br_float(row["valor_transferido"])

    registros = []
    for (ano_str, tipo, orgao), totais in sorted(acumulado.items()):
        registros.append({
            "ano": ano_str,
            "tipo_transferencia": tipo,
            "orgao_superior_nome": orgao,
            "total_transferencias": totais["total_transferencias"],
            "valor_total": round(totais["valor_total"], 2),
        })

    registros.sort(key=lambda r: -r["valor_total"])
    return registros


def salvar_csv(registros: list[dict], ano: int) -> Path:
    destino = (
        TRANSFERENCIAS_VALIDATED_DIR / "saida" / f"transferencias_federais_agregado_sorocaba_{ano}.csv"
    )
    destino.parent.mkdir(parents=True, exist_ok=True)
    campos = ["ano", "tipo_transferencia", "orgao_superior_nome", "total_transferencias", "valor_total"]
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(registros)
    return destino


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Agrega transferencias federais de Sorocaba por tipo e orgao"
    )
    parser.add_argument("--ano", type=int, action="append", required=True)
    args = parser.parse_args()

    for ano in sorted(set(args.ano)):
        registros = agregar(ano)
        destino = salvar_csv(registros, ano)
        total_valor = sum(r["valor_total"] for r in registros)
        print(f"{ano}: {len(registros)} grupos, R$ {total_valor:,.2f}")
        print(f"  Saida: {destino}")


if __name__ == "__main__":
    main()
