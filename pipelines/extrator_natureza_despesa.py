"""
Coleta RREO Anexo 01 do SICONFI para Sorocaba e extrai Despesas por Natureza Econômica.

Produz por ano: natureza_despesa_sorocaba_{ano}.csv
Colunas: Ano, Pessoal, Juros_Encargos, Outras_Correntes, Despesas_Correntes,
          Investimentos, Despesas_Capital, Total_Despesas, Fonte_URL

Uso:
    python extrator_natureza_despesa.py
    python extrator_natureza_despesa.py --ano 2024
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
COL_LIQUIDADAS = "DESPESAS LIQUIDADAS ATÉ O BIMESTRE (h)"

COD_WHITELIST: dict[str, str] = {
    "PessoalEEncargosSociais":  "Pessoal",
    "JurosEEncargosDaDivida":   "Juros_Encargos",
    "OutrasDespesasCorrentes":  "Outras_Correntes",
    "DespesasCorrentes":        "Despesas_Correntes",
    "Investimentos":            "Investimentos",
    "DespesasDeCapital":        "Despesas_Capital",
    "TotalDespesas":            "Total_Despesas",
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
        if cod in COD_WHITELIST and col == COL_LIQUIDADAS:
            acc[cod] = float(item.get("valor") or 0)
    return acc


def salvar_csv(ano: int, acc: dict, fonte_url: str) -> str:
    saida_dir = as_str(FISCAL_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    caminho = os.path.join(saida_dir, f"natureza_despesa_sorocaba_{ano}.csv")

    pessoal    = acc.get("PessoalEEncargosSociais", 0.0)
    juros      = acc.get("JurosEEncargosDaDivida",  0.0)
    outras_c   = acc.get("OutrasDespesasCorrentes", 0.0)
    desp_c     = acc.get("DespesasCorrentes",       0.0)
    invest     = acc.get("Investimentos",            0.0)
    desp_k     = acc.get("DespesasDeCapital",        0.0)
    total      = acc.get("TotalDespesas",            0.0)

    campos = [
        "Ano",
        "Pessoal", "Juros_Encargos", "Outras_Correntes", "Despesas_Correntes",
        "Investimentos", "Despesas_Capital",
        "Total_Despesas",
        "Fonte_URL",
    ]
    row = {
        "Ano":               ano,
        "Pessoal":           f"{pessoal:.2f}",
        "Juros_Encargos":    f"{juros:.2f}",
        "Outras_Correntes":  f"{outras_c:.2f}",
        "Despesas_Correntes":f"{desp_c:.2f}",
        "Investimentos":     f"{invest:.2f}",
        "Despesas_Capital":  f"{desp_k:.2f}",
        "Total_Despesas":    f"{total:.2f}",
        "Fonte_URL":         fonte_url,
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
    print(f"  Natureza da Despesa — {ano}")
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

    pessoal  = acc.get("PessoalEEncargosSociais", 0)
    juros    = acc.get("JurosEEncargosDaDivida",  0)
    outras_c = acc.get("OutrasDespesasCorrentes", 0)
    desp_c   = acc.get("DespesasCorrentes",       0)
    invest   = acc.get("Investimentos",            0)
    desp_k   = acc.get("DespesasDeCapital",        0)
    total    = acc.get("TotalDespesas",            0)

    print(f"\n  Pessoal e Encargos:           {fmt(pessoal)}")
    print(f"  Juros e Encargos da Dívida:   {fmt(juros)}")
    print(f"  Outras Despesas Correntes:    {fmt(outras_c)}")
    print(f"  TOTAL Despesas Correntes:     {fmt(desp_c)}")
    print(f"  Investimentos:                {fmt(invest)}")
    print(f"  TOTAL Despesas de Capital:    {fmt(desp_k)}")
    print(f"  TOTAL DESPESAS:               {fmt(total)}")
    print(f"\n  -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Extrai Despesas por Natureza Econômica (RREO Anexo 01)")
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
