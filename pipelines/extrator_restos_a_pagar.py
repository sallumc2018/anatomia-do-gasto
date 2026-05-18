"""
Extrai o Livro Conta Corrente de Restos a Pagar Analitico por Fornecedor.

Suporta dois formatos:
- v2021: texto em linhas (2025)
- v2022_rot: landscape rotacionado em portrait (2021-2024)

Saida: data/extracted/sorocaba/execucao/saida/conta_corrente_restos_sorocaba_{ano}.csv

Colunas de saida (identicas ao extrator_conta_corrente_fornecedor.py):
  ano, pagina, fornecedor_nome, fornecedor_codigo, fornecedor_numeracao,
  ano_restos, data, processo_doc_despesa, nota_empenho, especificacao,
  credito, credito_num, debito, debito_num, saldo, saldo_num,
  saldo_dc, fonte_arquivo
"""
import argparse
import csv
import re
from collections import defaultdict
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]

MONEY_RE   = re.compile(r"^-?\d{1,3}(?:\.\d{3})*,\d{2}$")
DATE_RE    = re.compile(r"^\d{2}/\d{2}$")
_INT_FRAG  = re.compile(r"^\d{1,3}(?:\.\d{3})*\.?$")   # "36", "167.", "1.234."
_DEC_FRAG  = re.compile(r"^\.\d{1,3},\d{2}$")           # ".571,43", ".285,71"

CAMPOS = [
    "ano", "pagina", "fornecedor_nome", "fornecedor_codigo", "fornecedor_numeracao",
    "ano_restos", "data", "processo_doc_despesa", "nota_empenho", "especificacao",
    "credito", "credito_num", "debito", "debito_num", "saldo", "saldo_num",
    "saldo_dc", "fonte_arquivo",
]


def br_float(valor: str) -> float:
    if not valor:
        return 0.0
    return float(valor.replace(".", "").replace(",", "."))


# ---------------------------------------------------------------------------
# Deteccao de formato
# ---------------------------------------------------------------------------

def detectar_formato(pdf_path: str) -> str:
    """Retorna 'v2021' ou 'v2022_rot'."""
    doc = fitz.open(str(pdf_path))
    page = doc[min(5, doc.page_count - 1)]
    blocks = page.get_text("blocks")
    doc.close()
    avg_w = sum(abs(b[2] - b[0]) for b in blocks) / max(len(blocks), 1)
    return "v2021" if avg_w >= 30 else "v2022_rot"


# ---------------------------------------------------------------------------
# Parser v2021 (linha de texto — 2025)
# ---------------------------------------------------------------------------

_FORN_RE_V21  = re.compile(r"^\s*(\d{4})\s+(\d+)\s+(\d+)\s+(.+?)\s+(\d{3,6})\s+RESTOS\s+A\s+PAGAR\s*-\s*(\d{4})\s*$")
_FORN_RE_V21B = re.compile(r"^\s*(\d{4})\s+(\d+)\s+(\d+)\s+(.+?)\s+(\d{3,6})\s*$")
_LINHA_RE_V21 = re.compile(r"^\s*(\d{2}/\d{2})\s+(\S+)\s+(\S+)\s{2,}(.*)$")
_VALOR_RE     = re.compile(r"-?\d{1,3}(?:\.\d{3})*,\d{2}")
_SKIP_V21 = {
    "CN-SIFPM", "CONAM", "Prefeitura Municipal de Sorocaba", "CONTA CORRENTE FORNECEDOR",
    "Exercicio", "Numeracao", "Data  Processo", "Doc.Desp.",
    "Credito", "Debito", "Saldo D/C",
}


