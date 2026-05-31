"""
Coleta RGF Anexo 02 do SICONFI para Sorocaba e extrai dívida consolidada.

Produz por ano: divida_sorocaba_{ano}.csv
Colunas: Ano, DC_Bruta, DC_Contratual, Emprestimos, Financiamentos, Precatorios,
          Deducoes, DCL, RCL, DC_pct_RCL, DCL_pct_RCL, Limite_pct, Limite_Alerta_pct,
          Passivo_Atuarial, Fonte_URL

Periodicidade: quadrimestral. 3º quadrimestre = encerramento do exercício.
Nota: Passivo Atuarial RPPS não compõe o limite da Resolução do Senado Federal,
mas é exibido para transparência da situação previdenciária municipal.

Uso:
    python extrator_rgf_divida.py
    python extrator_rgf_divida.py --ano 2024
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
        cod = item.get("cod_conta", "")
        col = item.get("coluna", "")
        if col == COL_3Q:
            acc[cod] = float(item.get("valor") or 0)
    return acc


def g(acc: dict, cod: str) -> float:
    return acc.get(cod, 0.0)


def salvar_csv(ano: int, acc: dict, fonte_url: str):
    saida_dir = as_str(FISCAL_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    caminho = os.path.join(saida_dir, f"divida_{MUNICIPIO}_{ano}.csv")

    dc_bruta        = g(acc, "DividaConsolidada")
    dc_contratual   = g(acc, "DividaContratual")
    emprestimos     = g(acc, "RGF2Emprestimos")
    financiamentos  = g(acc, "RGF2Financiamentos")
    precatorios     = g(acc, "PrecatoriosPosterioresA05052000VencidosENaoPagos")
    deducoes        = g(acc, "DeducoesDaDividaConsolidada")
    dcl             = g(acc, "DividaConsolidadaLiquida")
    rcl             = g(acc, "RGF2ReceitaCorrenteLiquida")
    dc_pct          = g(acc, "PercentualDaDCSobreARCL")
    dcl_pct         = g(acc, "PercentualDaDCLSobreARCL")
    limite          = g(acc, "LimiteDefinidoPorResolucaoDoSenadoFederal")
    limite_pct      = (rcl * 1.20) if rcl > 0 else 0  # 120% da RCL = Resolução SF 40/2001
    limite_alert    = g(acc, "LimiteDeAlerta")
    passivo_atuarial= g(acc, "RGF2DividaConsolidadaPrevidenciariaPassivoAtuarial")

    # % da RCL para o limite (deve ser ~120)
    limite_pct_rcl = (limite / rcl * 100) if rcl > 0 else 120.0

    campos = [
        "Ano", "DC_Bruta", "DC_Contratual", "Emprestimos", "Financiamentos",
        "Precatorios", "Deducoes", "DCL",
        "RCL", "DC_pct_RCL", "DCL_pct_RCL",
        "Limite_valor", "Limite_pct_RCL",
        "Limite_Alerta_valor",
        "Passivo_Atuarial",
        "Fonte_URL",
    ]
    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerow({
            "Ano":               ano,
            "DC_Bruta":          f"{dc_bruta:.2f}",
            "DC_Contratual":     f"{dc_contratual:.2f}",
            "Emprestimos":       f"{emprestimos:.2f}",
            "Financiamentos":    f"{financiamentos:.2f}",
            "Precatorios":       f"{precatorios:.2f}",
            "Deducoes":          f"{deducoes:.2f}",
            "DCL":               f"{dcl:.2f}",
            "RCL":               f"{rcl:.2f}",
            "DC_pct_RCL":        f"{dc_pct:.4f}",
            "DCL_pct_RCL":       f"{dcl_pct:.4f}",
            "Limite_valor":      f"{limite:.2f}",
            "Limite_pct_RCL":    f"{limite_pct_rcl:.4f}",
            "Limite_Alerta_valor": f"{limite_alert:.2f}",
            "Passivo_Atuarial":  f"{passivo_atuarial:.2f}",
            "Fonte_URL":         fonte_url,
        })

    return caminho, dc_bruta, dcl, rcl, dc_pct, dcl_pct


def fmt(v: float) -> str:
    return f"R$ {v:>18,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def processar_ano(ano: int) -> bool:
    print(f"\n{'='*55}")
    print(f"  Dívida Consolidada — {ano}")
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

    caminho, dc_bruta, dcl, rcl, dc_pct, dcl_pct = salvar_csv(ano, acc, fonte_url)

    print(f"\n  RCL:              {fmt(rcl)}")
    print(f"  DC Bruta:         {fmt(dc_bruta)}  ({dc_pct:.2f}% da RCL)  limite: 120%")
    print(f"  DCL:              {fmt(dcl)}  ({dcl_pct:.2f}% da RCL)")
    print(f"\n  -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Extrai dívida consolidada (RGF Anexo 02)")
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
