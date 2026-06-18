"""
Extrai o Livro Registro de Empenho de Sorocaba por coordenadas de palavras.

Suporta três formatos:
  v2021: portrait 595×842 Rot=0 — cada transação é uma coluna vertical; datas y≈737
  v2022: landscape 842×595 Rot=90 — cada transação é uma coluna vertical; datas y≈711
          (v2023 usa as mesmas zonas de v2022)
  v2024: portrait 595×842 Rot=0 — cada transação é uma linha horizontal; datas x≈51

Saída em data/extracted/sorocaba/execucao/saida/empenho_sorocaba_{ano}.csv
Não publicar sem validação.

Colunas de saída (schema idêntico ao empenho 2020 e 2025 publicados):
  ano, pagina, orgao, unidade_orcamentaria, unidade_despesa,
  natureza_despesa, programa_trabalho, data, processo, nota_empenho,
  fornecedor_codigo, especificacao, empenhado_no_dia_num,
  empenhado_ate_data_num, saldo_dotacao_num, fonte_arquivo, fornecedor_nome
"""
import argparse
import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).parent))
from paths import EXECUCAO_EXTRACTED_DIR, EXECUCAO_RAW_DIR

# ---------------------------------------------------------------------------
# Regex helpers
# ---------------------------------------------------------------------------
DATA_RE = re.compile(r"^\d{2}/\d{2}$")
VALOR_RE = re.compile(r"^-?\d{1,3}(?:\.\d{3})*,\d{2}$")
NATUREZA_RE = re.compile(r"^\d\.\d\.\d{2}\.\d{2}\.\d{2}$")
PROGRAMA_RE = re.compile(r"^\d{2}\.\d{3}\.\d{4}-\d\.\d{3}$")

# ---------------------------------------------------------------------------
# Zonas por formato (colunas verticais: v2021, v2022)
# Chave → (y_min, y_max) no espaço de coordenadas PyMuPDF
# ---------------------------------------------------------------------------
ZONAS_COLUNA: dict[str, dict] = {
    "v2021": {
        "saldo_dotacao":      (150, 168),
        "empenhado_ate_data": (218, 234),
        "empenhado_no_dia":   (287, 303),
        "especificacao":      (355, 490),
        "fornecedor_codigo":  (492, 508),
        "nota_empenho":       (670, 686),
        "processo":           (703, 719),
        "data":               (729, 744),
        "_ctx_x":             (45, 80),   # margem esquerda: natureza/programa
    },
    "v2022": {
        "saldo_dotacao":      (127, 142),
        "empenhado_ate_data": (193, 208),
        "empenhado_no_dia":   (261, 277),
        "especificacao":      (345, 461),
        "fornecedor_codigo":  (466, 482),
        "nota_empenho":       (644, 661),
        "processo":           (677, 693),
        "data":               (704, 718),
        "_ctx_x":             (35, 65),
    },
}

# Zonas em x para o formato de linhas horizontais (v2024)
ZONAS_LINHA: dict[str, tuple[float, float]] = {
    "data":               (45,  62),
    "processo":           (62,  83),
    "nota_empenho":       (85, 115),
    "fornecedor_codigo":  (220, 245),
    "especificacao":      (240, 365),
    "empenhado_no_dia":   (363, 415),
    "empenhado_ate_data": (413, 465),
    "saldo_dotacao":      (463, 515),
}

# Tolerância em x para agrupar palavras da mesma coluna (formato coluna)
_TOL_X_COL = 2.5
# Tolerância em y para agrupar palavras da mesma linha (formato linha)
_TOL_Y_LIN = 4.0

CAMPOS = [
    "ano", "pagina", "orgao", "unidade_orcamentaria", "unidade_despesa",
    "natureza_despesa", "programa_trabalho", "data", "processo", "nota_empenho",
    "fornecedor_codigo", "especificacao",
    "empenhado_no_dia_num", "empenhado_ate_data_num", "saldo_dotacao_num",
    "fonte_arquivo", "fornecedor_nome",
]


# ---------------------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------------------

def br_float(valor: str) -> float:
    if not valor:
        return 0.0
    # '~' é OCR para '-' em alguns PDFs; corrige pontuação mista
    s = valor.replace("~", "-").replace(";", ",").strip()
    try:
        return float(s.replace(".", "").replace(",", "."))
    except ValueError:
        return 0.0