def _extrair_v2021(pdf_path: str, ano: int, limite_paginas: int | None) -> list[dict]:
    doc = fitz.open(str(pdf_path))
    registros: list[dict] = []
    n_pages = min(doc.page_count, limite_paginas) if limite_paginas else doc.page_count

    forn_nome = forn_codigo = forn_num = ano_restos = ""

    for page_num in range(n_pages):
        page = doc[page_num]
        lines = page.get_text("text").split("\n")
        for line in lines:
            line = line.rstrip()
            if not line.strip():
                continue
            if any(s in line for s in _SKIP_V21):
                continue

            m = _FORN_RE_V21.match(line)
            if m:
                forn_nome    = m.group(4).strip()
                forn_codigo  = m.group(5).strip()
                forn_num     = m.group(3).strip()
                ano_restos   = m.group(6).strip()
                continue

            m = _FORN_RE_V21B.match(line)
            if m:
                forn_nome    = m.group(4).strip()
                forn_codigo  = m.group(5).strip()
                forn_num     = m.group(3).strip()
                continue

            m = _LINHA_RE_V21.match(line)
            if not m or not forn_nome:
                continue

            data_val = m.group(1)
            processo = m.group(2)
            empenho  = m.group(3)
            resto    = m.group(4)
            valores  = _VALOR_RE.findall(resto)
            espec    = _VALOR_RE.sub("", resto).strip()

            credito = debito = saldo = ""
            if len(valores) == 3:
                credito, debito, saldo = valores[0], valores[1], valores[2]
            elif len(valores) == 2:
                debito, saldo = valores[0], valores[1]
            elif len(valores) == 1:
                saldo = valores[0]

            registros.append({
                "ano": str(ano),
                "pagina": str(page_num + 1),
                "fornecedor_nome": forn_nome,
                "fornecedor_codigo": forn_codigo,
                "fornecedor_numeracao": forn_num,
                "ano_restos": ano_restos,
                "data": f"{data_val}/{ano}" if data_val else "",
                "processo_doc_despesa": processo,
                "nota_empenho": empenho,
                "especificacao": espec,
                "credito": credito,
                "credito_num": str(br_float(credito)),
                "debito": debito,
                "debito_num": str(br_float(debito)),
                "saldo": saldo,
                "saldo_num": str(br_float(saldo)),
                "saldo_dc": "",
                "fonte_arquivo": Path(pdf_path).name,
            })

    doc.close()
    return registros


# ---------------------------------------------------------------------------
# Parser v2022_rot (landscape rotacionado em portrait — 2021-2024)
# ---------------------------------------------------------------------------
# Estrutura de coordenadas y (portrait):
#
#   Zone A: y < 100      → DEC_FRAG ou valor completo de SALDO
#   Zone B: 100 ≤ y < 200 → INT_FRAG e DEC_FRAG de DEBITO; valores completos de DEBITO
#   Zone C: 200 ≤ y < 300 → INT_FRAG de SALDO (parte inteira quando saldo ≥ 1000)
#
# Para cada transacao (x-bin):
#   DEBITO = Zone B INT + Zone B DEC (ambos no mesmo zone)
#          | Zone B INT + Zone A DEC  (overflow quando zone C vazio)
#          | Valor completo em Zone B  (quando debito < 1000)
#   SALDO  = Zone C INT + Zone A DEC  (cross-zone, quando saldo ≥ 1000)
#          | Zone C INT + Zone B DEC  (fallback quando Zone A vazio)
#          | Valor completo em Zone A  (quando saldo < 1000)
#          | Valor completo em Zone B  (saldo pequeno, quando debito ja foi identificado)
#
# Header fornecedor: x = 70-92 (portrait), cada palavra aparece duas vezes em
#   y-posicoes muito proximas (~19 pts) — artefato do PDF; remove duplicatas por
#   proximidade antes de parsear.

_Y_SALDO  = 100
_Y_DEBITO = 200
_Y_CREDITO = 300

_X_HDR_MIN = 70
_X_HDR_MAX = 92
_X_DATA    = 130

_HDR_PROX_Y  = 20  # y-distancia para dedup por proximidade (qualquer palavra)
_HDR_SAME_Y  = 35  # y-distancia para dedup por string identica

_SKIP_V22 = frozenset({
    "cn-sifpm", "conam", "prefeitura", "municipal", "de", "sorocaba",
    "conta", "corrente", "fornecedor", "exercicio", "numeracao",
    "nome", "codigo", "data", "processo", "nota", "justificativa",
    "credito", "debito", "saldo", "d/c", "doc.desp.", "empenho", "serocaba",
    # Header de restos a pagar (aparece no cabecalho do PDF e contamina o nome)
    "restos", "a", "pagar", "-",
})


def _dedup_hdr(words: list[tuple]) -> list[tuple]:
    """
    Remove palavras duplicadas do cabecalho (artefato PDF: mesma palavra aparece
    2x em y proximos, com gaps de 19 a 48 pts dependendo do documento).
    - Regra 1 (string): se a palavra ja foi vista, pula (qualquer gap).
    - Regra 2 (proximidade): pula qualquer palavra a menos de _HDR_PROX_Y da anterior mantida.
    """
    seen: set[str] = set()
    result: list[tuple] = []
    last_kept_y = None
    for y, text in sorted(words, key=lambda w: w[0]):
        if text in seen:
            continue
        if last_kept_y is not None and (y - last_kept_y) < _HDR_PROX_Y:
            seen.add(text)
            continue
        seen.add(text)
        result.append((y, text))
        last_kept_y = y
    return result


