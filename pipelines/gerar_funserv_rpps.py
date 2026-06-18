"""
Publica dados financeiros do FUNSERV (fundo de previdência de Sorocaba)
extraídos do SICONFI/Tesouro Nacional (RREO Anexo 04).

Entrada:  data/extracted/sorocaba/fiscal/saida/rpps_sorocaba_{ano}.csv
Saída:    data/public/sorocaba/autarquias/saida/funserv_rpps_sorocaba.csv

Fonte: SICONFI / Tesouro Nacional — RREO Anexo 04 (Demonstrativo RPPS)
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACTED_DIR = ROOT / "data" / "extracted" / "sorocaba" / "fiscal" / "saida"
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "autarquias" / "saida"
PUBLIC.mkdir(parents=True, exist_ok=True)

ANOS = list(range(2020, 2026))

CAMPOS_SAIDA = [
    "ano",
    "contribuicoes_segurados",
    "contribuicoes_patronal",
    "total_receitas_rpps",
    "aposentadorias",
    "total_despesas_rpps",
    "resultado_rpps",
    "fonte_url",
]


def normalizar(row: dict) -> dict:
    return {
        "ano": row.get("Ano", "").strip(),
        "contribuicoes_segurados": row.get("Contribuicoes_Segurados", "").strip(),
        "contribuicoes_patronal": row.get("Contribuicoes_Patronal", "").strip(),
        "total_receitas_rpps": row.get("Total_Receitas_RPPS", "").strip(),
        "aposentadorias": row.get("Aposentadorias", "").strip(),
        "total_despesas_rpps": row.get("Total_Despesas_RPPS", "").strip(),
        "resultado_rpps": row.get("Resultado_RPPS", "").strip(),
        "fonte_url": row.get("Fonte_URL", "").strip(),
    }


def main() -> None:
    registros = []
    for ano in ANOS:
        arq = EXTRACTED_DIR / f"rpps_sorocaba_{ano}.csv"
        if not arq.exists():
            print(f"  AVISO: {arq.name} não encontrado")
            continue
        enc = "utf-8-sig" if arq.read_bytes()[:3] == b"\xef\xbb\xbf" else "utf-8"
        with arq.open(encoding=enc, newline="") as f:
            for row in csv.DictReader(f):
                r = normalizar(row)
                if r["ano"]:
                    registros.append(r)
                    print(f"  {ano}: receitas R$ {r['total_receitas_rpps']}, despesas R$ {r['total_despesas_rpps']}")

    out = PUBLIC / "funserv_rpps_sorocaba.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS_SAIDA)
        w.writeheader()
        w.writerows(registros)

    print(f"Publicado: {len(registros)} registros -> {out}")


if __name__ == "__main__":
    main()
