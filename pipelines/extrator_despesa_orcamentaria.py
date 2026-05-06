"""
Extrai o Livro Registro Analitico da Despesa Orcamentaria de Sorocaba.

O resultado liga nota de empenho, fornecedor e classificacao orcamentaria.
Saida em data/extracted/sorocaba/execucao/saida; nao publicar sem validacao.
"""
import argparse
import csv
import re
from pathlib import Path

import fitz

from paths import EXECUCAO_EXTRACTED_DIR, EXECUCAO_RAW_DIR


ORGAO_RE = re.compile(r"Orgao\s+\.+:\s*(\d+)")
UNIDADE_RE = re.compile(r"Unid\. Orc\.\s*:\s*(\d+)\s+([\d.]+)\s+([\d.]+-\d+\.\d+)")
UNID_DESP_RE = re.compile(r"Unid\. Desp:\s*(\d+)")
MOV_RE = re.compile(
    r"^\s*(\d{2}/\d{2})\s+(\d{5})\s+(\d{5})\s+(.+?)\s+(\d+)\s+"
    r"(-?\d{1,3}(?:\.\d{3})*,\d{2})\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})\s+"
    r"(-?\d{1,3}(?:\.\d{3})*,\d{2})\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})\s*$"
)


def br_float(valor: str) -> float:
    if not valor:
        return 0.0
    return float(valor.replace(".", "").replace(",", "."))


def extrair_pdf(pdf_path: Path, ano: int, limite_paginas: int | None = None):
    doc = fitz.open(pdf_path)
    classif = {
        "orgao": "",
        "unidade_orcamentaria": "",
        "unidade_despesa": "",
        "natureza_despesa": "",
        "programa_trabalho": "",
    }
    registros = []

    total_paginas = doc.page_count if limite_paginas is None else min(doc.page_count, limite_paginas)
    for page_index in range(total_paginas):
        text = doc.load_page(page_index).get_text("text")
        for line in text.splitlines():
            orgao = ORGAO_RE.search(line)
            if orgao:
                classif["orgao"] = orgao.group(1)

            unidade = UNIDADE_RE.search(line)
            if unidade:
                classif["unidade_orcamentaria"] = unidade.group(1)
                classif["natureza_despesa"] = unidade.group(2)
                classif["programa_trabalho"] = unidade.group(3)

            unidade_desp = UNID_DESP_RE.search(line)
            if unidade_desp:
                classif["unidade_despesa"] = unidade_desp.group(1)

            mov = MOV_RE.match(line)
            if not mov:
                continue

            registros.append({
                "ano": ano,
                "pagina": page_index + 1,
                "orgao": classif["orgao"],
                "unidade_orcamentaria": classif["unidade_orcamentaria"],
                "unidade_despesa": classif["unidade_despesa"],
                "natureza_despesa": classif["natureza_despesa"],
                "programa_trabalho": classif["programa_trabalho"],
                "data": f"{mov.group(1)}/{ano}",
                "documento_despesa": mov.group(2),
                "nota_empenho": mov.group(3),
                "fornecedor_nome": mov.group(4).strip(),
                "fornecedor_codigo": mov.group(5),
                "despesa_paga_no_dia": mov.group(6),
                "despesa_paga_no_dia_num": br_float(mov.group(6)),
                "despesa_paga_ate_data": mov.group(7),
                "despesa_paga_ate_data_num": br_float(mov.group(7)),
                "empenhada_ate_data": mov.group(8),
                "empenhada_ate_data_num": br_float(mov.group(8)),
                "empenhos_a_pagar": mov.group(9),
                "empenhos_a_pagar_num": br_float(mov.group(9)),
                "fonte_arquivo": pdf_path.name,
            })

    return registros


def escrever_csv(registros, destino: Path):
    destino.parent.mkdir(parents=True, exist_ok=True)
    campos = [
        "ano",
        "pagina",
        "orgao",
        "unidade_orcamentaria",
        "unidade_despesa",
        "natureza_despesa",
        "programa_trabalho",
        "data",
        "documento_despesa",
        "nota_empenho",
        "fornecedor_nome",
        "fornecedor_codigo",
        "despesa_paga_no_dia",
        "despesa_paga_no_dia_num",
        "despesa_paga_ate_data",
        "despesa_paga_ate_data_num",
        "empenhada_ate_data",
        "empenhada_ate_data_num",
        "empenhos_a_pagar",
        "empenhos_a_pagar_num",
        "fonte_arquivo",
    ]
    with destino.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(registros)


def main():
    parser = argparse.ArgumentParser(description="Extrai Registro Analitico da Despesa Orcamentaria")
    parser.add_argument("--ano", type=int, required=True)
    parser.add_argument("--entrada")
    parser.add_argument("--saida")
    parser.add_argument("--limite-paginas", type=int)
    args = parser.parse_args()

    entrada = Path(args.entrada) if args.entrada else (
        EXECUCAO_RAW_DIR / "livros_contabeis" / str(args.ano) / f"livro_registro_analitico_despesa_orcamentaria_{args.ano}.pdf"
    )
    saida = Path(args.saida) if args.saida else (
        EXECUCAO_EXTRACTED_DIR / "saida" / f"despesa_orcamentaria_sorocaba_{args.ano}.csv"
    )

    registros = extrair_pdf(entrada, args.ano, args.limite_paginas)
    escrever_csv(registros, saida)
    print(f"Registros extraidos: {len(registros)}")
    print(f"Saida: {saida}")


if __name__ == "__main__":
    main()
