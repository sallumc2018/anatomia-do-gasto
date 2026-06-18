"""
Consolida todas as transferências recebidas por Paulínia (CNPJ 45751435000106)
em uma visão unificada por ano.

Fontes agregadas (já coletadas e publicadas):
  1. Convênios Portal da Transparência Federal
     data/public/paulinia/transferencias_federais/saida/transferencias_federais_paulinia_{ano}.csv
  2. Repasses FNS/FAF (Fundo Nacional de Saúde)
     data/public/paulinia/fns/saida/fns_repasses_faf_com_populacao_paulinia_{ano}.csv

Saída:
  data/public/paulinia/transferencias/saida/transferencias_para_paulinia_{ano}.csv

Schema normalizado:
  ano, municipio, fonte, categoria, orgao_remetente, descricao, valor_bruto, moeda

Uso:
  .venv/bin/python3 pipelines/gerar_transferencias_para_paulinia.py
  .venv/bin/python3 pipelines/gerar_transferencias_para_paulinia.py --anos 2023 2024 2025
"""
import argparse
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "data" / "public" / "paulinia"

ANOS = list(range(2020, 2026))

SAIDA_DIR = PUBLIC / "transferencias" / "saida"

CAMPOS = [
    "ano",
    "municipio",
    "fonte",
    "categoria",
    "orgao_remetente",
    "descricao",
    "valor_bruto",
    "moeda",
]


def _val(v: str) -> float:
    try:
        return float(str(v).replace(",", ".").replace(" ", "") or 0)
    except (ValueError, TypeError):
        return 0.0


def coletar_convenios(ano: int) -> list[dict]:
    path = PUBLIC / "transferencias_federais" / "saida" / f"transferencias_federais_paulinia_{ano}.csv"
    if not path.exists():
        return []

    rows = []
    with path.open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            rows.append({
                "ano": ano,
                "municipio": "paulinia",
                "fonte": "Portal_Transparencia_Federal",
                "categoria": f"{r.get('funcao_descricao', '').strip() or 'convenio'}",
                "orgao_remetente": r.get("orgao_superior_nome", "").strip(),
                "descricao": r.get("acao_descricao", "").strip(),
                "valor_bruto": _val(r.get("valor_transferido", 0)),
                "moeda": "BRL",
            })
    return rows


def coletar_fns(ano: int) -> list[dict]:
    path = PUBLIC / "fns" / "saida" / f"fns_repasses_faf_com_populacao_paulinia_{ano}.csv"
    if not path.exists():
        return []

    rows = []
    with path.open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            bloco = r.get("BLOCO", "").strip()
            grupo = r.get("GRUPO", "").strip()
            estrategia = r.get("ESTRATÉGIA", r.get("ESTRATEGIA", "")).strip()
            descricao = f"{bloco} — {grupo}" if grupo else bloco
            rows.append({
                "ano": ano,
                "municipio": "paulinia",
                "fonte": "FNS_FAF",
                "categoria": "saude",
                "orgao_remetente": "Fundo Nacional de Saúde",
                "descricao": f"{descricao}: {estrategia}"[:200] if estrategia else descricao,
                "valor_bruto": _val(r.get("VL_BRUTO", 0)),
                "moeda": "BRL",
            })
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--anos", type=int, nargs="+", default=ANOS)
    args = parser.parse_args()

    SAIDA_DIR.mkdir(parents=True, exist_ok=True)

    total_geral = 0
    total_registros = 0

    for ano in sorted(args.anos):
        registros: list[dict] = []
        registros.extend(coletar_convenios(ano))
        registros.extend(coletar_fns(ano))

        if not registros:
            print(f"  {ano}: sem dados")
            continue

        saida = SAIDA_DIR / f"transferencias_para_paulinia_{ano}.csv"
        with saida.open("w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=CAMPOS)
            writer.writeheader()
            writer.writerows(registros)

        total_ano = sum(r["valor_bruto"] for r in registros)
        total_geral += total_ano
        total_registros += len(registros)
        print(f"  {ano}: {len(registros)} registros → R$ {total_ano:,.2f} → {saida.name}")

    print(f"\nTotal: {total_registros} registros, R$ {total_geral:,.2f}")
    print(f"Saída: {SAIDA_DIR}")


if __name__ == "__main__":
    main()