def apenas_digitos(texto: str) -> str:
    return "".join(ch for ch in texto if ch.isdigit())


def normalizar_alfanum(texto: str) -> str:
    return "".join(ch for ch in texto if ch.isalnum())


# ---------------------------------------------------------------------------
# Extração de contexto de página (compartilhado)
# ---------------------------------------------------------------------------

def _contexto_vazio() -> dict:
    return {
        "orgao": "",
        "unidade_orcamentaria": "",
        "unidade_despesa": "",
        "natureza_despesa": "",
        "programa_trabalho": "",
    }


def contexto_pagina_coluna(
    words: list,
    x_ctx_min: float,
    x_ctx_max: float,
    ctx_anterior: dict,
) -> dict:
    """Extrai contexto de página para formatos de colunas verticais (v2021/v2022)."""
    ctx = dict(ctx_anterior)
    textos = {w[4] for w in words}
    if {"Prefeitura", "Municipal", "de", "Sorocaba"}.issubset(textos):
        ctx["orgao"] = "Prefeitura Municipal de Sorocaba"
    for x0, _y0, _x1, _y1, text, *_ in words:
        if x_ctx_min <= x0 <= x_ctx_max:
            if NATUREZA_RE.match(text):
                ctx["natureza_despesa"] = text
            if PROGRAMA_RE.match(text):
                ctx["programa_trabalho"] = text
    return ctx


def contexto_pagina_linha(words: list) -> dict:
    """Extrai contexto de página para o formato de linhas horizontais (v2024)."""
    ctx = _contexto_vazio()
    textos = {w[4] for w in words}
    if {"Prefeitura", "Municipal", "de", "Sorocaba"}.issubset(textos):
        ctx["orgao"] = "Prefeitura Municipal de Sorocaba"
    for x0, y0, _x1, _y1, text, *_ in words:
        # Cabeçalho da página fica em y < 260
        if y0 > 260:
            continue
        if 220 <= x0 <= 242 and NATUREZA_RE.match(text):
            ctx["natureza_despesa"] = text
        if 270 <= x0 <= 295 and PROGRAMA_RE.match(text):
            ctx["programa_trabalho"] = text
        # Unid. Desp: 00  (aparece em x≈210, y≈249)
        if 204 <= x0 <= 220 and text.isdigit() and len(text) <= 4:
            ctx["unidade_despesa"] = text
    return ctx


# ---------------------------------------------------------------------------
# Funções de coleta por coordenada (formato colunas)
# ---------------------------------------------------------------------------

def palavras_da_coluna(words: list, x_ref: float) -> list:
    return [w for w in words if abs(w[0] - x_ref) <= _TOL_X_COL]


def texto_coluna(col_words: list, y_min: float, y_max: float) -> str:
    """Junta palavras na faixa y, ordenadas de y maior para menor (leitura coluna)."""
    partes = [
        (y0, text)
        for _x0, y0, _x1, _y1, text, *_ in col_words
        if y_min <= y0 <= y_max
    ]
    return " ".join(t for _, t in sorted(partes, key=lambda p: p[0], reverse=True)).strip()


def primeiro_valor_coluna(col_words: list, y_min: float, y_max: float) -> str:
    """Retorna o primeiro valor BR (d.ddd,dd) na faixa y, do maior y ao menor."""
    for _x0, y0, _x1, _y1, text, *_ in sorted(col_words, key=lambda w: w[1], reverse=True):
        if y_min <= y0 <= y_max and VALOR_RE.match(text):
            return text
    return ""


# ---------------------------------------------------------------------------
# Extração de uma página — formato colunas (v2021 / v2022 / v2023)
# ---------------------------------------------------------------------------

