"""
Consolida convênios federais (Portal da Transparência API) para publicação.

Entrada:  data/extracted/sorocaba/transferencias_federais/saida/transferencias_federais_sorocaba_{ano}.csv
Saída:    data/public/sorocaba/transferencias/saida/transferencias_federais_portal_sorocaba.csv

Fonte: API Portal da Transparência Federal — endpoint /convenios
Complementa:
  transferencias_federais_tce_sorocaba.csv (FPM, SUS, FNDE — TCE-SP)
  convenios_federais_sorocaba.csv (SICONV/Transferegov — dados abertos)
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = ROOT / "data" / "extracted" / "sorocaba" / "transferencias_federais" / "saida"
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "transferencias" / "saida"
PUBLIC.mkdir(parents=True, exist_ok=True)

ANOS = list(range(2020, 2026))
SAIDA = PUBLIC / "transferencias_federais_portal_sorocaba.csv"

CAMPOS = [
    "ano",
    "competencia",
    "tipo_transferencia",
    "modalidade_transferencia",
    "orgao_superior_codigo",
    "orgao_superior_nome",
    "unidade_gestora_codigo",
    "unidade_gestora_nome",
    "funcao_id",
    "funcao_descricao",
    "acao_id",
    "acao_descricao",
    "valor_transferido",
    "municipio_ibge",
    "municipio_nome",
    "fonte_api",
]


def main() -> None:
    todos: list[dict] = []

    for ano in ANOS:
        path = EXTRACTED / f"transferencias_federais_sorocaba_{ano}.csv"
        if not path.exists():
            print(f"  AVISO: {path.name} não encontrado — pulando {ano}")
            continue
        with path.open(encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f))
        total_ano = sum(float(r.get("valor_transferido") or 0) for r in rows)
        print(f"  {ano}: {len(rows)} convênios, R$ {total_ano:,.2f}")
        todos.extend(rows)

    with SAIDA.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CAMPOS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(todos)

    total = sum(float(r.get("valor_transferido") or 0) for r in todos)
    print(f"\nPublicado: {len(todos)} registros -> {SAIDA}")
    print(f"Total 2020-2025: R$ {total:,.2f}")


if __name__ == "__main__":
    main()
