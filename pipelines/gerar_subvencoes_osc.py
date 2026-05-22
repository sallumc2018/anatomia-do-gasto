"""
Extrai subvenções a OSCs e entidades privadas dos empenhos publicados.

Filtro: natureza_despesa que começa com 3.3.41 (Subvenções Sociais) ou
        3.3.42 (Auxílios a entidades privadas sem fins lucrativos).

Entrada:  data/public/sorocaba/empenho/saida/empenho_sorocaba_{ano}.csv
Saída:    data/public/sorocaba/transferencias/saida/subvencoes_osc_sorocaba.csv
          data/public/sorocaba/transferencias/saida/subvencoes_por_entidade_sorocaba.csv

Fonte: Portal de Transparência de Sorocaba (base de empenhos)
"""
import csv
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EMPENHO_DIR = ROOT / "data" / "public" / "sorocaba" / "empenho" / "saida"
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "transferencias" / "saida"
PUBLIC.mkdir(parents=True, exist_ok=True)

# 3.3.50.* = Transferências a Instituições Privadas sem fins lucrativos
# Inclui subvenções sociais (3.3.50.43), auxílios (3.3.50.39) e outros
PATTERN_SUBVENCAO = re.compile(r"^3\.3\.50\.")

ANOS = list(range(2020, 2026))

CAMPOS_DETALHE = [
    "ano", "data", "natureza_despesa", "programa_trabalho",
    "nota_empenho", "fornecedor_nome", "especificacao",
    "empenhado_no_dia_num", "empenhado_ate_data_num",
]

CAMPOS_ENTIDADE = ["fornecedor_nome", "ano", "total_empenhos", "valor_total"]


def br_float(v: str) -> float:
    if not v or v.strip() in ("", "None"):
        return 0.0
    try:
        return float(v.strip().replace(".", "").replace(",", "."))
    except ValueError:
        return 0.0


def main() -> None:
    todos = []
    for ano in ANOS:
        arq = EMPENHO_DIR / f"empenho_sorocaba_{ano}.csv"
        if not arq.exists():
            print(f"  AVISO: {arq.name} nao encontrado")
            continue
        count = 0
        with arq.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                nd = row.get("natureza_despesa", "").strip()
                if PATTERN_SUBVENCAO.match(nd):
                    todos.append({
                        "ano": row.get("ano", str(ano)),
                        "data": row.get("data", "").strip(),
                        "natureza_despesa": nd,
                        "programa_trabalho": row.get("programa_trabalho", "").strip(),
                        "nota_empenho": row.get("nota_empenho", "").strip(),
                        "fornecedor_nome": row.get("fornecedor_nome", "").strip(),
                        "especificacao": (row.get("especificacao", "") or "").strip()[:200],
                        "empenhado_no_dia_num": row.get("empenhado_no_dia_num", "").strip(),
                        "empenhado_ate_data_num": row.get("empenhado_ate_data_num", "").strip(),
                    })
                    count += 1
        print(f"  {ano}: {count} registros de subvencao/auxilio")

    todos.sort(key=lambda r: (r["ano"], r["data"], r["fornecedor_nome"]))

    out = PUBLIC / "subvencoes_osc_sorocaba.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS_DETALHE)
        w.writeheader()
        w.writerows(todos)
    print(f"Detalhe: {len(todos)} registros -> {out}")

    # Agregado por entidade + ano
    por_ent: dict[tuple, dict] = defaultdict(lambda: {"total": 0, "valor": 0.0})
    for r in todos:
        chave = (r["fornecedor_nome"], r["ano"])
        por_ent[chave]["total"] += 1
        por_ent[chave]["valor"] += br_float(r["empenhado_no_dia_num"])

    agg = sorted(
        [{"fornecedor_nome": k[0], "ano": k[1],
          "total_empenhos": v["total"], "valor_total": round(v["valor"], 2)}
         for k, v in por_ent.items()],
        key=lambda r: -float(r["valor_total"])
    )

    out2 = PUBLIC / "subvencoes_por_entidade_sorocaba.csv"
    with out2.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS_ENTIDADE)
        w.writeheader()
        w.writerows(agg)
    print(f"Por entidade: {len(agg)} grupos -> {out2}")

    total = sum(br_float(r["empenhado_no_dia_num"]) for r in todos)
    print(f"Total empenhado subvencoes/auxilios 2020-2025: R$ {total:,.2f}")


if __name__ == "__main__":
    main()
