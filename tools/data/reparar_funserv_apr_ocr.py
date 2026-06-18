"""
Repara linhas de APR FUNSERV sem texto extraivel usando OCR pontual.

Escopo deliberadamente pequeno: atualiza apenas linhas de
data/extracted/sorocaba/funserv/funserv_apr_sorocaba_2020_2026.csv
que estao sem valor ou com texto praticamente vazio. Nao publica dados.
"""
from __future__ import annotations

import csv
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "data" / "extracted" / "sorocaba" / "funserv" / "funserv_apr_sorocaba_2020_2026.csv"
RAW_APR = ROOT / "data" / "raw" / "sorocaba" / "funserv" / "apr"

TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
_POPPLER_HINTS = [
    Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Packages",
    Path("C:/Users/user/AppData/Local/Microsoft/WinGet/Packages"),
]

_RE_VALOR = re.compile(r"VALOR\s*\(R\$\)\s*:\s*([\d.]+,\d{2})", re.I)
_RE_TIPO = re.compile(r"TIPO\s+DE\s+OPERA[ÇC][ÃA]O\s*:\s*([A-Za-zÇçãÃéÉíÍóÓúÚ]+)", re.I)
_RE_DATA = re.compile(r"DATA\s*:\s*(\d{2}/\d{2}/20\d{2})", re.I)
_RE_CNPJ = re.compile(r"CNPJ\s*:\s*(\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})", re.I)
_RE_MES = re.compile(r"_0*(\d{1,3})_mov_fin", re.I)


def find_poppler() -> str | None:
    for hint in _POPPLER_HINTS:
        matches = list(hint.glob("*Poppler*/**/pdftoppm.exe")) if hint.exists() else []
        if matches:
            return str(matches[0].parent)
    return None


def first_match(pattern: re.Pattern[str], text: str) -> str:
    match = pattern.search(text)
    return match.group(1).strip() if match else ""


def extract_description(text: str) -> str:
    marker = "HISTÓRICO / DESCRIÇÃO DA OPERAÇÃO:"
    if marker not in text:
        return ""
    after = text.split(marker, 1)[1]
    after = re.sub(r"\s+", " ", after)
    after = re.sub(r"^BANCO\s*:.*?C/C\s*:\s*[\d.\-]+\s*", "", after, flags=re.I)
    stop = after.upper().find("CARACTERÍSTICAS DO ATIVO")
    if stop >= 0:
        after = after[:stop]
    return after.strip(" .,-")[:120]


def filename_month(name: str) -> str:
    match = _RE_MES.search(name)
    if not match:
        return ""
    value = int(match.group(1))
    return f"{value:02d}" if 1 <= value <= 12 else ""


def ocr_pdf(path: Path) -> str:
    try:
        import pytesseract
        from pdf2image import convert_from_path
    except ImportError as exc:
        sys.exit(f"Dependencia ausente para OCR: {exc}")

    poppler = find_poppler()
    if not Path(TESSERACT_CMD).exists():
        sys.exit(f"Tesseract nao encontrado em {TESSERACT_CMD}")
    if not poppler:
        sys.exit("Poppler nao encontrado.")

    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
    os.environ["TESSDATA_PREFIX"] = str(Path.home() / "tessdata")
    images = convert_from_path(str(path), first_page=1, last_page=2, dpi=160, poppler_path=poppler)
    return "\n".join(pytesseract.image_to_string(image, lang="por") for image in images)


def normalize_operation(value: str) -> str:
    clean = (value or "").strip()
    lowered = clean.lower()
    if lowered.startswith("aplica"):
        return "Aplicação"
    if lowered.startswith("resg"):
        return "Resgate"
    return clean


def repair_row(row: dict[str, str]) -> tuple[dict[str, str], bool]:
    current_operation = normalize_operation(row.get("tipo_operacao", ""))
    if current_operation != row.get("tipo_operacao", ""):
        row["tipo_operacao"] = current_operation
        return row, True

    if row.get("valor_brl") and int(row.get("chars") or "0") > 50:
        return row, False

    pdf = RAW_APR / row["arquivo"]
    if not pdf.exists():
        return row, False

    text = ocr_pdf(pdf)
    value = first_match(_RE_VALOR, text)
    if not value:
        return row, False

    row["valor_brl"] = value
    row["tipo_operacao"] = normalize_operation(first_match(_RE_TIPO, text))
    row["cnpj_fundo"] = first_match(_RE_CNPJ, text)
    row["data_apr"] = first_match(_RE_DATA, text)
    row["fundo_descricao"] = extract_description(text)
    row["chars"] = str(len(text))
    month = filename_month(row["arquivo"])
    if month:
        row["mes"] = month
    return row, True


def main() -> int:
    rows = list(csv.DictReader(CSV_PATH.open(encoding="utf-8")))
    fields = list(rows[0].keys()) if rows else []
    repaired = 0
    new_rows = []
    for row in rows:
        row, changed = repair_row(row)
        repaired += int(changed)
        new_rows.append(row)

    with CSV_PATH.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(new_rows)

    print(f"FUNSERV APR reparadas por OCR: {repaired}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
