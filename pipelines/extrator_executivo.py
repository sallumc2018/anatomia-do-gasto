"""
Coleta RREO Anexo 02 do SICONFI para Sorocaba e extrai despesas por função.

Produz por ano: despesas_executivo_sorocaba_{ano}.csv
Colunas: Funcao, Dotacao_Inicial, Dotacao_Atualizada, Empenhado, Liquidado,
          Exceto_Intra_Liquidado, Intra_Liquidado, Fonte_URL

O RREO Anexo 02 agrega Executivo + Câmara + demais poderes. A filtragem por
função (whitelist das 28 funções orçamentárias) evita dupla-contagem com
subfunções que também aparecem na resposta da API.

Uso:
    python extrator_executivo.py
    python extrator_executivo.py --ano 2024
"""
import argparse
import csv
import json
import os
import sys
import urllib.request

from paths import CFG, MUNICIPIO, as_str, EXECUTIVO_EXTRACTED_DIR

IBGE_SOROCABA = int(CFG["ibge"])
BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo"

# 28 funções orçamentárias oficiais (Portaria SOF 42/1999 e atualizações)
# + Reserva de Contingência (item especial do orçamento municipal)
FUNCOES_OFICIAIS = {
    "Legislativa",
    "Judiciária",
    "Essencial à Justiça",
    "Administração",
    "Defesa Nacional",
    "Segurança Pública",
    "Relações Exteriores",
    "Assistência Social",
    "Previdência Social",
    "Saúde",
    "Trabalho",
    "Educação",
    "Cultura",
    "Direitos da Cidadania",
    "Urbanismo",
    "Habitação",
    "Saneamento",
    "Gestão Ambiental",
    "Ciência e Tecnologia",
    "Agricultura",
    "Organização Agrária",
    "Indústria",
    "Comércio e Serviços",
    "Comunicações",
    "Energia",
    "Transporte",
    "Desporto e Lazer",
    "Encargos Especiais",
    "Reserva de Contingência",
}

COL_DOTACAO_INICIAL   = "DOTAÇÃO INICIAL"
COL_DOTACAO_ATUAL     = "DOTAÇÃO ATUALIZADA (a)"
COL_EMPENHADO         = "DESPESAS EMPENHADAS ATÉ O BIMESTRE (b)"
COL_LIQUIDADO         = "DESPESAS LIQUIDADAS ATÉ O BIMESTRE (d)"

COD_EXCETO_INTRA = "RREO2TotalDespesas"
COD_INTRA        = "RREO2TotalDespesasIntra"
COD_TOTAIS = {COD_EXCETO_INTRA, COD_INTRA}


def fetch_anexo02(ano):
    url = (
        f"{BASE_URL}?an_exercicio={ano}&nr_periodo=6"
        f"&co_tipo_demonstrativo=RREO&id_ente={IBGE_SOROCABA}"
        f"&no_anexo=RREO-Anexo%2002&co_poder=E"
    )
    print(f"  Baixando Anexo 02 — {ano}...")
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    items = data.get("items", [])
    print(f"  {len(items)} registros")
    return items, url


def extrair_funcoes(items):
    """
    Agrega por (funcao, coluna) somando exceto-intra e intra.
    Retorna dict: funcao -> {col: valor_total, col+'_exceto': val, col+'_intra': val}
    """
    # acumuladores: {funcao: {coluna: {exceto: float, intra: float}}}
    acc = {}

    for item in items:
        conta = item.get("conta", "")
        if conta not in FUNCOES_OFICIAIS:
            continue
        cod   = item.get("cod_conta", "")
        if cod not in COD_TOTAIS:
            continue
        col   = item.get("coluna", "")
        valor = float(item.get("valor") or 0)

        if conta not in acc:
            acc[conta] = {}
        if col not in acc[conta]:
            acc[conta][col] = {"exceto": 0.0, "intra": 0.0}

        if cod == COD_EXCETO_INTRA:
            acc[conta][col]["exceto"] += valor
        else:
            acc[conta][col]["intra"] += valor

    return acc


def get_val(acc, funcao, col, component=None):
    d = acc.get(funcao, {}).get(col, {})
    if component:
        return d.get(component, 0.0)
    return d.get("exceto", 0.0) + d.get("intra", 0.0)