def extrair_pagina_coluna(
    words: list,
    ano: int,
    pagina: int,
    fonte: str,
    ctx: dict,
    zonas: dict,
    ul_cx: dict,
) -> list[dict]:
    y_dmin, y_dmax = zonas["data"]
    datas = [
        (x0, text)
        for x0, y0, _x1, _y1, text, *_ in words
        if y_dmin <= y0 <= y_dmax and DATA_RE.match(text)
    ]

    registros = []
    for x_ref, data in sorted(datas, key=lambda d: d[0]):
        col = palavras_da_coluna(words, x_ref)

        processo = texto_coluna(col, *zonas["processo"]).strip()
        nota_raw = apenas_digitos(texto_coluna(col, *zonas["nota_empenho"]))
        nota = nota_raw.zfill(5) if nota_raw else ""
        forn_cod = apenas_digitos(texto_coluna(col, *zonas["fornecedor_codigo"]))
        espec = texto_coluna(col, *zonas["especificacao"])

        # Herança de campos repetidos entre colunas adjacentes
        if not processo:
            processo = ul_cx.get("processo", "")
        else:
            ul_cx["processo"] = processo

        if not nota:
            nota = ul_cx.get("nota_empenho", "")
        else:
            ul_cx["nota_empenho"] = nota

        if not forn_cod:
            forn_cod = ul_cx.get("fornecedor_codigo", "")
        else:
            ul_cx["fornecedor_codigo"] = forn_cod

        if not nota or not forn_cod:
            continue

        no_dia_str = primeiro_valor_coluna(col, *zonas["empenhado_no_dia"])
        ate_data_str = primeiro_valor_coluna(col, *zonas["empenhado_ate_data"])
        saldo_str = primeiro_valor_coluna(col, *zonas["saldo_dotacao"])

        registros.append({
            "ano": str(ano),
            "pagina": str(pagina),
            **ctx,
            "data": f"{data}/{ano}",
            "processo": processo,
            "nota_empenho": nota,
            "fornecedor_codigo": forn_cod,
            "especificacao": espec,
            "empenhado_no_dia_num": str(br_float(no_dia_str)),
            "empenhado_ate_data_num": str(br_float(ate_data_str)),
            "saldo_dotacao_num": str(br_float(saldo_str)),
            "fonte_arquivo": fonte,
            "fornecedor_nome": "",
        })

    return registros


# ---------------------------------------------------------------------------
# Extração de uma página — formato linhas (v2024)
# ---------------------------------------------------------------------------

def _juntar_texto_linha(row_words: list, x_min: float, x_max: float) -> str:
    """Junta palavras da linha dentro de uma faixa de x, em ordem de x crescente."""
    partes = [
        (x0, text)
        for x0, _y0, _x1, _y1, text, *_ in row_words
        if x_min <= x0 <= x_max
    ]
    return " ".join(t for _, t in sorted(partes, key=lambda p: p[0])).strip()


def extrair_pagina_linha(
    words: list,
    ano: int,
    pagina: int,
    fonte: str,
    ctx: dict,
) -> list[dict]:
    z = ZONAS_LINHA
    dx_min, dx_max = z["data"]

    # Agrupa palavras por linha (y próximo)
    linhas: dict[float, list] = defaultdict(list)
    for w in words:
        y0 = w[1]
        # snapping para y mais próximo já registrado
        y_key = None
        for k in linhas:
            if abs(k - y0) <= _TOL_Y_LIN:
                y_key = k
                break
        if y_key is None:
            y_key = y0
        linhas[y_key].append(w)

    registros = []
    for y_key in sorted(linhas):
        row = linhas[y_key]
        # A data deve estar em x dentro da faixa e corresponder ao padrão dd/mm
        data_words = [
            w for w in row
            if dx_min <= w[0] <= dx_max and DATA_RE.match(w[4])
        ]
        if not data_words:
            continue
        data = data_words[0][4]

        processo = _juntar_texto_linha(row, *z["processo"])
        nota = apenas_digitos(_juntar_texto_linha(row, *z["nota_empenho"])).zfill(5)
        forn_cod = apenas_digitos(_juntar_texto_linha(row, *z["fornecedor_codigo"]))
        espec = _juntar_texto_linha(row, *z["especificacao"])

        # Valor: juntar fragmentos e normalizar
        no_dia_raw = _juntar_texto_linha(row, *z["empenhado_no_dia"]).replace(" ", "")
        ate_raw = _juntar_texto_linha(row, *z["empenhado_ate_data"]).replace(" ", "")
        saldo_raw = _juntar_texto_linha(row, *z["saldo_dotacao"]).replace(" ", "")

        if not nota or not forn_cod:
            continue

        registros.append({
            "ano": str(ano),
            "pagina": str(pagina),
            **ctx,
            "data": f"{data}/{ano}",
            "processo": processo,
            "nota_empenho": nota,
            "fornecedor_codigo": forn_cod,
            "especificacao": espec,
            "empenhado_no_dia_num": str(br_float(no_dia_raw)),
            "empenhado_ate_data_num": str(br_float(ate_raw)),
            "saldo_dotacao_num": str(br_float(saldo_raw)),
            "fonte_arquivo": fonte,
            "fornecedor_nome": "",
        })

    return registros


