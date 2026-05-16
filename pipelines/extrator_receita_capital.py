"""
Coleta RREO Anexo 01 do SICONFI para Sorocaba e extrai Receitas de Capital.

Produz por ano: rcl_capital_sorocaba_{ano}.csv
Colunas: Ano, Operacoes_Credito_Internas, Operacoes_Credito_Externas, Operacoes_Credito_Total,
          Alienacao_Bens, Alienacao_Bens_Imoveis, Alienacao_Bens_Moveis,
          Outras_Capital, Total_Capital, Fonte_URL

Uso:
    python extrator_receita_capital.py
    python extrator_receita_capital.py --ano 2024
"""
import argparse
import csv
import json
import os
import sys
import urllib.request

from paths import as_str, FISCAL_EXTRACTED_DIR

IBGE_SOROCABA = 3552205
BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo"
COL_REALIZADO = "Até o Bimestre (c)"

COD_WHITELIST: dict[str, str] = {
    "OperacoesDeCreditoInternas": "Operacoes_Credito_Internas",
    "OperacoesDeCreditoExternas": "Operacoes_Credito_Externas",
    "AlienacaoDeBens":            "Alienacao_Bens",
    "AlienacaoDeBensImoveis":     "Alienacao_Bens_Imoveis",
    "AlienacaoDeBensMoveis":      "Alienacao_Bens_Moveis",
    "OutrasReceitasDeCapital":    "Outras_Capital",
}


def fetch_anexo01(ano: int):
    url = (
        f"{BASE_URL}?an_exercicio={ano}&nr_periodo=6"
        f"&co_tipo_demonstrativo=RREO&id_ente={IBGE_SOROCABA}"
        f"&no_anexo=RREO-Anexo%2001"
    )
    print(f"  Baixando RREO Anexo 01 — {ano}...")
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    items = data.get("items", [])
    print(f"  {len(items)} registros")
    return items, url


def extrair(items: list[dict]) -> dict[str, float]:
    acc: dict[str, float] = {}
    for item in items:
        cod = item.get("cod_conta", "")
        col = item.get("coluna", "")
        if cod in COD_WHITELIST and col == COL_REALIZADO:
            acc[cod] = float(item.get("valor") or 0)
    return acc


def salvar_csv(ano: int, acc: dict, fonte_url: str) -> str:
    saida_dir = as_str(FISCAL_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    caminho = os.path.join(saida_dir, f"rcl_capital_sorocaba_{ano}.csv")

    op_int  = acc.get("OperacoesDeCreditoInternas", 0.0)
    op_ext  = acc.get("OperacoesDeCreditoExternas", 0.0)
    alien   = acc.get("AlienacaoDeBens",            0.0)
    alien_i = acc.get("AlienacaoDeBensImoveis",     0.0)
    alien_m = acc.get("AlienacaoDeBensMoveis",      0.0)
    outras  = acc.get("OutrasReceitasDeCapital",    0.0)
    total   = op_int + op_ext + alien + outras

    campos = [
        "Ano",
        "Operacoes_Credito_Internas", "Operacoes_Credito_Externas", "Operacoes_Credito_Total",
        "Alienacao_Bens", "Alienacao_Bens_Imoveis", "Alienacao_Bens_Moveis",
        "Outras_Capital", "Total_Capital",
        "Fonte_URL",
    ]
    row = {
        "Ano":                        ano,
        "Operacoes_Credito_Internas": f"{op_int:.2f}",
        "Operacoes_Credito_Externas": f"{op_ext:.2f}",
        "Operacoes_Credito_Total":    f"{op_int + op_ext:.2f}",
        "Alienacao_Bens":             f"{alien:.2f}",
        "Alienacao_Bens_Imoveis":     f"{alien_i:.2f}",
        "Alienacao_Bens_Moveis":      f"{alien_m:.2f}",
        "Outras_Capital":             f"{outras:.2f}",
        "Total_Capital":              f"{total:.2f}",
        "Fonte_URL":                  fonte_url,
    }

    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerow(row)

    return caminho


def fmt(v: float) -> str:
    return f"R$ {v:>18,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def processar_ano(ano: int) -> bool:
    print(f"\n{'='*55}")
    print(f"  Receitas de Capital — {ano}")
    print(f"{'='*55}")
    try:
        items, fonte_url = fetch_anexo01(ano)
    except Exception as e:
        print(f"  ERRO: {e}")
        return False

    acc = extrair(items)
    if not acc:
        print("  ATENÇÃO: nenhum dado encontrado")
        return False

    caminho = salvar_csv(ano, acc, fonte_url)

    op_int = acc.get("OperacoesDeCreditoInternas", 0)
    op_ext = acc.get("OperacoesDeCreditoExternas", 0)
    alien  = acc.get("AlienacaoDeBens", 0)
    outras = acc.get("OutrasReceitasDeCapital", 0)
    total  = op_int + op_ext + alien + outras

    print(f"\n  Operações de Crédito Internas: {fmt(op_int)}")
    print(f"  Operações de Crédito Externas: {fmt(op_ext)}")
    print(f"  Alienação de Bens:             {fmt(alien)}")
    print(f"  Outras Receitas de Capital:    {fmt(outras)}")
    print(f"  TOTAL Capital:                 {fmt(total)}")
    print(f"\n  -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Extrai Receitas de Capital (RREO Anexo 01)")
    parser.add_argument("--ano", type=int, action="append",
                        help="Ano(s) a processar (padrão: 2020–2025)")
    args = parser.parse_args()
    anos = args.ano if args.ano else list(range(2020, 2026))

    ok = err = 0
    for ano in anos:
        if processar_ano(ano):
            ok += 1
        else:
            err += 1

    print(f"\nConcluído: {ok} OK, {err} com erro")
    sys.exit(1 if err else 0)


if __name__ == "__main__":
    main()
