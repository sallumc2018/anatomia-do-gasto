"""
Diagnostica cobertura do extrator vertical de despesa orcamentaria.

Conta candidatos de movimento por data e mostra por que cada candidato nao vira
registro publicavel. O resultado serve para calibrar o parser antes de qualquer
uso em data/public.
"""
import argparse
import csv
import re
from collections import Counter
from pathlib import Path

import fitz

from extrator_despesa_orcamentaria_vertical import palavras_da_linha, texto_coluna
from paths import EXECUCAO_RAW_DIR


DATA_RE = re.compile(r"^\d{2}/\d{2}$")


def resumo_linha(row_words) -> str:
    partes = [
        f"{y0:.1f}:{text}"
        for _x0, y0, _x1, _y1, text, *_rest in sorted(
            row_words, key=lambda word: word[1], reverse=True
        )
        if 120 <= y0 <= 735
    ]
    return " | ".join(partes[:80])


def diagnosticar(entrada: Path, ano: int, inicio: int, fim: int, limite_exemplos: int):
    contadores = Counter()
    exemplos = []
    ultimo_contexto_linha = {
        "documento": "",
        "empenho": "",
        "fornecedor_nome_540_635": "",
        "fornecedor_codigo": "",
    }

    with fitz.open(entrada) as doc:
        fim = min(fim, doc.page_count)
        for pagina in range(inicio, fim + 1):
            words = doc.load_page(pagina - 1).get_text("words")
            datas = [
                (x0, y0, text)
                for x0, y0, _x1, _y1, text, *_rest in words
                if 720 <= y0 <= 735 and DATA_RE.match(text)
            ]
            if datas:
                contadores["paginas_com_data"] += 1

            for x_ref, _y_ref, data in sorted(datas, key=lambda item: item[0]):
                contadores["candidatos_data"] += 1
                row_words = palavras_da_linha(words, x_ref)
                campos = {
                    "documento": texto_coluna(row_words, 690, 704),
                    "empenho": texto_coluna(row_words, 655, 668),
                    "fornecedor_nome_540_635": texto_coluna(row_words, 540, 635),
                    "fornecedor_nome_500_645": texto_coluna(row_words, 500, 645),
                    "fornecedor_codigo": texto_coluna(row_words, 465, 478),
                    "paga_no_dia": texto_coluna(row_words, 385, 405),
                    "paga_ate_data": texto_coluna(row_words, 300, 315),
                    "empenhada_ate_data": texto_coluna(row_words, 225, 238),
                    "empenhos_a_pagar": texto_coluna(row_words, 150, 165),
                }
                campos_herdados = []
                for nome in ultimo_contexto_linha:
                    if campos[nome]:
                        ultimo_contexto_linha[nome] = campos[nome]
                    elif ultimo_contexto_linha[nome]:
                        campos[nome] = ultimo_contexto_linha[nome]
                        campos_herdados.append(nome)
                if campos_herdados:
                    contadores["candidatos_com_campo_herdado"] += 1

                obrigatorios = ["documento", "empenho", "fornecedor_nome_540_635"]
                faltantes = [nome for nome in obrigatorios if not campos[nome]]
                if faltantes:
                    contadores["candidatos_descartados"] += 1
                    for nome in faltantes:
                        contadores[f"faltando_{nome}"] += 1
                    if len(exemplos) < limite_exemplos:
                        exemplos.append({
                            "pagina": pagina,
                            "x": f"{x_ref:.2f}",
                            "data": f"{data}/{ano}",
                            "faltantes": ",".join(faltantes),
                            **campos,
                            "palavras": resumo_linha(row_words),
                        })
                else:
                    contadores["candidatos_convertiveis"] += 1

    return contadores, exemplos


def main() -> None:
    parser = argparse.ArgumentParser(description="Diagnostica extracao vertical de despesa")
    parser.add_argument("--ano", type=int, required=True)
    parser.add_argument("--entrada")
    parser.add_argument("--inicio-pagina", type=int, default=1)
    parser.add_argument("--fim-pagina", type=int)
    parser.add_argument("--limite-exemplos", type=int, default=20)
    parser.add_argument("--saida-exemplos")
    args = parser.parse_args()

    entrada = Path(args.entrada) if args.entrada else (
        EXECUCAO_RAW_DIR
        / "livros_contabeis"
        / str(args.ano)
        / f"livro_registro_analitico_despesa_orcamentaria_{args.ano}.pdf"
    )

    with fitz.open(entrada) as doc:
        fim = args.fim_pagina or doc.page_count

    contadores, exemplos = diagnosticar(
        entrada, args.ano, args.inicio_pagina, fim, args.limite_exemplos
    )

    for chave, valor in contadores.most_common():
        print(f"{chave}: {valor}")

    if args.saida_exemplos:
        destino = Path(args.saida_exemplos)
        destino.parent.mkdir(parents=True, exist_ok=True)
        campos = [
            "pagina",
            "x",
            "data",
            "faltantes",
            "documento",
            "empenho",
            "fornecedor_nome_540_635",
            "fornecedor_nome_500_645",
            "fornecedor_codigo",
            "paga_no_dia",
            "paga_ate_data",
            "empenhada_ate_data",
            "empenhos_a_pagar",
            "palavras",
        ]
        with destino.open("w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=campos)
            writer.writeheader()
            writer.writerows(exemplos)
        print(f"Exemplos: {destino}")


if __name__ == "__main__":
    main()