# ---------------------------------------------------------------------------
# Enriquecimento: adiciona fornecedor_nome via conta_corrente
# ---------------------------------------------------------------------------

def enriquecer_fornecedor(registros: list[dict], ano: int) -> None:
    """Preenche fornecedor_nome in-place usando conta_corrente_fornecedor_{ano}.csv."""
    cc_path = (
        EXECUCAO_EXTRACTED_DIR / "saida"
        / f"conta_corrente_fornecedor_sorocaba_{ano}.csv"
    )
    if not cc_path.exists():
        print(f"[aviso] conta_corrente não encontrado: {cc_path}", file=sys.stderr)
        return

    lookup: dict[str, str] = {}
    with cc_path.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            cod = row.get("fornecedor_codigo", "").strip()
            nome = row.get("fornecedor_nome", "").strip()
            if cod and nome and cod not in lookup:
                lookup[cod] = nome

    for rec in registros:
        if not rec["fornecedor_nome"]:
            rec["fornecedor_nome"] = lookup.get(rec["fornecedor_codigo"], "")


# ---------------------------------------------------------------------------
# Extração principal
# ---------------------------------------------------------------------------

def detectar_formato(ano: int) -> str:
    if ano <= 2021:
        return "v2021"
    if ano <= 2023:
        return "v2022"
    return "v2024"


def extrair(pdf_path: str, ano: int, limite_paginas: int | None = None) -> list[dict]:
    formato = detectar_formato(ano)
    doc = fitz.open(pdf_path)
    n_pages = min(doc.page_count, limite_paginas) if limite_paginas else doc.page_count

    ctx = _contexto_vazio()
    ul_cx = {"processo": "", "nota_empenho": "", "fornecedor_codigo": ""}
    registros: list[dict] = []

    fonte = Path(pdf_path).name

    if formato in ("v2021", "v2022"):
        zonas = ZONAS_COLUNA[formato]
        x_ctx_min, x_ctx_max = zonas["_ctx_x"]
        for pg_idx in range(n_pages):
            words = doc.load_page(pg_idx).get_text("words")
            ctx = contexto_pagina_coluna(words, x_ctx_min, x_ctx_max, ctx)
            registros.extend(
                extrair_pagina_coluna(words, ano, pg_idx + 1, fonte, ctx, zonas, ul_cx)
            )
    else:  # v2024
        for pg_idx in range(n_pages):
            words = doc.load_page(pg_idx).get_text("words")
            pg_ctx = contexto_pagina_linha(words)
            for k, v in pg_ctx.items():
                if v:
                    ctx[k] = v
            registros.extend(
                extrair_pagina_linha(words, ano, pg_idx + 1, fonte, ctx)
            )

    doc.close()
    return registros


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(description="Extrai Registro de Empenho por coordenadas")
    ap.add_argument("--ano", type=int, required=True)
    ap.add_argument("--entrada", default=None)
    ap.add_argument("--saida", default=None)
    ap.add_argument("--limite-paginas", type=int, default=None)
    ap.add_argument(
        "--formato",
        choices=["v2021", "v2022", "v2024"],
        default=None,
        help="Forçar formato (padrão: auto por ano)",
    )
    args = ap.parse_args()

    ano = args.ano
    if args.formato:
        # Override auto-detection
        global detectar_formato
        _fmt = args.formato
        detectar_formato = lambda _: _fmt  # noqa: E731

    entrada = args.entrada or str(
        EXECUCAO_RAW_DIR / "livros_contabeis" / str(ano)
        / f"livro_registro_empenho_{ano}.pdf"
    )
    saida_dir = EXECUCAO_EXTRACTED_DIR / "saida"
    saida_dir.mkdir(parents=True, exist_ok=True)
    saida = args.saida or str(saida_dir / f"empenho_sorocaba_{ano}.csv")

    registros = extrair(entrada, ano, args.limite_paginas)
    enriquecer_fornecedor(registros, ano)
    print(f"Registros extraídos: {len(registros)}")

    with open(saida, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(registros)
    print(f"Saída: {saida}")


if __name__ == "__main__":
    main()
