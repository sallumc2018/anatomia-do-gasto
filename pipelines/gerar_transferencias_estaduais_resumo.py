"""
Extrai resumo de transferências estaduais da série RREO já publicada.

Os arquivos receitas_sorocaba_*.csv (SICONFI RREO Anexo 01) contêm a linha
"Transferências dos Estados" com o total arrecadado por ano. Este script
consolida essa linha em um único CSV para 2020–2025.

Entrada:  data/public/sorocaba/receita/saida/receitas_sorocaba_{ano}.csv
Saída:    data/public/sorocaba/transferencias/saida/transferencias_estaduais_resumo_sorocaba.csv

Fonte: SICONFI / Tesouro Nacional (RREO Anexo 01)
Nota: valor agregado total — não inclui breakdown por ICMS-Educação, IPVA, etc.
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECEITA_DIR = ROOT / "data" / "public" / "sorocaba" / "receita" / "saida"
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "transferencias" / "saida"
PUBLIC.mkdir(parents=True, exist_ok=True)

ANOS = list(range(2020, 2026))
COD_ESTADUAL = "TransferenciasCorrentesDosEstadosEDoDistritoFederalEDeSuasEntidades"

CAMPOS = ["ano", "categoria", "previsto_inicial", "previsto_atualizado",
          "arrecadado_bimestre", "arrecadado_acumulado", "fonte_url"]


def main() -> None:
    registros = []
    for ano in ANOS:
        arq = RECEITA_DIR / f"receitas_sorocaba_{ano}.csv"
        if not arq.exists():
            print(f"  AVISO: {arq.name} não encontrado")
            continue
        enc = "utf-8-sig" if arq.read_bytes()[:3] == b"\xef\xbb\xbf" else "utf-8"
        with arq.open(encoding=enc, newline="") as f:
            for row in csv.DictReader(f):
                if row.get("Cod_Conta", "").strip() == COD_ESTADUAL:
                    registros.append({
                        "ano": ano,
                        "categoria": row.get("Categoria", "").strip(),
                        "previsto_inicial": row.get("Previsto_Inicial", "").strip(),
                        "previsto_atualizado": row.get("Previsto_Atualizado", "").strip(),
                        "arrecadado_bimestre": row.get("Arrecadado_Bimestre", "").strip(),
                        "arrecadado_acumulado": row.get("Arrecadado_Acumulado", "").strip(),
                        "fonte_url": row.get("Fonte_URL", "").strip(),
                    })
                    print(f"  {ano}: R$ {row.get('Arrecadado_Acumulado','?')}")
                    break

    out = PUBLIC / "transferencias_estaduais_resumo_sorocaba.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(registros)

    print(f"Publicado: {len(registros)} anos -> {out}")


if __name__ == "__main__":
    main()