def salvar_csv(ano, acc, fonte_url):
    saida_dir = as_str(EXECUTIVO_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)

    funcoes_presentes = sorted(acc.keys())
    caminho = os.path.join(saida_dir, f"despesas_executivo_{MUNICIPIO}_{ano}.csv")

    campos = [
        "Funcao",
        "Dotacao_Inicial", "Dotacao_Atualizada",
        "Empenhado", "Liquidado",
        "Exceto_Intra_Liquidado", "Intra_Liquidado",
        "Fonte_URL",
    ]

    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        for fn in funcoes_presentes:
            w.writerow({
                "Funcao":               fn,
                "Dotacao_Inicial":      f"{get_val(acc, fn, COL_DOTACAO_INICIAL):.2f}",
                "Dotacao_Atualizada":   f"{get_val(acc, fn, COL_DOTACAO_ATUAL):.2f}",
                "Empenhado":            f"{get_val(acc, fn, COL_EMPENHADO):.2f}",
                "Liquidado":            f"{get_val(acc, fn, COL_LIQUIDADO):.2f}",
                "Exceto_Intra_Liquidado": f"{get_val(acc, fn, COL_LIQUIDADO, 'exceto'):.2f}",
                "Intra_Liquidado":      f"{get_val(acc, fn, COL_LIQUIDADO, 'intra'):.2f}",
                "Fonte_URL":            fonte_url,
            })

        # linha de total
        total_liq = sum(get_val(acc, fn, COL_LIQUIDADO) for fn in funcoes_presentes)
        total_dot = sum(get_val(acc, fn, COL_DOTACAO_INICIAL) for fn in funcoes_presentes)
        total_atu = sum(get_val(acc, fn, COL_DOTACAO_ATUAL) for fn in funcoes_presentes)
        total_emp = sum(get_val(acc, fn, COL_EMPENHADO) for fn in funcoes_presentes)
        total_exc = sum(get_val(acc, fn, COL_LIQUIDADO, "exceto") for fn in funcoes_presentes)
        total_int = sum(get_val(acc, fn, COL_LIQUIDADO, "intra") for fn in funcoes_presentes)
        w.writerow({
            "Funcao":               "TOTAL",
            "Dotacao_Inicial":      f"{total_dot:.2f}",
            "Dotacao_Atualizada":   f"{total_atu:.2f}",
            "Empenhado":            f"{total_emp:.2f}",
            "Liquidado":            f"{total_liq:.2f}",
            "Exceto_Intra_Liquidado": f"{total_exc:.2f}",
            "Intra_Liquidado":      f"{total_int:.2f}",
            "Fonte_URL":            fonte_url,
        })

    return caminho, funcoes_presentes, total_liq, total_dot


def fmt(v):
    return f"R$ {v:>18,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def processar_ano(ano):
    print(f"\n{'='*55}")
    print(f"  Executivo — {ano}")
    print(f"{'='*55}")

    try:
        items, fonte_url = fetch_anexo02(ano)
    except Exception as e:
        print(f"  ERRO: {e}")
        return False

    acc = extrair_funcoes(items)
    if not acc:
        print("  ATENÇÃO: nenhuma função encontrada")
        return False

    caminho, funcoes, total_liq, total_dot = salvar_csv(ano, acc, fonte_url)

    print(f"\n  {len(funcoes)} funções encontradas:")
    funcoes_sorted = sorted(funcoes, key=lambda fn: -get_val(acc, fn, COL_LIQUIDADO))
    for fn in funcoes_sorted:
        liq = get_val(acc, fn, COL_LIQUIDADO)
        dot = get_val(acc, fn, COL_DOTACAO_INICIAL)
        pct = (liq / total_liq * 100) if total_liq else 0
        print(f"    {fn:30s}  fixado: {fmt(dot)}  liquidado: {fmt(liq)}  ({pct:.1f}%)")

    print(f"\n  TOTAL liquidado:  {fmt(total_liq)}")
    print(f"  TOTAL fixado:     {fmt(total_dot)}")
    print(f"\n  -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Extrai despesas por função (RREO Anexo 02)")
    parser.add_argument("--ano", type=int, action="append",
                        help="Ano (padrão: 2020–2025)")
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
