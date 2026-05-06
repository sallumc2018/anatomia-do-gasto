"""
Compara CSVs publicados/validados de educacao com os PDFs oficiais locais.

Escopo atual: Sorocaba, Educacao, anos publicados no site.
"""
import argparse
import csv
import os
import sys
from pathlib import Path

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from extrator_educacao import processar_trimestre
from paths import EDUCACAO_EXTRACTED_DIR, EDUCACAO_PUBLIC_DIR, EDUCACAO_RAW_DIR, EDUCACAO_VALIDATED_DIR, as_str


COLUNAS_DESPESAS = ["Dotacao_Atualizada", "Empenhada", "Liquidada", "Paga"]
COLUNAS_RECEITAS = [
    "Proprios_Previsao",
    "Proprios_Arrecadado",
    "Transferencias_Federais_Previsao",
    "Transferencias_Federais_Arrecadado",
    "Transferencias_Estaduais_Previsao",
    "Transferencias_Estaduais_Arrecadado",
    "Total_Base_Previsao",
    "Total_Base_Arrecadado",
    "Minimo_Educacao_Previsao",
    "Minimo_Educacao_Arrecadado",
    "Percentual_Aplicado_Liquidado",
]


def normalizar(valor):
    return float(str(valor).replace(".", "").replace(",", "."))


def formatar_br(valor):
    return f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def escolher_csv(nome):
    candidatos = [
        EDUCACAO_PUBLIC_DIR / "saida" / nome,
        EDUCACAO_VALIDATED_DIR / "saida" / nome,
        EDUCACAO_EXTRACTED_DIR / "saida" / nome,
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

    for trimestre in range(1, 5):
      nome = f"{ano}-{trimestre}-trimestre-relatorios-de-aplicacao-no-ensino.pdf"
      pdf_path = EDUCACAO_RAW_DIR / "entrada" / nome
      if not pdf_path.exists():
          raise FileNotFoundError(as_str(pdf_path))

      receita, linhas_despesa = processar_trimestre(as_str(pdf_path), trimestre)
      for row in linhas_despesa or []:
          despesas[(row["trimestre"], row["funcao"])] = row
      if receita:
          receita["trimestre"] = trimestre
          receitas[trimestre] = receita

    return despesas, receitas


def verificar_despesas(ano, bruto):
    csv_path = escolher_csv(f"despesas_educacao_sorocaba_{ano}.csv")
    if not csv_path.exists():
        return [f"CSV ausente: {csv_path}"], 0, 0

    erros = []
    ok = 0
    total = 0
    chaves_csv = set()

    for row in ler_csv(csv_path):
        chave = (int(row["Quadrimestre"]), row["Funcao"])
        if chave in chaves_csv:
            erros.append(f"Despesa duplicada no CSV: Q{chave[0]} {chave[1]}")
            continue
        chaves_csv.add(chave)
        if chave not in bruto:
            erros.append(f"Despesa ausente no PDF: Q{chave[0]} {chave[1]}")
            continue

        esperado = bruto[chave]
        for col in COLUNAS_DESPESAS:
            total += 1
            csv_val = normalizar(row[col])
            esperado_val = esperado[col.lower()] if col != "Dotacao_Atualizada" else esperado["dotacao"]
            if abs(csv_val - esperado_val) > 0.005:
                erros.append(f"Despesa Q{chave[0]} {chave[1]} {col}: CSV={row[col]} PDF={formatar_br(esperado_val)}")
            else:
                ok += 1

    for chave in sorted(set(bruto) - chaves_csv):
        erros.append(f"Despesa ausente no CSV: Q{chave[0]} {chave[1]}")

    return erros, ok, total


def verificar_receitas(ano, bruto):
    csv_path = escolher_csv(f"receitas_base_educacao_sorocaba_{ano}.csv")
    if not csv_path.exists():
        return [f"CSV ausente: {csv_path}"], 0, 0

    mapa = {
        "Proprios_Previsao": "proprios_previsao",
        "Proprios_Arrecadado": "proprios_arrecadado",
        "Transferencias_Federais_Previsao": "transferencias_federais_previsao",
        "Transferencias_Federais_Arrecadado": "transferencias_federais_arrecadado",
        "Transferencias_Estaduais_Previsao": "transferencias_estaduais_previsao",
        "Transferencias_Estaduais_Arrecadado": "transferencias_estaduais_arrecadado",
        "Total_Base_Previsao": "total_base_previsao",
        "Total_Base_Arrecadado": "total_base_arrecadado",
        "Minimo_Educacao_Previsao": "minimo_educacao_previsao",
        "Minimo_Educacao_Arrecadado": "minimo_educacao_arrecadado",
        "Percentual_Aplicado_Liquidado": "percentual_aplicado_liquidado",
    }

    erros = []
    ok = 0
    total = 0
    quadrimestres_csv = set()

    for row in ler_csv(csv_path):
        trimestre = int(row["Quadrimestre"])
        if trimestre in quadrimestres_csv:
            erros.append(f"Receita duplicada no CSV: Q{trimestre}")
            continue
        quadrimestres_csv.add(trimestre)
        if trimestre not in bruto:
            erros.append(f"Receita ausente no PDF: Q{trimestre}")
            continue

        esperado = bruto[trimestre]
        for col in COLUNAS_RECEITAS:
            total += 1
            csv_val = normalizar(row[col])
            esperado_val = float(esperado[mapa[col]])
            if abs(csv_val - esperado_val) > 0.005:
                erros.append(f"Receita Q{trimestre} {col}: CSV={row[col]} PDF={formatar_br(esperado_val)}")
            else:
                ok += 1

    for trimestre in sorted(set(bruto) - quadrimestres_csv):
        erros.append(f"Receita ausente no CSV: Q{trimestre}")

    return erros, ok, total


def verificar(ano):
    print(f"Verificando educacao {ano}...")
    despesas_pdf, receitas_pdf = extrair_pdf_ano(ano)

    erros_desp, ok_desp, total_desp = verificar_despesas(ano, despesas_pdf)
    erros_rec, ok_rec, total_rec = verificar_receitas(ano, receitas_pdf)
    erros = erros_desp + erros_rec

    print(f"Despesas: {ok_desp}/{total_desp} valores corretos")
    print(f"Receitas: {ok_rec}/{total_rec} valores corretos")

    if erros:
        print(f"DIVERGENCIAS ({len(erros)}):")
        for erro in erros:
            print(f"  ERRO: {erro}")
        return False

    print("Nenhuma divergencia. Todos os valores batem com os PDFs.")
    return True


def main():
    parser = argparse.ArgumentParser(description="Verifica dados de educacao publicados")
    parser.add_argument("--ano", type=int, action="append", required=True)
    args = parser.parse_args()

    ok = all(verificar(ano) for ano in args.ano)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
