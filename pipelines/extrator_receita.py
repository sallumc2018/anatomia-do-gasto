"""
Coleta RREO Anexo 01 do SICONFI para Sorocaba e extrai receitas por categoria.

Produz por ano: receitas_sorocaba_{ano}.csv
Colunas: Categoria, Cod_Conta, Previsto_Inicial, Previsto_Atualizado,
          Arrecadado_Bimestre, Arrecadado_Acumulado, Fonte_URL

A coluna de realização é "Até o Bimestre (c)" — período 6 (6° bimestre = ano completo).
Extraímos categorias exceto-intraorçamentárias + intraorçamentárias onde relevante.

Uso:
    python extrator_receita.py
    python extrator_receita.py --ano 2024
"""
import argparse
import csv
import json
import os
import sys
import urllib.request

from paths import CFG, MUNICIPIO, as_str, RECEITA_EXTRACTED_DIR

IBGE_SOROCABA = int(CFG["ibge"])
BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo"

COL_PREVISTO_INICIAL  = "PREVISÃO INICIAL"
COL_PREVISTO_ATUAL    = "PREVISÃO ATUALIZADA (a)"
COL_ARRECADADO_BIM    = "No Bimestre (b)"
COL_ARRECADADO_ACUM   = "Até o Bimestre (c)"

# Categorias de interesse — mapeadas para nome legível
COD_CONTA_WHITELIST: dict[str, str] = {
    "TotalReceitas":                                                   "Total de Receitas",
    "ReceitasExcetoIntraOrcamentarias":                               "Receitas Exceto Intra-Orçamentárias",
    "ReceitasCorrentes":                                               "Receitas Correntes",
    "ReceitaTributaria":                                               "Receita Tributária",
    "Impostos":                                                        "Impostos",
    "Taxas":                                                           "Taxas",
    "ContribuicaoDeMelhoria":                                          "Contribuição de Melhoria",
    "ReceitaDeContribuicoes":                                          "Receita de Contribuições",
    "ReceitaPatrimonial":                                              "Receita Patrimonial",
    "ReceitaDeServicos":                                               "Receita de Serviços",
    "TransferenciasCorrentes":                                         "Transferências Correntes",
    "TransferenciasCorrentesDaUniaoEDeSuasEntidades":                 "Transferências da União",
    "TransferenciasCorrentesDosEstadosEDoDistritoFederalEDeSuasEntidades": "Transferências dos Estados",
    "TransferenciasCorrentesDeOutrasInstituicoesPublicas":            "Transferências de Outras Inst. Públicas",
    "OutrasReceitasCorrentes":                                         "Outras Receitas Correntes",
    "ReceitasDeCapital":                                               "Receitas de Capital",
    "ReceitasIntraOrcamentariasTotal":                                "Receitas Intra-Orçamentárias",
}

# Ordem de exibição no CSV (da mais agregada à mais específica)
ORDEM_SAIDA = [
    "TotalReceitas",
    "ReceitasExcetoIntraOrcamentarias",
    "ReceitasCorrentes",
    "ReceitaTributaria",
    "Impostos",
    "Taxas",
    "ContribuicaoDeMelhoria",
    "ReceitaDeContribuicoes",
    "ReceitaPatrimonial",
    "ReceitaDeServicos",
    "TransferenciasCorrentes",
    "TransferenciasCorrentesDaUniaoEDeSuasEntidades",
    "TransferenciasCorrentesDosEstadosEDoDistritoFederalEDeSuasEntidades",
    "TransferenciasCorrentesDeOutrasInstituicoesPublicas",
    "OutrasReceitasCorrentes",
    "ReceitasDeCapital",
    "ReceitasIntraOrcamentariasTotal",
]


def fetch_anexo01(ano: int):
    url = (
        f"{BASE_URL}?an_exercicio={ano}&nr_periodo=6"
        f"&co_tipo_demonstrativo=RREO&id_ente={IBGE_SOROCABA}"
        f"&no_anexo=RREO-Anexo%2001"
    )
    print(f"  Baixando Anexo 01 — {ano}...")
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    items = data.get("items", [])
    print(f"  {len(items)} registros")
    return items, url