def _parse_fornecedor_header_rot(words_in_hdr: list[tuple]) -> tuple[str, str, str]:
    """
    Recebe lista de (y0, text) ja deduplificada.
    Retorna (nome, codigo, ano_restos).
    """
    sorted_asc = sorted(words_in_hdr, key=lambda w: w[0])
    ano_restos = ""
    for y, text in sorted_asc:
        if re.match(r"^\d{4}$", text) and int(text) >= 2018:
            ano_restos = text
            break

    sorted_desc = sorted(words_in_hdr, key=lambda w: w[0], reverse=True)
    nome_parts: list[str] = []
    codigo = ""
    for y, text in sorted_desc:
        if text.lower() in _SKIP_V22:
            continue
        if re.match(r"^\d{5,6}$", text) and not codigo:
            codigo = text
            continue
        if codigo:
            break
        if not re.match(r"^\d{1,4}$", text):
            nome_parts.append(text)

    nome = " ".join(reversed(nome_parts)).strip()
    return nome, codigo, ano_restos


def _parse_money(tokens: list[tuple]) -> tuple[str, str]:
    """
    tokens: lista de (y0, text) para todos os tokens em y < _Y_CREDITO (300).
    Retorna (debito_str, saldo_str).
    """
    zone_a = [(y, t) for y, t in tokens if y < _Y_SALDO]
    zone_b = [(y, t) for y, t in tokens if _Y_SALDO <= y < _Y_DEBITO]
    zone_c = [(y, t) for y, t in tokens if _Y_DEBITO <= y < _Y_CREDITO]

    def _ints(zone):
        return [t for _, t in zone if _INT_FRAG.match(t) and not MONEY_RE.match(t)]

    def _decs(zone):
        return [t for _, t in zone if _DEC_FRAG.match(t)]

    def _full(zone):
        return [t for _, t in zone if MONEY_RE.match(t)]

    def _join(int_t: str, dec_t: str) -> str:
        val = f"{int_t.rstrip('.')}.{dec_t[1:]}"
        return val if MONEY_RE.match(val) else ""

    b_ints = _ints(zone_b)
    b_decs = _decs(zone_b)
    b_full = _full(zone_b)
    a_decs = _decs(zone_a)
    a_full = _full(zone_a)
    c_ints = _ints(zone_c)

    debito_str = saldo_str = ""

    # --- DEBITO ---
    if b_ints and b_decs:
        debito_str = _join(b_ints[0], b_decs[0])
    elif b_ints and a_decs and not c_ints:
        # DEC transbordou para Zone A (debito grande, sem SALDO splitting em Zone C)
        debito_str = _join(b_ints[0], a_decs[0])
    elif b_full and not b_ints:
        debito_str = b_full[0]

    # --- SALDO ---
    if c_ints and a_decs:
        # SALDO grande: INT em Zone C + DEC em Zone A (cross-zone)
        saldo_str = _join(c_ints[0], a_decs[0])
    elif c_ints and not a_decs and b_decs and not debito_str:
        # DEC do SALDO ficou em Zone B (zona limiar)
        saldo_str = _join(c_ints[0], b_decs[0])

    if a_full and not saldo_str:
        saldo_str = a_full[0]

    # Valor completo em Zone B nao usado para debito = provavelmente SALDO pequeno
    if b_full and debito_str and not saldo_str:
        remaining = [t for t in b_full if t != debito_str]
        if remaining:
            saldo_str = remaining[0]

    return debito_str, saldo_str


