"""
Compara CSVs RREO/SUS publicados de saude com os PDFs oficiais locais.
"""
import argparse
import csv
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from extrator_rreo_sus import QUAD, SUBFUNCOES, extrair_bimestre
from paths import SAUDE_PUBLIC_DIR, SAUDE_RAW_DIR, SAUDE_VALIDATED_DIR, as_str


COLUNAS_DESPESAS = [
    "ASPS_Empenhada",
    "ASPS_Liquidada",
    "ASPS_Paga",
    "SUS_Empenhada",
    "SUS_Liquidada",
    "SUS_Paga",
    "Total_Empenhada",
    "Total_Liquidada",
    "Total_Paga",
]

COLUNAS_RECEITAS = [
    "SUS_Total_Previsao",
    "SUS_Total_Arrecadado",
    "SUS_Uniao_Previsao",
    "SUS_Uniao_Arrecadado",
    "SUS_Estados_Previsao",
    "SUS_Estados_Arrecadado",
    "Percentual_ASPS",
]


def normalizar(valor):
    return float(str(valor).replace(".", "").replace(",", "."))


def formatar_br(valor):
    return f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def escolher_csv(nome):
    candidatos = [
        SAUDE_PUBLIC_DIR / "saida" / nome,
        SAUDE_VALIDATED_DIR / "saida" / nome,
    ]
    for path in candidatos:
        if path.exists():
            return path
    return candidatos[0]


def ler_csv(path):
    with path.open(newline="", encoding="utf-8-sig") as file:
        return list(csv.DictReader(file))


def extrair_pdf_ano(ano):
    despesas = {}
    receitas = {}

    for bimestre, quadrimestre in sorted(QUAD.items()):
        pdf_path = SAUDE_RAW_DIR / "rreo" / "entrada" / f"rreo_{ano}_{bimestre}bimestre.pdf"
        if not pdf_path.exists():
            raise FileNotFoundError(as_str(pdf_path))

        asps, sus, rec, pct = extrair_bimestre(as_str(pdf_path))
        for funcao in SUBFUNCOES + ["TOTAL"]:
            a = asps.get(funcao, {})
            s = sus.get(funcao, {})
            despesas[(quadrimestre, funcao)] = {
                "ASPS_Empenhada": a.get("empenhada", 0.0),
                "ASPS_Liquidada": a.get("liquidada", 0.0),
                "ASPS_Paga": a.get("paga", 0.0),
                "SUS_Empenhada": s.get("empenhada", 0.0),
                "SUS_Liquidada": s.get("liquidada", 0.0),
                "SUS_Paga": s.get("paga", 0.0),
                "Total_Empenhada": a.get("empenhada", 0.0) + s.get("empenhada", 0.0),
                "Total_Liquidada": a.get("liquidada", 0.0) + s.get("liquidada", 0.0),
                "Total_Paga": a.get("paga", 0.0) + s.get("paga", 0.0),
            }

        receitas[quadrimestre] = {
            "SUS_Total_Previsao": rec.get("total_previsao", 0.0),
            "SUS_Total_Arrecadado": rec.get("total_arrecadado", 0.0),
            "SUS_Uniao_Previsao": rec.get("uniao_previsao", 0.0),
            "SUS_Uniao_Arrecadado": rec.get("uniao_arrecadado", 0.0),
            "SUS_Estados_Previsao": rec.get("estados_previsao", 0.0),
            "SUS_Estados_Arrecadado": rec.get("estados_arrecadado", 0.0),
            "Percentual_ASPS": pct or 0.0,
        }

    return despesas, receitas


def verificar_despesas(ano, bruto):
    csv_path = escolher_csv(f"rreo_despesas_saude_sorocaba_{ano}.csv")
    if not csv_path.exists():
        return [f"CSV ausente: {csv_path}"], 0, 0

    erros = []
    ok = 0
    total = 0

    for row in ler_csv(csv_path):
        chave = (int(row["Quadrimestre"]), row["Funcao"])
        if chave not in bruto:
            erros.append(f"Despesa RREO ausente no PDF: Q{chave[0]} {chave[1]}")
            continue

        esperado = bruto[chave]
        for col in COLUNAS_DESPESAS:
            total += 1
            csv_val = normalizar(row[col])
            esperado_val = esperado[col]
            if abs(csv_val - esperado_val) > 0.005:
                erros.append(f"Despesa RREO Q{chave[0]} {chave[1]} {col}: CSV={row[col]} PDF={formatar_br(esperado_val)}")
            else:
                ok += 1

    return erros, ok, total


def verificar_receitas(ano, bruto):
    csv_path = escolher_csv(f"rreo_receitas_sus_sorocaba_{ano}.csv")
    if not csv_path.exists():
        return [f"CSV ausente: {csv_path}"], 0, 0

    erros = []
    ok = 0
    total = 0

    for row in ler_csv(csv_path):
        quadrimestre = int(row["Quadrimestre"])
        if quadrimestre not in bruto:
            erros.append(f"Receita RREO ausente no PDF: Q{quadrimestre}")
            continue

        esperado = bruto[quadrimestre]
        for col in COLUNAS_RECEITAS:
            total += 1
            csv_val = normalizar(row[col])
            esperado_val = esperado[col]
            if abs(csv_val - esperado_val) > 0.005:
                erros.append(f"Receita RREO Q{quadrimestre} {col}: CSV={row[col]} PDF={formatar_br(esperado_val)}")
            else:
                ok += 1

    return erros, ok, total


def verificar(ano):
    print(f"Verificando RREO saude {ano}...")
    despesas_pdf, receitas_pdf = extrair_pdf_ano(ano)

    erros_desp, ok_desp, total_desp = verificar_despesas(ano, despesas_pdf)
    erros_rec, ok_rec, total_rec = verificar_receitas(ano, receitas_pdf)
    erros = erros_desp + erros_rec

    print(f"Despesas RREO: {ok_desp}/{total_desp} valores corretos")
    print(f"Receitas RREO: {ok_rec}/{total_rec} valores corretos")

    if erros:
        print(f"DIVERGENCIAS ({len(erros)}):")
        for erro in erros:
            print(f"  ERRO: {erro}")
        return False

    print("Nenhuma divergencia. Todos os valores RREO batem com os PDFs.")
    return True


def main():
    parser = argparse.ArgumentParser(description="Verifica RREO/SUS de saude publicado")
    parser.add_argument("--ano", type=int, action="append", required=True)
    args = parser.parse_args()

    ok = all(verificar(ano) for ano in args.ano)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
