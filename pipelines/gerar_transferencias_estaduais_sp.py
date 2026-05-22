"""
Publica dados de repasses estaduais coletados da Sefaz-SP (RepasseConsulta).

Colunas: ICMS, IPVA, FundExpIPI, compensacoes, total — mensais por ano.

Entrada:  data/extracted/sorocaba/transferencias_estaduais/saida/transferencias_estaduais_sp_sorocaba_2020_2026.csv
Saída:    data/public/sorocaba/transferencias/saida/transferencias_estaduais_sp_sorocaba.csv

Fonte: https://www.fazenda.sp.gov.br/RepasseConsulta/Consulta/repasse.aspx
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = (
    ROOT / "data" / "extracted" / "sorocaba" / "transferencias_estaduais" / "saida"
    / "transferencias_estaduais_sp_sorocaba_2020_2026.csv"
)
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "transferencias" / "saida"
PUBLIC.mkdir(parents=True, exist_ok=True)

CAMPOS_SAIDA = [
    "ano", "municipio_nome", "periodo_tipo", "mes", "mes_numero",
    "icms", "ipva", "fund_exp_ipi", "compensacoes", "total", "fonte_url",
]


def main() -> None:
    if not EXTRACTED.exists():
        raise SystemExit(f"Fonte nao encontrada: {EXTRACTED}")

    enc = "utf-8-sig" if EXTRACTED.read_bytes()[:3] == b"\xef\xbb\xbf" else "utf-8"
    registros = []
    with EXTRACTED.open(encoding=enc, newline="") as f:
        for row in csv.DictReader(f):
            registros.append({c: row.get(c, "").strip() for c in CAMPOS_SAIDA})

    out = PUBLIC / "transferencias_estaduais_sp_sorocaba.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS_SAIDA)
        w.writeheader()
        w.writerows(registros)

    anos = sorted({r["ano"] for r in registros})
    totais = {r["ano"]: r["total"] for r in registros if r["periodo_tipo"] == "total_anual"}
    print(f"Publicado: {len(registros)} registros -> {out}")
    print(f"Anos: {', '.join(anos)}")
    for ano in sorted(totais):
        print(f"  {ano} total: R$ {totais[ano]}")


if __name__ == "__main__":
    main()
