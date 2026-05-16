"""
Extrai PDFs em que o Registro Analitico da Despesa sai com texto verticalizado.

Alguns livros contabeis grandes de Sorocaba retornam texto em colunas quando
lidos pelo PyMuPDF. Este extrator usa coordenadas das palavras para reconstruir
as linhas de movimento. Saida em data/extracted; nao publicar sem validacao.
"""
import argparse
import csv
import re
from pathlib import Path

import fitz

from paths import EXECUCAO_EXTRACTED_DIR, EXECUCAO_RAW_DIR


DATA_RE = re.compile(r"^\d{2}/\d{2}$")
VALOR_RE = re.compile(r"^-?\d{1,3}(?:\.\d{3})*,\d{2}$")
NATUREZA_RE = re.compile(r"^\d\.\d\.\d{2}\.\d{2}\.\d{2}$")
PROGRAMA_RE = re.compile(r"^\d{2}\.\d{3}\.\d{4}-\d\.\d{3}$")


def br_float(valor: str) -> float:
    if not valor:
        return 0.0
    return float(valor.replace(".", "").replace(",", "."))


def apenas_digitos(valor: str) -> str:
    return "".join(ch for ch in valor if ch.isdigit())


def palavras_da_linha(words, x_ref: float, tolerancia: float = 2.2):
    return [w for w in words if abs(w[0] - x_ref) <= tolerancia]


def texto_coluna(row_words, y_min: float, y_max: float) -> str:
    partes = [
        (y0, text)
        for _x0, y0, _x1, _y1, text, *_rest in row_words
        if y_min <= y0 <= y_max
    ]
    return " ".join(text for _y, text in sorted(partes, key=lambda item: item[0], reverse=True)).strip()


def primeiro_valor_coluna(row_words, y_min: float, y_max: float) -> str:
    for _x0, y0, _x1, _y1, text, *_rest in sorted(row_words, key=lambda w: w[1], reverse=True):
        if y_min <= y0 <= y_max and VALOR_RE.match(text):
            return text
    return ""


def contexto_pagina(words, contexto_anterior: dict[str, str] | None = None) -> dict[str, str]:
    contexto = {
        "orgao": "",
        "unidade_orcamentaria": "",
        "unidade_despesa": "",
        "natureza_despesa": "",
        "programa_trabalho": "",
    }
    if contexto_anterior:
        contexto.update(contexto_anterior)

    natureza = ""
    programa = ""
    textos = {text for *_coords, text, _block, _line, _word in words}
    for x0, _y0, _x1, _y1, text, *_rest in words:
        if 45 <= x0 <= 80 and NATUREZA_RE.match(text):
            natureza = text
        if 45 <= x0 <= 80 and PROGRAMA_RE.match(text):
            programa = text
    if {"Prefeitura", "Municipal", "de", "Sorocaba"}.issubset(textos):
        contexto["orgao"] = "Prefeitura Municipal de Sorocaba"
    if natureza:
        contexto["natureza_despesa"] = natureza
    if programa:
        contexto["programa_trabalho"] = programa
    return contexto


