"""
Coleta RREO Anexo 04 do SICONFI para Sorocaba e extrai fluxo do RPPS.

Produz por ano: rpps_sorocaba_{ano}.csv
Colunas: Ano, Contribuicoes_Segurados, Contribuicoes_Patronal, Total_Receitas_RPPS,
          Aposentadorias, Total_Despesas_RPPS, Resultado_RPPS, Fonte_URL

Uso:
    python extrator_rpps.py
    python extrator_rpps.py --ano 2024
"""
import argparse
import csv
import json
import os
import sys
import urllib.request

from paths import CFG, MUNICIPIO, as_str, FISCAL_EXTRACTED_DIR

IBGE_SOROCABA = int(CFG["ibge"])
BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo"

# Esquema novo (2021+)
COL_RECEITA_NOVO = "RECEITAS REALIZADAS ATÉ O BIMESTRE (b)"
COL_DESPESA_NOVO = "DESPESAS LIQUIDADAS ATÉ O BIMESTRE (e)"

# Esquema antigo (até 2020): sufixo com ano dinâmico
COL_RECEITA_ANTIGO_TMPL = "Até o Bimestre / {ano}"
COL_DESPESA_ANTIGO_TMPL = "DESPESAS LIQUIDADAS ATÉ O BIMESTRE / {ano}"

# cod_conta -> (tipo_coluna, campo_csv)  tipo_coluna: "rec" | "desp"
COD_CAMPO: dict[str, tuple[str, str]] = {
    "ReceitaDeContribuicoesDosSeguradosBrutaPrevidenciario":                      ("rec",  "Contribuicoes_Segurados"),
    "ReceitaDeContribuicoesPatronalPrevidenciario":                               ("rec",  "Contribuicoes_Patronal"),
    "TotalReceitasRPPSPrevidenciario":                                            ("rec",  "Total_Receitas_RPPS"),
    "DespesasPrevidenciariasExcetoIntraOrcamentariasAposentadoriasPrevidenciario":("desp", "Aposentadorias"),
    "TotalDasDespesasRPPSPrevidenciario":                                         ("desp", "Total_Despesas_RPPS"),
    "RREO4ResultadoRPPSPrevidenciario":                                           ("desp", "Resultado_RPPS"),
}


def fetch_anexo04(ano: int):
    url = (
        f"{BASE_URL}?an_exercicio={ano}&nr_periodo=6"
        f"&co_tipo_demonstrativo=RREO&id_ente={IBGE_SOROCABA}"
        f"&no_anexo=RREO-Anexo%2004"
    )
    print(f"  Baixando RREO Anexo 04 — {ano}...")
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    items = data.get("items", [])
    print(f"  {len(items)} registros")
    return items, url


def _resolve_colunas(items: list[dict], ano: int) -> tuple[str, str]:
    """Detecta qual esquema de colunas a API está usando para este ano."""
    cols = {i.get("coluna", "") for i in items}
    if COL_RECEITA_NOVO in cols:
        return COL_RECEITA_NOVO, COL_DESPESA_NOVO
    return (
        COL_RECEITA_ANTIGO_TMPL.format(ano=ano),
        COL_DESPESA_ANTIGO_TMPL.format(ano=ano),
    )


def extrair(items: list[dict], ano: int) -> dict[str, float]:
    col_rec, col_desp = _resolve_colunas(items, ano)
    acc: dict[str, float] = {}
    for item in items:
        cod = item.get("cod_conta", "")
        col = item.get("coluna", "")
        if cod in COD_CAMPO:
            tipo, campo = COD_CAMPO[cod]
            esperada = col_rec if tipo == "rec" else col_desp
            if col == esperada:
                acc[campo] = float(item.get("valor") or 0)
    return acc


def salvar_csv(ano: int, acc: dict, fonte_url: str) -> str:
    saida_dir = as_str(FISCAL_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    caminho = os.path.join(saida_dir, f"rpps_{MUNICIPIO}_{ano}.csv")

    campos = [
        "Ano",
        "Contribuicoes_Segurados", "Contribuicoes_Patronal", "Total_Receitas_RPPS",
        "Aposentadorias", "Total_Despesas_RPPS",
        "Resultado_RPPS",
        "Fonte_URL",
    ]
    row = {
        "Ano":                    ano,
        "Contribuicoes_Segurados":f"{acc.get('Contribuicoes_Segurados', 0):.2f}",
        "Contribuicoes_Patronal": f"{acc.get('Contribuicoes_Patronal',  0):.2f}",
        "Total_Receitas_RPPS":    f"{acc.get('Total_Receitas_RPPS',     0):.2f}",
        "Aposentadorias":         f"{acc.get('Aposentadorias',          0):.2f}",
        "Total_Despesas_RPPS":    f"{acc.get('Total_Despesas_RPPS',     0):.2f}",
        "Resultado_RPPS":         f"{acc.get('Resultado_RPPS',          0):.2f}",
        "Fonte_URL":              fonte_url,
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
    print(f"  RPPS — {ano}")
    print(f"{'='*55}")
    try:
        items, fonte_url = fetch_anexo04(ano)
    except Exception as e:
        print(f"  ERRO: {e}")
        return False

    acc = extrair(items, ano)
    if not acc:
        print("  ATENÇÃO: nenhum dado encontrado")
        return False

    caminho = salvar_csv(ano, acc, fonte_url)

    print(f"\n  Contrib. Segurados:           {fmt(acc.get('Contribuicoes_Segurados', 0))}")
    print(f"  Contrib. Patronal:            {fmt(acc.get('Contribuicoes_Patronal',  0))}")
    print(f"  TOTAL Receitas RPPS:          {fmt(acc.get('Total_Receitas_RPPS',     0))}")
    print(f"  Aposentadorias:               {fmt(acc.get('Aposentadorias',          0))}")
    print(f"  TOTAL Despesas RPPS:          {fmt(acc.get('Total_Despesas_RPPS',     0))}")
    print(f"  Resultado RPPS:               {fmt(acc.get('Resultado_RPPS',          0))}")
    print(f"\n  -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Extrai fluxo RPPS (RREO Anexo 04)")
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
