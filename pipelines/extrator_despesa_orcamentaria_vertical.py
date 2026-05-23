"""
Extrai PDFs em que o Registro Analitico da Despesa sai com texto verticalizado.

Alguns livros contabeis grandes de Sorocaba retornam texto em colunas quando
lidos pelo PyMuPDF. Este extrator usa coordenadas das palavras para reconstruir
as linhas de movimento. Saida em data/extracted; nao publicar sem validacao.

Formatos suportados:
- v2021 (A4 595x842): paginas analiticas com data DD/MM na zona y=720-735 +
  paginas analiticas SEM data (campo "data" ausente no PDF, registros com data="").
  O PDF de 2021 contem tres tipos de pagina: (a) analiticas com data [878 pags],
  (b) analiticas sem data [1646 pags — capturadas a partir do fix de 2026-05-23],
  (c) indice FOLHA [557 pags — ignoradas]. Total extraido: ~32k registros.
- v2022 (A4 595x842): paginas analiticas com data DD/MM na zona y=695-710.
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
DOC_RE = re.compile(r"^\d{5}$")

# Faixas y por versao de formato (coordenadas PyMuPDF, eixo y invertido em landscape)
ZONAS: dict[str, dict[str, tuple[float, float]]] = {
    "v2021": {
        "data":             (720, 735),
        "documento":        (690, 704),
        "empenho":          (655, 668),
        "fornecedor_nome":  (540, 635),
        "fornecedor_codigo":(465, 478),
        "paga_no_dia":      (385, 405),
        "paga_ate_data":    (300, 315),
        "empenhada_ate_data":(225, 238),
        "empenhos_a_pagar": (150, 165),
    },
    "v2022": {
        "data":             (695, 710),
        "documento":        (665, 678),
        "empenho":          (628, 642),
        "fornecedor_nome":  (515, 610),
        "fornecedor_codigo":(440, 455),
        "paga_no_dia":      (365, 380),
        "paga_ate_data":    (275, 290),
        "empenhada_ate_data":(199, 213),
        "empenhos_a_pagar": (127, 141),
    },
}


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
    zonas: dict[str, tuple[float, float]] | None = None,
) -> list[dict[str, object]]:
    if zonas is None:
        zonas = ZONAS["v2021"]
    words = page.get_text("words")
    contexto = contexto_pagina(words, ultimo_contexto_pagina)
    if ultimo_contexto_pagina is not None:
        ultimo_contexto_pagina.update(contexto)
    registros = []

    y_data_min, y_data_max = zonas["data"]
    datas = [
        (x0, text)
        for x0, y0, _x1, _y1, text, *_rest in words
        if y_data_min <= y0 <= y_data_max and DATA_RE.match(text)
    ]

    # Páginas analíticas sem data: o campo "data" está vazio mas todos os demais
    # campos estão presentes. Identificadas por: sem datas + sem "FOLHA" + com
    # valores na zona paga_no_dia. Usamos o campo documento como âncora de coluna.
    tem_folha = any(text == "FOLHA" for _x0, _y0, _x1, _y1, text, *_ in words)
    if not datas and not tem_folha:
        y_doc_min, y_doc_max = zonas["documento"]
        y_val_min, y_val_max = zonas["paga_no_dia"]
        tem_valor = any(
            y_val_min <= y0 <= y_val_max and VALOR_RE.match(text)
            for _x0, y0, _x1, _y1, text, *_ in words
        )
        if tem_valor:
            datas = [
                (x0, "")
                for x0, y0, _x1, _y1, text, *_ in words
                if y_doc_min <= y0 <= y_doc_max and DOC_RE.match(text)
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
        documento = apenas_digitos(texto_coluna(row_words, *zonas["documento"]))
        empenho = apenas_digitos(texto_coluna(row_words, *zonas["empenho"]))
        fornecedor_nome = texto_coluna(row_words, *zonas["fornecedor_nome"])
        fornecedor_codigo = apenas_digitos(texto_coluna(row_words, *zonas["fornecedor_codigo"]))
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

        paga_no_dia = primeiro_valor_coluna(row_words, *zonas["paga_no_dia"])
        paga_ate_data = primeiro_valor_coluna(row_words, *zonas["paga_ate_data"])
        empenhada_ate_data = primeiro_valor_coluna(row_words, *zonas["empenhada_ate_data"])
        empenhos_a_pagar = primeiro_valor_coluna(row_words, *zonas["empenhos_a_pagar"])

        registros.append({
            "ano": ano,
            "pagina": pagina,
            "orgao": contexto["orgao"],
            "unidade_orcamentaria": contexto["unidade_orcamentaria"],
            "unidade_despesa": contexto["unidade_despesa"],
            "natureza_despesa": contexto["natureza_despesa"],
            "programa_trabalho": contexto["programa_trabalho"],
            "data": f"{data}/{ano}" if data else "",
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
    parser.add_argument("--formato", choices=["v2021", "v2022"], default=None,
                        help="Versao do layout PDF (padrao: v2021 para anos<=2021, v2022 para anos>=2022)")
    args = parser.parse_args()

    formato = args.formato or ("v2022" if args.ano >= 2022 else "v2021")
    zonas = ZONAS[formato]

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
                    zonas,
                )
            )

    escrever_csv(registros, destino)
    print(f"Paginas: {args.inicio_pagina}-{fim}")
    print(f"Registros extraidos: {len(registros)}")
    print(f"Saida: {destino}")


if __name__ == "__main__":
    main()