def extrair_receitas(items: list[dict]) -> dict[str, dict[str, float]]:
    """
    Retorna dict: cod_conta -> {col: valor}
    Cada cod_conta pode aparecer várias vezes (uma por coluna).
    """
    acc: dict[str, dict[str, float]] = {}
    for item in items:
        cod = item.get("cod_conta", "")
        if cod not in COD_CONTA_WHITELIST:
            continue
        col = item.get("coluna", "")
        valor = float(item.get("valor") or 0)
        if cod not in acc:
            acc[cod] = {}
        acc[cod][col] = acc[cod].get(col, 0.0) + valor
    return acc


def get_val(acc: dict, cod: str, col: str) -> float:
    return acc.get(cod, {}).get(col, 0.0)


def salvar_csv(ano: int, acc: dict[str, dict[str, float]], fonte_url: str) -> str:
    saida_dir = as_str(RECEITA_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)

    caminho = os.path.join(saida_dir, f"receitas_{MUNICIPIO}_{ano}.csv")
    campos = [
        "Categoria",
        "Cod_Conta",
        "Previsto_Inicial",
        "Previsto_Atualizado",
        "Arrecadado_Bimestre",
        "Arrecadado_Acumulado",
        "Fonte_URL",
    ]

    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        for cod in ORDEM_SAIDA:
            if cod not in acc:
                continue
            w.writerow({
                "Categoria":            COD_CONTA_WHITELIST[cod],
                "Cod_Conta":            cod,
                "Previsto_Inicial":     f"{get_val(acc, cod, COL_PREVISTO_INICIAL):.2f}",
                "Previsto_Atualizado":  f"{get_val(acc, cod, COL_PREVISTO_ATUAL):.2f}",
                "Arrecadado_Bimestre":  f"{get_val(acc, cod, COL_ARRECADADO_BIM):.2f}",
                "Arrecadado_Acumulado": f"{get_val(acc, cod, COL_ARRECADADO_ACUM):.2f}",
                "Fonte_URL":            fonte_url,
            })

    return caminho


def fmt(v: float) -> str:
    return f"R$ {v:>18,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def processar_ano(ano: int) -> bool:
    print(f"\n{'='*55}")
    print(f"  Receita Municipal — {ano}")
    print(f"{'='*55}")

    try:
        items, fonte_url = fetch_anexo01(ano)
    except Exception as e:
        print(f"  ERRO: {e}")
        return False

    acc = extrair_receitas(items)
    if not acc:
        print("  ATENÇÃO: nenhuma categoria encontrada")
        return False

    caminho = salvar_csv(ano, acc, fonte_url)

    # sumário no terminal
    total_arrecad = get_val(acc, "TotalReceitas", COL_ARRECADADO_ACUM)
    total_exceto  = get_val(acc, "ReceitasExcetoIntraOrcamentarias", COL_ARRECADADO_ACUM)
    rec_correntes = get_val(acc, "ReceitasCorrentes", COL_ARRECADADO_ACUM)
    tributaria    = get_val(acc, "ReceitaTributaria", COL_ARRECADADO_ACUM)
    transferencias= get_val(acc, "TransferenciasCorrentes", COL_ARRECADADO_ACUM)
    capital       = get_val(acc, "ReceitasDeCapital", COL_ARRECADADO_ACUM)

    print(f"\n  Total arrecadado:          {fmt(total_arrecad)}")
    print(f"  Exceto intra-orç.:         {fmt(total_exceto)}")
    print(f"    Receitas correntes:      {fmt(rec_correntes)}")
    pct_trib = (tributaria / rec_correntes * 100) if rec_correntes else 0
    pct_transf = (transferencias / rec_correntes * 100) if rec_correntes else 0
    print(f"      Tributária:            {fmt(tributaria)}  ({pct_trib:.1f}% das correntes)")
    print(f"      Transferências:        {fmt(transferencias)}  ({pct_transf:.1f}% das correntes)")
    print(f"    Receitas de capital:     {fmt(capital)}")

    print(f"\n  -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Extrai receitas por categoria (RREO Anexo 01)")
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
