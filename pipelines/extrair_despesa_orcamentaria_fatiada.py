"""
Extrai o Registro Analitico da Despesa Orcamentaria por fatias de paginas.

Use para PDFs grandes. O script escreve um CSV por lote e um checkpoint em
data/extracted, permitindo retomada sem reprocessar o arquivo inteiro.
"""
import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

import fitz

from extrator_despesa_orcamentaria import extrair_pdf
from paths import EXECUCAO_EXTRACTED_DIR, EXECUCAO_RAW_DIR


CAMPOS = [
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


def escrever_lote(registros: list[dict[str, object]], destino: Path) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CAMPOS)
        writer.writeheader()
        writer.writerows(registros)


def salvar_checkpoint(path: Path, dados: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Extrai despesa orcamentaria por lotes")
    parser.add_argument("--ano", type=int, required=True)
    parser.add_argument("--entrada")
    parser.add_argument("--inicio-pagina", type=int, default=1, help="Pagina inicial 1-based")
    parser.add_argument("--lote-paginas", type=int, default=250)
    parser.add_argument("--max-lotes", type=int, default=1)
    args = parser.parse_args()

    entrada = Path(args.entrada) if args.entrada else (
        EXECUCAO_RAW_DIR / "livros_contabeis" / str(args.ano) / f"livro_registro_analitico_despesa_orcamentaria_{args.ano}.pdf"
    )
    if not entrada.exists():
        raise FileNotFoundError(entrada)

    with fitz.open(entrada) as doc:
        total_paginas = doc.page_count

    base_saida = EXECUCAO_EXTRACTED_DIR / "saida_fatiada" / str(args.ano)
    checkpoint = base_saida / "checkpoint_despesa_orcamentaria.json"
    inicio = max(args.inicio_pagina, 1)

    for lote in range(args.max_lotes):
        pagina_inicial = inicio + lote * args.lote_paginas
        if pagina_inicial > total_paginas:
            break
        pagina_final = min(pagina_inicial + args.lote_paginas - 1, total_paginas)

        registros = extrair_pdf(entrada, args.ano, limite_paginas=pagina_final)
        registros = [r for r in registros if pagina_inicial <= int(r["pagina"]) <= pagina_final]

        destino = base_saida / f"despesa_orcamentaria_sorocaba_{args.ano}_p{pagina_inicial:06d}_{pagina_final:06d}.csv"
        escrever_lote(registros, destino)
        salvar_checkpoint(checkpoint, {
            "ano": args.ano,
            "arquivo": str(entrada),
            "total_paginas": total_paginas,
            "ultima_pagina_processada": pagina_final,
            "lote_paginas": args.lote_paginas,
            "ultimo_lote": str(destino),
            "registros_ultimo_lote": len(registros),
            "atualizado_em": datetime.now(timezone.utc).isoformat(),
        })
        print(f"{args.ano}: paginas {pagina_inicial}-{pagina_final}, registros {len(registros)}")

    print(f"Checkpoint: {checkpoint}")


if __name__ == "__main__":
    main()
