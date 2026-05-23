"""
Coleta RGF Anexo 01 do SICONFI para Sorocaba e extrai despesa com pessoal + RCL.

Produz por ano: pessoal_sorocaba_{ano}.csv
Colunas: Ano, RCL, RCL_Ajustada, Pessoal_Bruto, Pessoal_Ativo, Pessoal_Inativo,
          Pessoal_Liquido, DTP, DTP_pct_RCL, Limite_Maximo_pct, Limite_Prudencial_pct,
          Limite_Alerta_pct, Fonte_URL

Periodicidade: quadrimestral para municípios com > 50k hab (Sorocaba ~700k).
3º quadrimestre (nr_periodo=3) = encerramento do exercício (dezembro).

Uso:
    python extrator_rgf_pessoal.py
    python extrator_rgf_pessoal.py --ano 2024
"""
import argparse
import csv
import json
import os
import sys
import urllib.request

from paths import CFG, as_str, FISCAL_EXTRACTED_DIR

IBGE_SOROCABA = int(CFG["ibge"])
BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rgf"

COL_TOTAL_12M = "TOTAL (ÚLTIMOS 12 MESES) (a)"
COL_VALOR     = "Valor"
COL_PCT       = "% sobre a RCL Ajustada"


def fetch_anexo01(ano: int):
    url = (
        f"{BASE_URL}?an_exercicio={ano}&in_periodicidade=Q&nr_periodo=3"
        f"&co_tipo_demonstrativo=RGF&co_poder=E&id_ente={IBGE_SOROCABA}"
        f"&no_anexo=RGF-Anexo%2001"
    )
    print(f"  Baixando RGF Anexo 01 — {ano}...")
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    items = data.get("items", [])
    print(f"  {len(items)} registros")
    return items, url


def extrair(items: list[dict]) -> dict[str, float]:
    acc: dict[str, dict[str, float]] = {}
    for item in items:
        cod = item.get("cod_conta", "")
        col = item.get("coluna", "")
        val = float(item.get("valor") or 0)
        if cod not in acc:
            acc[cod] = {}
        acc[cod][col] = val
    return acc


def g(acc: dict, cod: str, col: str) -> float:
    return acc.get(cod, {}).get(col, 0.0)


def salvar_csv(ano: int, acc: dict, fonte_url: str) -> str:
    saida_dir = as_str(FISCAL_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    caminho = os.path.join(saida_dir, f"pessoal_sorocaba_{ano}.csv")

    rcl          = g(acc, "ReceitaCorrenteLiquidaLimiteLegal", COL_VALOR)
    rcl_ajustada = g(acc, "ReceitaCorrenteLiquidaAjustada",   COL_VALOR)
    pessoal_bruto   = g(acc, "DespesaComPessoalBruta",          COL_TOTAL_12M)
    pessoal_ativo   = g(acc, "DespesaComPessoalAtivoBruta",     COL_TOTAL_12M)
    pessoal_inativo = g(acc, "DespesaComPessoalInativoEPensionistasBruta", COL_TOTAL_12M)
    pessoal_liquido = g(acc, "DespesaComPessoalLiquida",        COL_TOTAL_12M)
    dtp             = g(acc, "DespesaComPessoalTotal",           COL_VALOR)
    dtp_pct         = g(acc, "DespesaComPessoalTotal",           COL_PCT)
    limite_max      = g(acc, "LimiteMaximoDespesaComPessoalTotal",      COL_PCT)
    limite_prud     = g(acc, "LimitePrudencialDespesaComPessoalTotal",  COL_PCT)
    limite_alert    = g(acc, "LimiteDeAlertaDespesaComPessoalTotal",    COL_PCT)

    campos = [
        "Ano", "RCL", "RCL_Ajustada",
        "Pessoal_Bruto", "Pessoal_Ativo", "Pessoal_Inativo", "Pessoal_Liquido",
        "DTP", "DTP_pct_RCL",
        "Limite_Maximo_pct", "Limite_Prudencial_pct", "Limite_Alerta_pct",
        "Fonte_URL",
    ]
    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerow({
            "Ano":                 ano,
            "RCL":                 f"{rcl:.2f}",
            "RCL_Ajustada":        f"{rcl_ajustada:.2f}",
            "Pessoal_Bruto":       f"{pessoal_bruto:.2f}",
            "Pessoal_Ativo":       f"{pessoal_ativo:.2f}",
            "Pessoal_Inativo":     f"{pessoal_inativo:.2f}",
            "Pessoal_Liquido":     f"{pessoal_liquido:.2f}",
            "DTP":                 f"{dtp:.2f}",
            "DTP_pct_RCL":         f"{dtp_pct:.4f}",
            "Limite_Maximo_pct":   f"{limite_max:.4f}",
            "Limite_Prudencial_pct": f"{limite_prud:.4f}",
            "Limite_Alerta_pct":   f"{limite_alert:.4f}",
            "Fonte_URL":           fonte_url,
        })

    return caminho, rcl, dtp, dtp_pct, limite_max


def fmt(v: float) -> str:
    return f"R$ {v:>18,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def processar_ano(ano: int) -> bool:
    print(f"\n{'='*55}")
    print(f"  Despesa com Pessoal — {ano}")
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

    caminho, rcl, dtp, dtp_pct, limite_max = salvar_csv(ano, acc, fonte_url)

    print(f"\n  RCL:                  {fmt(rcl)}")
    print(f"  DTP (Total Pessoal):  {fmt(dtp)}  ({dtp_pct:.2f}% da RCL)")
    print(f"  Limite máximo (LRF):  {limite_max:.1f}% — margem: {limite_max - dtp_pct:.2f} pp")
    print(f"\n  -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Extrai despesa com pessoal (RGF Anexo 01)")
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
