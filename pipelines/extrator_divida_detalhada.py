"""
Coleta RGF Anexo 02 do SICONFI para Sorocaba e extrai composição detalhada da dívida.

Complementa extrator_rgf_divida.py adicionando split interno/externo e demais componentes.

Produz por ano: divida_detalhada_sorocaba_{ano}.csv
Colunas: Ano, DC_Bruta, DC_Contratual,
          Emprestimos, Emp_Internos, Emp_Externos,
          Financiamentos, Fin_Internos,
          Precatorios_Vencidos, Precatorios_Total, Outras_Dividas,
          Deducoes, Disponibilidade_Caixa_Bruta, RP_Processados,
          DCL, RCL, DC_pct_RCL, DCL_pct_RCL,
          Limite_valor, Limite_pct_RCL, Limite_Alerta_valor,
          Passivo_Atuarial, Fonte_URL

Periodicidade: quadrimestral. 3º quadrimestre = encerramento do exercício.

Uso:
    python extrator_divida_detalhada.py
    python extrator_divida_detalhada.py --ano 2024
"""
import argparse
import csv
import json
import os
import sys
import urllib.request

from paths import CFG, MUNICIPIO, as_str, FISCAL_EXTRACTED_DIR

IBGE_SOROCABA = int(CFG["ibge"])
BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rgf"
COL_3Q = "Até o 3º Quadrimestre"

CAMPOS = [
    "Ano",
    "DC_Bruta", "DC_Contratual",
    "Emprestimos", "Emp_Internos", "Emp_Externos",
    "Financiamentos", "Fin_Internos",
    "Precatorios_Vencidos", "Precatorios_Total", "Outras_Dividas",
    "Deducoes", "Disponibilidade_Caixa_Bruta", "RP_Processados",
    "DCL", "RCL", "DC_pct_RCL", "DCL_pct_RCL",
    "Limite_valor", "Limite_pct_RCL", "Limite_Alerta_valor",
    "Passivo_Atuarial",
    "Fonte_URL",
]


def fetch_anexo02(ano: int):
    url = (
        f"{BASE_URL}?an_exercicio={ano}&in_periodicidade=Q&nr_periodo=3"
        f"&co_tipo_demonstrativo=RGF&co_poder=E&id_ente={IBGE_SOROCABA}"
        f"&no_anexo=RGF-Anexo%2002"
    )
    print(f"  Baixando RGF Anexo 02 — {ano}...")
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    items = data.get("items", [])
    print(f"  {len(items)} registros")
    return items, url


def extrair(items: list[dict]) -> dict[str, float]:
    acc: dict[str, float] = {}
    for item in items:
        col = item.get("coluna", "")
        if col == COL_3Q:
            acc[item.get("cod_conta", "")] = float(item.get("valor") or 0)
    return acc


def g(acc: dict, cod: str) -> float:
    return acc.get(cod, 0.0)