def extrair_pagina(
    page,
    ano: int,
    pagina: int,
    fonte_arquivo: str,
    ultimo_contexto_linha: dict[str, str] | None = None,
    ultimo_contexto_pagina: dict[str, str] | None = None,
) -> list[dict[str, object]]:
    words = page.get_text("words")
    contexto = contexto_pagina(words, ultimo_contexto_pagina)
    if ultimo_contexto_pagina is not None:
        ultimo_contexto_pagina.update(contexto)
    registros = []

    datas = [
        (x0, text)
        for x0, y0, _x1, _y1, text, *_rest in words
        if 720 <= y0 <= 735 and DATA_RE.match(text)
    ]

    if ultimo_contexto_linha is None:
        ultimo_contexto_linha = {
            "documento": "",
            "empenho": "",
            "fornecedor_nome": "",
            "fornecedor_codigo": "",
        }

    for x_ref, data in sorted(datas, key=lambda item: item[0]):
        row_words = palavras_da_linha(words, x_ref)
        documento = apenas_digitos(texto_coluna(row_words, 690, 704))
        empenho = apenas_digitos(texto_coluna(row_words, 655, 668))
        fornecedor_nome = texto_coluna(row_words, 540, 635)
        fornecedor_codigo = apenas_digitos(texto_coluna(row_words, 465, 478))
        campos_herdados = []

        if documento:
            ultimo_contexto_linha["documento"] = documento
        else:
            documento = ultimo_contexto_linha["documento"]
            if documento:
                campos_herdados.append("documento_despesa")

        if empenho:
            ultimo_contexto_linha["empenho"] = empenho
        else:
            empenho = ultimo_contexto_linha["empenho"]
            if empenho:
                campos_herdados.append("nota_empenho")

        if fornecedor_nome:
            ultimo_contexto_linha["fornecedor_nome"] = fornecedor_nome
        else:
            fornecedor_nome = ultimo_contexto_linha["fornecedor_nome"]
            if fornecedor_nome:
                campos_herdados.append("fornecedor_nome")

        if fornecedor_codigo:
            ultimo_contexto_linha["fornecedor_codigo"] = fornecedor_codigo
        else:
            fornecedor_codigo = ultimo_contexto_linha["fornecedor_codigo"]
            if fornecedor_codigo:
                campos_herdados.append("fornecedor_codigo")

        if not documento or not empenho or not fornecedor_nome:
            continue

        paga_no_dia = primeiro_valor_coluna(row_words, 385, 405)
        paga_ate_data = primeiro_valor_coluna(row_words, 300, 315)
        empenhada_ate_data = primeiro_valor_coluna(row_words, 225, 238)
        empenhos_a_pagar = primeiro_valor_coluna(row_words, 150, 165)

        registros.append({
            "ano": ano,
            "pagina": pagina,
            "orgao": contexto["orgao"],
            "unidade_orcamentaria": contexto["unidade_orcamentaria"],
            "unidade_despesa": contexto["unidade_despesa"],
            "natureza_despesa": contexto["natureza_despesa"],
            "programa_trabalho": contexto["programa_trabalho"],
            "data": f"{data}/{ano}",
            "documento_despesa": documento,
            "nota_empenho": empenho,
            "fornecedor_nome": fornecedor_nome,
            "fornecedor_codigo": fornecedor_codigo,
            "campos_herdados": ";".join(campos_herdados),
            "despesa_paga_no_dia": paga_no_dia,
            "despesa_paga_no_dia_num": br_float(paga_no_dia),
            "despesa_paga_ate_data": paga_ate_data,
            "despesa_paga_ate_data_num": br_float(paga_ate_data),
            "empenhada_ate_data": empenhada_ate_data,
            "empenhada_ate_data_num": br_float(empenhada_ate_data),
            "empenhos_a_pagar": empenhos_a_pagar,
            "empenhos_a_pagar_num": br_float(empenhos_a_pagar),
            "fonte_arquivo": fonte_arquivo,
        })

    return registros


def escrever_csv(registros: list[dict[str, object]], destino: Path) -> None:
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
        "campos_herdados",
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
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(registros)


def main() -> None:
    parser = argparse.ArgumentParser(description="Extrai despesa orcamentaria verticalizada")
    parser.add_argument("--ano", type=int, required=True)
    parser.add_argument("--entrada")
    parser.add_argument("--inicio-pagina", type=int, default=1)
    parser.add_argument("--fim-pagina", type=int)
    parser.add_argument("--saida")
    args = parser.parse_args()

    entrada = Path(args.entrada) if args.entrada else (
        EXECUCAO_RAW_DIR / "livros_contabeis" / str(args.ano) / f"livro_registro_analitico_despesa_orcamentaria_{args.ano}.pdf"
    )
    destino = Path(args.saida) if args.saida else (
        EXECUCAO_EXTRACTED_DIR / "saida_fatiada" / str(args.ano) / f"despesa_orcamentaria_vertical_sorocaba_{args.ano}_p{args.inicio_pagina:06d}_{(args.fim_pagina or args.inicio_pagina):06d}.csv"
    )

    registros = []
    ultimo_contexto_linha = {
        "documento": "",
        "empenho": "",
        "fornecedor_nome": "",
        "fornecedor_codigo": "",
    }
    ultimo_contexto_pagina = {
        "orgao": "",
        "unidade_orcamentaria": "",
        "unidade_despesa": "",
        "natureza_despesa": "",
        "programa_trabalho": "",
    }
    with fitz.open(entrada) as doc:
        fim = args.fim_pagina or doc.page_count
        fim = min(fim, doc.page_count)
        for pagina in range(args.inicio_pagina, fim + 1):
            registros.extend(
                extrair_pagina(
                    doc.load_page(pagina - 1),
                    args.ano,
                    pagina,
                    entrada.name,
                    ultimo_contexto_linha,
                    ultimo_contexto_pagina,
                )
            )

    escrever_csv(registros, destino)
    print(f"Paginas: {args.inicio_pagina}-{fim}")
    print(f"Registros extraidos: {len(registros)}")
    print(f"Saida: {destino}")


if __name__ == "__main__":
    main()
