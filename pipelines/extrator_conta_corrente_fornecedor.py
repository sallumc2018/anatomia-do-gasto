"""
Extrai o Livro Conta Corrente de Fornecedor de Sorocaba para CSV.

Saida em data/extracted/sorocaba/execucao/saida. Este CSV ainda nao e
publicacao: precisa ser validado antes de qualquer copia para data/public.

Suporta dois formatos de PDF:
- v2021: texto em linhas (PDFs 2020, 2021, 2024, 2025)
- v2022: palavras posicionadas em colunas (PDFs 2022, 2023)
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
MONEY_RE = re.compile(r"^-?\d{1,3}(?:\.\d{3})*,\d{2}$")
DATE_RE = re.compile(r"^\d{2}/\d{2}$")
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

# Column x-boundaries for v2022 format (PDF points)
_X_YEAR_LO = 140
_X_YEAR_HI = 170
_X_PROC_START = 65
_X_NOTA_START = 100
_X_ESPEC_START = 135
_X_NOME_START = 250
_X_MONEY_START = 335
_X_DEBITO_START = 425
_X_SALDO_START = 480
_X_DC_START = 530
_X_CODIGO_START = 440

# Page-header labels to skip when parsing v2022
_SKIP_LABELS = frozenset({
    "CN-SIFPM", "CONAM", "Prefeitura", "Municipal", "de", "Sorocaba",
    "CONTA", "CORRENTE", "FORNECEDOR",
    "Exercicio", "Numeracao", "Nome", "Codigo",
    "Data", "Processo", "Nota", "Especificacao", "Credito", "Debito", "Saldo", "D/C",
    "Doc.Desp.", "Empenho",
})


def br_float(valor: str) -> float:
    if not valor:
        return 0.0
    return float(valor.replace(".", "").replace(",", "."))


def _group_words_by_y(words):
    """Group (x0,x1,text) tuples by rounded y0 coordinate."""
    groups: dict[int, list] = {}
    for x0, y0, x1, y1, text, *_ in words:
        key = round(y0)
        groups.setdefault(key, []).append((x0, x1, text))
    return {k: sorted(v) for k, v in groups.items()}


def _merge_split_money(row: list) -> list:
    """Merge tokens like ('701,', '68') that PyMuPDF splits at a page boundary."""
    result = []
    i = 0
    while i < len(row):
        x0, x1, text = row[i]
        if re.match(r"^-?\d{1,3}(?:\.\d{3})*,$", text) and i + 1 < len(row):
            nx0, nx1, ntext = row[i + 1]
            if nx0 - x1 < 12 and re.match(r"^\d{2}$", ntext):
                merged = text + ntext
                if MONEY_RE.match(merged):
                    result.append((x0, nx1, merged))
                    i += 2
                    continue
        result.append(row[i])
        i += 1
    return result


def extrair_pdf_v2022(pdf_path: Path, ano: int, limite_paginas: int | None = None):
    """
    Extrai PDFs do formato 2022/2023 onde cada palavra tem posicao x/y independente.
    Usa coordenadas de palavra para reconstruir colunas.
    """
    doc = fitz.open(pdf_path)
    fornecedor = {"nome": "", "codigo": "", "numeracao": ""}
    registros = []
    total = doc.page_count if limite_paginas is None else min(doc.page_count, limite_paginas)

    for page_index in range(total):
        raw_words = doc.load_page(page_index).get_text("words")
        y_groups = _group_words_by_y(raw_words)

        for y in sorted(y_groups):
            row = _merge_split_money(y_groups[y])
            if not row:
                continue

            first_x, _, first_text = row[0]

            # Fornecedor header: year at x in (_X_YEAR_LO, _X_YEAR_HI)
            if first_text == str(ano) and _X_YEAR_LO < first_x < _X_YEAR_HI:
                nome_parts = []
                codigo = ""
                numeracao_vals = []
                for x0, _x1, text in row[1:]:
                    if x0 >= _X_CODIGO_START:
                        codigo = text
                    elif x0 >= _X_NOME_START:
                        nome_parts.append(text)
                    else:
                        numeracao_vals.append(text)
                fornecedor = {
                    "nome": " ".join(nome_parts).strip(),
                    "codigo": codigo,
                    "numeracao": "/".join(numeracao_vals),
                }
                continue

            # Skip page-level header labels
            if first_text in _SKIP_LABELS:
                continue

            # Data row: date DD/MM at x < _X_PROC_START
            if not DATE_RE.match(first_text) or first_x >= _X_PROC_START:
                continue
            if not fornecedor["nome"]:
                continue

            date_str = first_text
            processo_parts, nota_parts, espec_parts = [], [], []
            # money_vals: (x0, x1, text) — right edge x1 determines column
            money_vals: list[tuple[float, float, str]] = []
            dc = ""

            for x0, x1, text in row:
                if x0 < _X_PROC_START:
                    pass  # date already captured
                elif x0 < _X_NOTA_START:
                    processo_parts.append(text)
                elif x0 < _X_ESPEC_START:
                    nota_parts.append(text)
                elif x0 >= _X_DC_START:
                    dc = text
                elif x0 >= _X_MONEY_START and MONEY_RE.match(text):
                    money_vals.append((x0, x1, text))
                elif x0 < _X_MONEY_START:
                    espec_parts.append(text)

            # Classify by right edge (x1): credito≤400 | debito≤500 | saldo>500
            credito = debito = saldo = ""
            if len(money_vals) >= 3:
                credito = money_vals[0][2]
                debito = money_vals[1][2]
                saldo = money_vals[-1][2]
            elif len(money_vals) == 2:
                val_x1, val_text = money_vals[0][1], money_vals[0][2]
                if val_x1 <= 400:
                    credito = val_text
                else:
                    debito = val_text
                saldo = money_vals[1][2]
            elif len(money_vals) == 1:
                saldo = money_vals[0][2]

            registros.append({
                "ano": ano,
                "pagina": page_index + 1,
                "fornecedor_nome": fornecedor["nome"],
                "fornecedor_codigo": fornecedor["codigo"],
                "fornecedor_numeracao": fornecedor["numeracao"],
                "data": f"{date_str}/{ano}",
                "processo_doc_despesa": " ".join(processo_parts),
                "nota_empenho": " ".join(nota_parts),
                "especificacao": " ".join(espec_parts),
                "credito": credito,
                "credito_num": br_float(credito),
                "debito": debito,
                "debito_num": br_float(debito),
                "saldo": saldo,
                "saldo_num": br_float(saldo),
                "saldo_dc": dc,
                "fonte_arquivo": pdf_path.name,
            })

    return registros


def detectar_formato(pdf_path: Path) -> str:
    """Returns 'v2021' or 'v2022' based on whether FORNECEDOR_RE matches any line."""
    doc = fitz.open(pdf_path)
    for i in range(min(5, doc.page_count)):
        text = doc.load_page(i).get_text("text")
        for line in text.splitlines():
            if FORNECEDOR_RE.match(line.rstrip()):
                return "v2021"
    return "v2022"


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

    fmt = detectar_formato(entrada)
    print(f"Formato detectado: {fmt}")
    if fmt == "v2022":
        registros = extrair_pdf_v2022(entrada, args.ano, args.limite_paginas)
    else:
        registros = extrair_pdf(entrada, args.ano, args.limite_paginas)
    escrever_csv(registros, saida)
    print(f"Registros extraidos: {len(registros)}")
    print(f"Saida: {saida}")


if __name__ == "__main__":
    main()
