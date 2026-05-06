"""
Extrai o Livro Conta Corrente de Fornecedor de Sorocaba para CSV.

Saida em data/extracted/sorocaba/execucao/saida. Este CSV ainda nao e
publicacao: precisa ser validado antes de qualquer copia para data/public.
"""
import argparse
import csv
import re
from pathlib import Path

import fitz

from paths import EXECUCAO_EXTRACTED_DIR, EXECUCAO_RAW_DIR


FORNECEDOR_RE = re.compile(r"^\s*(\d{4})\s+(\d+)\s+(\d+)\s+(.+?)\s+(\d+)\s*$")
LINHA_RE = re.compile(r"^\s*(\d{2}/\d{2})\s+(\S+)\s+(\d{5})\s{2,}(.*)$")
VALOR_RE = re.compile(r"-?\d{1,3}(?:\.\d{3})*,\d{2}")
IGNORAR_COMPLEMENTO = (
    "CN-SIFPM",
    "CONAM",
    "Prefeitura Municipal de Sorocaba",
    "CONTA CORRENTE FORNECEDOR",
    "Exercicio",
    "Numeracao",
    "Data  Processo",
    "Doc.Desp.",
)


def br_float(valor: str) -> float:
    if not valor:
        return 0.0
    return float(valor.replace(".", "").replace(",", "."))


def parse_valores(trecho: str):
    valores = [(m.group(0), m.start(), m.end()) for m in VALOR_RE.finditer(trecho)]
    credito = debito = saldo = ""

    if len(valores) == 3:
        credito, debito, saldo = [v[0] for v in valores]
    elif len(valores) == 2:
        primeiro, segundo = valores
        if primeiro[1] >= 56:
            debito = primeiro[0]
        else:
            credito = primeiro[0]
        saldo = segundo[0]
    elif len(valores) == 1:
        saldo = valores[0][0]

    inicio_valores = valores[0][1] if valores else len(trecho)
    especificacao = trecho[:inicio_valores].strip()
    saldo_dc = trecho[valores[-1][2]:].strip() if valores else ""
    return especificacao, credito, debito, saldo, saldo_dc


def extrair_pdf(pdf_path: Path, ano: int, limite_paginas: int | None = None):
    doc = fitz.open(pdf_path)
    fornecedor = {
        "nome": "",
        "codigo": "",
        "numeracao": "",
    }
    registros = []
    ultimo = None

    total_paginas = doc.page_count if limite_paginas is None else min(doc.page_count, limite_paginas)
    for page_index in range(total_paginas):
        text = doc.load_page(page_index).get_text("text")
        for raw_line in text.splitlines():
            line = raw_line.rstrip()
            header = FORNECEDOR_RE.match(line)
            if header:
                fornecedor = {
                    "nome": header.group(4).strip(),
                    "codigo": header.group(5).strip(),
                    "numeracao": header.group(3).strip(),
                }
                ultimo = None
                continue

            mov = LINHA_RE.match(line)
            if mov and fornecedor["nome"]:
                especificacao, credito, debito, saldo, saldo_dc = parse_valores(mov.group(4))
                ultimo = {
                    "ano": ano,
                    "pagina": page_index + 1,
                    "fornecedor_nome": fornecedor["nome"],
                    "fornecedor_codigo": fornecedor["codigo"],
                    "fornecedor_numeracao": fornecedor["numeracao"],
                    "data": f"{mov.group(1)}/{ano}",
                    "processo_doc_despesa": mov.group(2),
                    "nota_empenho": mov.group(3),
                    "especificacao": especificacao,
                    "credito": credito,
                    "credito_num": br_float(credito),
                    "debito": debito,
                    "debito_num": br_float(debito),
                    "saldo": saldo,
                    "saldo_num": br_float(saldo),
                    "saldo_dc": saldo_dc,
                    "fonte_arquivo": pdf_path.name,
                }
                registros.append(ultimo)
                continue

            if ultimo and line.startswith(" " * 20):
                complemento = line.strip()
                if complemento and not complemento.startswith("-") and not any(marca in complemento for marca in IGNORAR_COMPLEMENTO):
                    ultimo["especificacao"] = f"{ultimo['especificacao']} {complemento}".strip()

    return registros


def escrever_csv(registros, destino: Path):
    destino.parent.mkdir(parents=True, exist_ok=True)
    campos = [
        "ano",
        "pagina",
        "fornecedor_nome",
        "fornecedor_codigo",
        "fornecedor_numeracao",
        "data",
        "processo_doc_despesa",
        "nota_empenho",
        "especificacao",
        "credito",
        "credito_num",
        "debito",
        "debito_num",
        "saldo",
        "saldo_num",
        "saldo_dc",
        "fonte_arquivo",
    ]
    with destino.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(registros)


def main():
    parser = argparse.ArgumentParser(description="Extrai Conta Corrente de Fornecedor")
    parser.add_argument("--ano", type=int, required=True)
    parser.add_argument("--entrada")
    parser.add_argument("--saida")
    parser.add_argument("--limite-paginas", type=int)
    args = parser.parse_args()

    entrada = Path(args.entrada) if args.entrada else (
        EXECUCAO_RAW_DIR / "livros_contabeis" / str(args.ano) / f"livro_conta_corrente_fornecedor_{args.ano}.pdf"
    )
    saida = Path(args.saida) if args.saida else (
        EXECUCAO_EXTRACTED_DIR / "saida" / f"conta_corrente_fornecedor_sorocaba_{args.ano}.csv"
    )

    registros = extrair_pdf(entrada, args.ano, args.limite_paginas)
    escrever_csv(registros, saida)
    print(f"Registros extraidos: {len(registros)}")
    print(f"Saida: {saida}")


if __name__ == "__main__":
    main()
