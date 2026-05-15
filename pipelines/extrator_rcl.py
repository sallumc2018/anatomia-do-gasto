"""
Coleta RREO Anexo 03 do SICONFI para Sorocaba e extrai composição das Receitas Correntes.

Produz por ano: rcl_sorocaba_{ano}.csv
Colunas: Ano, Receitas_Correntes, IPTU, ISS, ITBI, IRRF, Outras_Tributarias,
          Transferencias_Total, FPM, ICMS, IPVA, FUNDEB, Outras_Transferencias,
          Receita_Servicos, Receita_Patrimonial, Receita_Contribuicoes,
          Outras_Correntes, Outros, Fonte_URL

Nota: Receitas_Correntes = Receitas Correntes BRUTAS (antes das deduções LRF).
      Para a RCL oficial (base dos limites), ver extrator_rgf_pessoal.py.
      Outros = Receitas_Correntes − trib_proprias − Transferencias_Total −
               Receita_Servicos − Receita_Patrimonial − Receita_Contribuicoes −
               Outras_Correntes  (resíduo por arredondamentos/subcategorias menores).

Uso:
    python extrator_rcl.py
    python extrator_rcl.py --ano 2024
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

COL_TOTAL = "TOTAL (ÚLTIMOS 12 MESES)"

COD_WHITELIST: dict[str, str] = {
    "ReceitasCorrentesLiquidasExcetoTransferenciasEFUNDEB": "Receitas_Correntes",
    "IPTULiquidoExcetoTransferenciasEFUNDEB":              "IPTU",
    "ISSLiquidoExcetoTransferenciasEFUNDEB":               "ISS",
    "ITBILiquidoExcetoTransferenciasEFUNDEB":              "ITBI",
    "IRRFLiquidoExcetoTransferenciasEFUNDEB":              "IRRF",
    "OutrasReceitasTributarias":                           "Outras_Tributarias",
    "RREO3TransferenciasCorrentes":                        "Transferencias_Total",
    "RREO3CotaParteDoFPM":                                 "FPM",
    "RREO3CotaParteDoICMS":                                "ICMS",
    "RREO3CotaParteDoIPVA":                                "IPVA",
    "RREO3TransferenciasDoFUNDEB":                         "FUNDEB",
    "RREO3OutrasTransferenciasCorrentes":                  "Outras_Transferencias",
    "RREO3ReceitaDeServicos":                              "Receita_Servicos",
    "RREO3ReceitaPatrimonial":                             "Receita_Patrimonial",
    "RREO3ReceitaDeContribuicoes":                         "Receita_Contribuicoes",
    "RREO3OutrasReceitasCorrentes":                        "Outras_Correntes",
}


def fetch_anexo03(ano: int):
    url = (
        f"{BASE_URL}?an_exercicio={ano}&nr_periodo=6"
        f"&co_tipo_demonstrativo=RREO&id_ente={IBGE_SOROCABA}"
        f"&no_anexo=RREO-Anexo%2003"
    )
    print(f"  Baixando RREO Anexo 03 — {ano}...")
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
        if cod in COD_WHITELIST and col == COL_TOTAL:
            acc[cod] = float(item.get("valor") or 0)
    return acc


def salvar_csv(ano: int, acc: dict, fonte_url: str) -> str:
    saida_dir = as_str(FISCAL_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    caminho = os.path.join(saida_dir, f"rcl_sorocaba_{ano}.csv")

    receitas  = acc.get("ReceitasCorrentesLiquidasExcetoTransferenciasEFUNDEB", 0.0)
    trib_prop = sum(acc.get(c, 0.0) for c in [
        "IPTULiquidoExcetoTransferenciasEFUNDEB",
        "ISSLiquidoExcetoTransferenciasEFUNDEB",
        "ITBILiquidoExcetoTransferenciasEFUNDEB",
        "IRRFLiquidoExcetoTransferenciasEFUNDEB",
        "OutrasReceitasTributarias",
    ])
    transf    = acc.get("RREO3TransferenciasCorrentes", 0.0)
    servicos  = acc.get("RREO3ReceitaDeServicos", 0.0)
    patrim    = acc.get("RREO3ReceitaPatrimonial", 0.0)
    contrib   = acc.get("RREO3ReceitaDeContribuicoes", 0.0)
    outras_c  = acc.get("RREO3OutrasReceitasCorrentes", 0.0)
    outros    = receitas - trib_prop - transf - servicos - patrim - contrib - outras_c

    campos = ["Ano"] + list(COD_WHITELIST.values()) + ["Outros", "Fonte_URL"]
    row: dict = {"Ano": ano, "Outros": f"{outros:.2f}", "Fonte_URL": fonte_url}
    for cod, col_name in COD_WHITELIST.items():
        row[col_name] = f"{acc.get(cod, 0.0):.2f}"

    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerow(row)

    return caminho


def fmt(v: float) -> str:
    return f"R$ {v:>18,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def processar_ano(ano: int) -> bool:
    print(f"\n{'='*55}")
    print(f"  RCL Detalhada — {ano}")
    print(f"{'='*55}")

    try:
        items, fonte_url = fetch_anexo03(ano)
    except Exception as e:
        print(f"  ERRO: {e}")
        return False

    acc = extrair(items)
    if not acc:
        print("  ATENÇÃO: nenhum dado encontrado")
        return False

    caminho = salvar_csv(ano, acc, fonte_url)

    receitas = acc.get("ReceitasCorrentesLiquidasExcetoTransferenciasEFUNDEB", 0)
    iss      = acc.get("ISSLiquidoExcetoTransferenciasEFUNDEB", 0)
    iptu     = acc.get("IPTULiquidoExcetoTransferenciasEFUNDEB", 0)
    icms     = acc.get("RREO3CotaParteDoICMS", 0)
    fpm      = acc.get("RREO3CotaParteDoFPM", 0)
    fundeb   = acc.get("RREO3TransferenciasDoFUNDEB", 0)
    servicos = acc.get("RREO3ReceitaDeServicos", 0)
    patrim   = acc.get("RREO3ReceitaPatrimonial", 0)

    print(f"\n  Receitas Correntes (bruto): {fmt(receitas)}")
    print(f"    ISS:        {fmt(iss)}")
    print(f"    IPTU:       {fmt(iptu)}")
    print(f"    ICMS cota:  {fmt(icms)}")
    print(f"    FPM:        {fmt(fpm)}")
    print(f"    FUNDEB:     {fmt(fundeb)}")
    print(f"    Serviços:   {fmt(servicos)}")
    print(f"    Patrimonial:{fmt(patrim)}")
    print(f"\n  -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Extrai RCL detalhada (RREO Anexo 03)")
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
