"""
Valida a extracao vertical de despesa contra o PDF e o livro de fornecedores.

Esta validacao nao publica dados. Ela classifica a extracao como publicavel
somente quando todos os candidatos do PDF foram extraidos, campos obrigatorios
estao preenchidos e todos os registros cruzam com fornecedor + nota de empenho.
"""
import argparse
import csv
import re
from pathlib import Path

import fitz

from paths import DATA_DIR, EXECUCAO_EXTRACTED_DIR, EXECUCAO_RAW_DIR


DATA_RE = re.compile(r"^\d{2}/\d{2}$")


def carregar_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def contar_candidatos_pdf(path: Path) -> tuple[int, int]:
    candidatos = 0
    paginas_com_data = 0
    with fitz.open(path) as doc:
        for page in doc:
            words = page.get_text("words")
            datas = [
                text
                for _x0, y0, _x1, _y1, text, *_rest in words
                if 720 <= y0 <= 735 and DATA_RE.match(text)
            ]
            if datas:
                paginas_com_data += 1
            candidatos += len(datas)
    return candidatos, paginas_com_data


def main() -> None:
    parser = argparse.ArgumentParser(description="Valida despesa vertical extraida")
    parser.add_argument("--ano", type=int, required=True)
    parser.add_argument("--despesa-csv")
    parser.add_argument("--saida")
    args = parser.parse_args()

    raw_pdf = (
        EXECUCAO_RAW_DIR
        / "livros_contabeis"
        / str(args.ano)
        / f"livro_registro_analitico_despesa_orcamentaria_{args.ano}.pdf"
    )
    despesa_csv = Path(args.despesa_csv) if args.despesa_csv else (
        EXECUCAO_EXTRACTED_DIR
        / "saida"
        / f"despesa_orcamentaria_sorocaba_{args.ano}.csv"
    )
    fornecedor_csv = (
        EXECUCAO_EXTRACTED_DIR
        / "saida"
        / f"conta_corrente_fornecedor_sorocaba_{args.ano}.csv"
    )
    destino = Path(args.saida) if args.saida else (
        DATA_DIR / "manifests" / f"validacao_despesa_vertical_sorocaba_{args.ano}.csv"
    )

    candidatos, paginas_com_data = contar_candidatos_pdf(raw_pdf)
    despesa = carregar_csv(despesa_csv)
    fornecedor = carregar_csv(fornecedor_csv)
    fornecedor_keys = {(r["fornecedor_codigo"], r["nota_empenho"]) for r in fornecedor}

    campos_obrigatorios = (
        "orgao",
        "natureza_despesa",
        "programa_trabalho",
        "data",
        "documento_despesa",
        "nota_empenho",
        "fornecedor_nome",
        "fornecedor_codigo",
    )
    vazios = {
        campo: sum(1 for row in despesa if not row.get(campo))
        for campo in campos_obrigatorios
    }
    sem_par_fornecedor = sum(
        1
        for row in despesa
        if (row["fornecedor_codigo"], row["nota_empenho"]) not in fornecedor_keys
    )
    campos_herdados = sum(1 for row in despesa if row.get("campos_herdados"))

    publicavel = (
        len(despesa) == candidatos
        and sem_par_fornecedor == 0
        and all(valor == 0 for valor in vazios.values())
    )

    linha = {
        "municipio": "Sorocaba",
        "ano": args.ano,
        "pdf_candidatos_data": candidatos,
        "pdf_paginas_com_data": paginas_com_data,
        "despesa_registros": len(despesa),
        "fornecedor_registros": len(fornecedor),
        "cobertura_pdf": f"{len(despesa)}/{candidatos}",
        "despesa_csv": str(despesa_csv),
        "sem_par_fornecedor_codigo_nota": sem_par_fornecedor,
        "registros_com_campos_herdados": campos_herdados,
        "campos_obrigatorios_vazios": ";".join(
            f"{campo}={valor}" for campo, valor in vazios.items() if valor
        ),
        "status_publicacao": "publicavel" if publicavel else "nao_publicar",
        "observacao": (
            "Extracao cobre todos os candidatos de data do PDF, mas exige saneamento "
            "das divergencias com fornecedor+nota antes de publicacao."
            if not publicavel
            else "Extracao validada localmente."
        ),
    }

    destino.parent.mkdir(parents=True, exist_ok=True)
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(linha))
        writer.writeheader()
        writer.writerow(linha)

    for chave, valor in linha.items():
        print(f"{chave}: {valor}")
    if not publicavel:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