def salvar_csv(ano: int, acc: dict, fonte_url: str) -> str:
    saida_dir = as_str(FISCAL_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    caminho = os.path.join(saida_dir, f"divida_detalhada_{MUNICIPIO}_{ano}.csv")

    dc_bruta    = g(acc, "DividaConsolidada")
    dc_contrat  = g(acc, "DividaContratual")
    emp         = g(acc, "RGF2Emprestimos")
    emp_int     = g(acc, "RGF2EmprestimosInternos")
    emp_ext     = g(acc, "RGF2EmprestimosExternos")
    fin         = g(acc, "RGF2Financiamentos")
    fin_int     = g(acc, "RGF2FinanciamentosInternos")
    prec_venc   = g(acc, "PrecatoriosPosterioresA05052000VencidosENaoPagos")
    prec_total  = g(acc, "PrecatoriosAPartirDe05052000")
    outras      = g(acc, "OutrasDividas")
    deducoes    = g(acc, "DeducoesDaDividaConsolidada")
    disp_bruta  = g(acc, "DisponibilidadeDeCaixaBrutaAnexo02")
    rp_proc     = g(acc, "RestosAPagarProcessadosExcetoPrecatorios")
    dcl         = g(acc, "DividaConsolidadaLiquida")
    rcl         = g(acc, "RGF2ReceitaCorrenteLiquida")
    dc_pct      = g(acc, "PercentualDaDCSobreARCL")
    dcl_pct     = g(acc, "PercentualDaDCLSobreARCL")
    limite      = g(acc, "LimiteDefinidoPorResolucaoDoSenadoFederal")
    limite_pct  = (limite / rcl * 100) if rcl > 0 else 0.0
    limite_alrt = g(acc, "LimiteDeAlerta")
    pass_atuar  = g(acc, "RGF2DividaConsolidadaPrevidenciariaPassivoAtuarial")

    row = {
        "Ano":                      ano,
        "DC_Bruta":                 f"{dc_bruta:.2f}",
        "DC_Contratual":            f"{dc_contrat:.2f}",
        "Emprestimos":              f"{emp:.2f}",
        "Emp_Internos":             f"{emp_int:.2f}",
        "Emp_Externos":             f"{emp_ext:.2f}",
        "Financiamentos":           f"{fin:.2f}",
        "Fin_Internos":             f"{fin_int:.2f}",
        "Precatorios_Vencidos":     f"{prec_venc:.2f}",
        "Precatorios_Total":        f"{prec_total:.2f}",
        "Outras_Dividas":           f"{outras:.2f}",
        "Deducoes":                 f"{deducoes:.2f}",
        "Disponibilidade_Caixa_Bruta": f"{disp_bruta:.2f}",
        "RP_Processados":           f"{rp_proc:.2f}",
        "DCL":                      f"{dcl:.2f}",
        "RCL":                      f"{rcl:.2f}",
        "DC_pct_RCL":               f"{dc_pct:.4f}",
        "DCL_pct_RCL":              f"{dcl_pct:.4f}",
        "Limite_valor":             f"{limite:.2f}",
        "Limite_pct_RCL":           f"{limite_pct:.4f}",
        "Limite_Alerta_valor":      f"{limite_alrt:.2f}",
        "Passivo_Atuarial":         f"{pass_atuar:.2f}",
        "Fonte_URL":                fonte_url,
    }

    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerow(row)

    return caminho


def fmt(v: float) -> str:
    return f"R$ {v:>18,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def processar_ano(ano: int) -> bool:
    print(f"\n{'='*55}")
    print(f"  Dívida Detalhada — {ano}")
    print(f"{'='*55}")

    try:
        items, fonte_url = fetch_anexo02(ano)
    except Exception as e:
        print(f"  ERRO: {e}")
        return False

    acc = extrair(items)
    if not acc:
        print("  ATENÇÃO: nenhum dado encontrado")
        return False

    caminho = salvar_csv(ano, acc, fonte_url)

    dc  = float(acc.get("DividaConsolidada", 0))
    dcl = float(acc.get("DividaConsolidadaLiquida", 0))
    rcl = float(acc.get("RGF2ReceitaCorrenteLiquida", 0))
    emp_int = float(acc.get("RGF2EmprestimosInternos", 0))
    emp_ext = float(acc.get("RGF2EmprestimosExternos", 0))
    dc_pct  = float(acc.get("PercentualDaDCSobreARCL", 0))
    dcl_pct = float(acc.get("PercentualDaDCLSobreARCL", 0))

    print(f"\n  RCL:                      {fmt(rcl)}")
    print(f"  DC Bruta:                 {fmt(dc)}  ({dc_pct:.2f}% RCL)  limite: 120%")
    print(f"  DCL:                      {fmt(dcl)}  ({dcl_pct:.2f}% RCL)")
    print(f"  Emp. Internos:            {fmt(emp_int)}")
    print(f"  Emp. Externos:            {fmt(emp_ext)}")
    print(f"\n  -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Extrai dívida detalhada (RGF Anexo 02)")
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