def _extrair_v2022_rot(pdf_path: str, ano: int, limite_paginas: int | None) -> list[dict]:
    doc = fitz.open(str(pdf_path))
    registros: list[dict] = []
    n_pages = min(doc.page_count, limite_paginas) if limite_paginas else doc.page_count

    forn_nome = forn_codigo = forn_num = ano_restos = ""

    for page_num in range(n_pages):
        page = doc[page_num]
        words = page.get_text("words")
        if not words:
            continue

        hdr_raw:   list[tuple] = []
        data_words: list[tuple] = []

        for w in words:
            x0, y0, x1, y1, text = w[0], w[1], w[2], w[3], w[4]
            text = text.strip()
            if not text:
                continue

            if _X_HDR_MIN <= x0 <= _X_HDR_MAX:
                if text.lower() not in _SKIP_V22:
                    hdr_raw.append((y0, text))
            elif x0 >= _X_DATA:
                if text.lower() not in _SKIP_V22:
                    data_words.append((x0, y0, text))

        # Parseia header apos deduplicar por proximidade de y
        if hdr_raw:
            deduped = _dedup_hdr(hdr_raw)
            nome, codigo, ar = _parse_fornecedor_header_rot(deduped)
            if nome:
                forn_nome = nome
            if codigo:
                forn_codigo = codigo
            if ar:
                ano_restos = ar

        if not data_words or not forn_nome:
            continue

        # Agrupa por x-bin (cada bin = uma coluna de transacao)
        by_x: dict[int, list[tuple]] = defaultdict(list)
        for x0, y0, text in data_words:
            by_x[round(x0 / 10) * 10].append((y0, text))

        for x_bin in sorted(by_x.keys()):
            col = by_x[x_bin]

            # Extrai data (zona y >= _Y_PROC = 740)
            date_val = ""
            for y0, text in col:
                if y0 >= 740 and DATE_RE.match(text):
                    date_val = f"{text}/{ano}"
                    break

            # Sem data = coluna de cabecalho ou overflow de texto; pula
            if not date_val:
                continue

            # Reconstroi DEBITO e SALDO
            money_tokens = [(y0, text) for y0, text in col if y0 < _Y_CREDITO]
            debito_str, saldo_str = _parse_money(money_tokens)

            # Empenho (y = 560-670), lido em y decrescente (ordem landscape)
            emp_tokens = sorted(
                [(y0, text) for y0, text in col if 560 <= y0 < 670],
                key=lambda w: w[0], reverse=True,
            )
            empenho = " ".join(t for _, t in emp_tokens if t != ".")

            # Processo (y = 670-740)
            proc_tokens = [(y0, text) for y0, text in col if 670 <= y0 < 740]
            processo = " ".join(t for _, t in proc_tokens)

            # Justificativa (y = 300-560), lida em y decrescente
            justif_tokens = sorted(
                [(y0, text) for y0, text in col if 300 <= y0 < 560],
                key=lambda w: w[0], reverse=True,
            )
            espec = " ".join(t for _, t in justif_tokens)

            registros.append({
                "ano": str(ano),
                "pagina": str(page_num + 1),
                "fornecedor_nome": forn_nome,
                "fornecedor_codigo": forn_codigo,
                "fornecedor_numeracao": forn_num,
                "ano_restos": ano_restos,
                "data": date_val,
                "processo_doc_despesa": processo,
                "nota_empenho": empenho,
                "especificacao": espec,
                "credito": "",
                "credito_num": "0.0",
                "debito": debito_str,
                "debito_num": str(br_float(debito_str)),
                "saldo": saldo_str,
                "saldo_num": str(br_float(saldo_str)),
                "saldo_dc": "",
                "fonte_arquivo": Path(pdf_path).name,
            })

    doc.close()
    return registros


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def extrair(pdf_path: str, ano: int, limite_paginas: int | None = None) -> list[dict]:
    fmt = detectar_formato(pdf_path)
    print(f"Formato detectado: {fmt}")
    if fmt == "v2021":
        return _extrair_v2021(pdf_path, ano, limite_paginas)
    else:
        return _extrair_v2022_rot(pdf_path, ano, limite_paginas)


def main() -> None:
    ap = argparse.ArgumentParser(description="Extrai restos a pagar por fornecedor")
    ap.add_argument("--ano", type=int, required=True)
    ap.add_argument("--entrada", default=None,
                    help="Caminho do PDF (padrao: raw/sorocaba/execucao/livros_contabeis/{ano}/...)")
    ap.add_argument("--saida",   default=None,
                    help="Caminho do CSV de saida")
    ap.add_argument("--limite-paginas", type=int, default=None)
    args = ap.parse_args()

    ano = args.ano
    entrada = args.entrada or str(
        ROOT / "data" / "raw" / "sorocaba" / "execucao" / "livros_contabeis"
        / str(ano) / f"livro_conta_corrente_fornecedor_restos_{ano}.pdf"
    )
    saida_dir = ROOT / "data" / "extracted" / "sorocaba" / "execucao" / "saida"
    saida_dir.mkdir(parents=True, exist_ok=True)
    saida = args.saida or str(saida_dir / f"conta_corrente_restos_sorocaba_{ano}.csv")

    registros = extrair(entrada, ano, args.limite_paginas)
    print(f"Registros extraidos: {len(registros)}")

    with open(saida, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(registros)
    print(f"Saida: {saida}")


if __name__ == "__main__":
    main()
