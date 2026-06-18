"""
Baixa e publica a DCA (Declaração das Contas Anuais) de Sorocaba via SICONFI.

A DCA consolida os balanços anuais (patrimonial, financeiro, orçamentário) que o
município envia ao Tesouro Nacional. É a base das contas anuais submetidas a controle.

Entrada:  API https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca
Saída:    data/public/sorocaba/controle_externo/saida/dca_siconfi_sorocaba_2020_2025.csv

Fonte: SICONFI / Tesouro Nacional — https://apidatalake.tesouro.gov.br
"""
import csv
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "controle_externo" / "saida"
PUBLIC.mkdir(parents=True, exist_ok=True)

BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca"
IBGE = 3552205
ANOS = list(range(2020, 2026))
DELAY = 0.5

CAMPOS = [
    "exercicio", "anexo", "cod_conta", "conta", "coluna", "valor",
    "instituicao", "uf",
]


def buscar_ano(ano: int) -> list[dict]:
    url = f"{BASE_URL}?an_exercicio={ano}&co_poder=M&id_ente={IBGE}"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"  AVISO {ano}: HTTP {e.code}")
        return []
    except Exception as e:
        print(f"  AVISO {ano}: {e}")
        return []
    items = data.get("items", [])
    return [
        {
            "exercicio": r.get("exercicio", ano),
            "anexo": r.get("anexo", ""),
            "cod_conta": r.get("cod_conta", ""),
            "conta": r.get("conta", ""),
            "coluna": r.get("coluna", ""),
            "valor": r.get("valor", ""),
            "instituicao": r.get("instituicao", ""),
            "uf": r.get("uf", ""),
        }
        for r in items
    ]


CONTAS_RESUMO = {
    "P1.0.0.0.0.00.00": "Ativo Total",
    "P1.1.0.0.0.00.00": "Ativo Circulante",
    "P1.2.0.0.0.00.00": "Ativo Não Circulante",
    "P2.0.0.0.0.00.00": "Passivo Total",
    "P2.1.0.0.0.00.00": "Passivo Circulante",
    "P2.2.0.0.0.00.00": "Passivo Não Circulante",
    "SaldoPatrimonial": "Saldo Patrimonial (PL)",
    "AtivoPermanente": "Ativo Permanente (ant.)",
    "PassivoPermanente": "Passivo Permanente (ant.)",
    "SaldoPatrimonial": "Saldo Patrimonial",
}


def main() -> None:
    todos: list[dict] = []
    for ano in ANOS:
        registros = buscar_ano(ano)
        print(f"  {ano}: {len(registros)} registros")

        # Print key balance sheet highlights
        por_cod = {r["cod_conta"]: r["valor"] for r in registros if r["anexo"] == "DCA-Anexo I-AB"}
        ativo = por_cod.get("P1.0.0.0.0.00.00") or por_cod.get("AtivoPermanente", "")
        saldo = por_cod.get("SaldoPatrimonial", "")
        if ativo:
            print(f"    Ativo Total: R$ {float(str(ativo)):>18,.0f}")
        if saldo:
            print(f"    Saldo Patr.: R$ {float(str(saldo)):>18,.0f}")

        todos.extend(registros)
        time.sleep(DELAY)

    out = PUBLIC / "dca_siconfi_sorocaba_2020_2025.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(todos)

    print(f"\nPublicado: {len(todos)} registros -> {out}")

    # Summary by year and anexo
    from collections import Counter
    contagem: Counter = Counter()
    for r in todos:
        contagem[(r["exercicio"], r["anexo"])] += 1
    print("\nRegistros por ano/anexo (amostra):")
    for (ano, anexo), n in sorted(contagem.items()):
        print(f"  {ano} | {anexo:20s} | {n:4d} registros")


if __name__ == "__main__":
    main()
