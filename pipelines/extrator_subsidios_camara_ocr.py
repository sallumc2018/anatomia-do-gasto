"""
OCR dos PDFs de subsídios e remuneração da Câmara de Sorocaba (2016-2026).

Requisito (instalar uma vez):
    sudo apt-get install -y tesseract-ocr tesseract-ocr-por poppler-utils
    pip install Pillow  (para o modo --enhanced)

Uso:
    .venv/bin/python3 pipelines/extrator_subsidios_camara_ocr.py
    .venv/bin/python3 pipelines/extrator_subsidios_camara_ocr.py --anos 2017 2019 2022
    .venv/bin/python3 pipelines/extrator_subsidios_camara_ocr.py --anos 2017 2019 2022 --enhanced
    .venv/bin/python3 pipelines/extrator_subsidios_camara_ocr.py --salvar-txt

Modo --enhanced: aplica pré-processamento de imagem (contraste +30%, binarização Otsu)
antes do Tesseract para melhorar a leitura de PDFs escaneados com baixa qualidade
(anos 2017, 2019 e 2022 identificados com erros de dígitos→letras).
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw" / "sorocaba" / "camara" / "subsidios"
EXTRACTED_DIR = ROOT / "data" / "extracted" / "sorocaba" / "camara" / "subsidios" / "saida"
PUBLIC_DIR = ROOT / "data" / "public" / "sorocaba" / "camara" / "subsidios" / "saida"
TXT_DIR = ROOT / "data" / "extracted" / "sorocaba" / "camara" / "subsidios" / "ocr_txt"

ANOS = list(range(2016, 2027))

try:
    from pdf2image import convert_from_path as _convert
    import pytesseract as _tess
    OCR_OK = True
except ImportError:
    OCR_OK = False


try:
    from PIL import Image as _PILImage, ImageEnhance as _Enhance, ImageFilter as _Filter
    PILLOW_OK = True
except ImportError:
    PILLOW_OK = False


def _enhance_image(img: object) -> object:
    """Apply contrast boost + binarization to improve OCR on low-quality scans.

    Fixes digit→letter misreads in 2017/2019/2022 PDFs by increasing contrast
    and applying Otsu-like threshold before passing to Tesseract.
    """
    if not PILLOW_OK:
        return img
    # Convert to grayscale
    gray = img.convert("L")
    # Contrast boost
    enhanced = _Enhance.Contrast(gray).enhance(1.8)
    # Sharpness
    enhanced = _Enhance.Sharpness(enhanced).enhance(2.0)
    # Binarize via point threshold (approx Otsu at 140/255)
    binarized = enhanced.point(lambda x: 0 if x < 140 else 255, "1")
    return binarized.convert("RGB")


def ocr_pdf(pdf_path: Path, lang: str = "por", enhanced: bool = False) -> str:
    if not OCR_OK:
        print("  ERRO: pdf2image/pytesseract não instalados.", file=sys.stderr)
        return ""
    partes: list[str] = []
    # Higher DPI in enhanced mode for better digit recognition
    dpi = 300 if enhanced else 200
    pages = _convert(pdf_path, dpi=dpi, fmt="jpeg", thread_count=1)
    for i, img in enumerate(pages):
        if enhanced:
            img = _enhance_image(img)
            # PSM 6 = uniform block of text; OEM 3 = LSTM + legacy
            config = "--psm 6 --oem 3 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ .,;:/-"
        else:
            config = "--psm 6"
        txt = _tess.image_to_string(img, lang=lang, config=config)
        partes.append(f"--- página {i + 1} ---\n{txt}")
        del img
    del pages
    return "\n".join(partes)


def centavos_para_real(s: str) -> float | None:
    """Convert raw OCR integer (centavos without separator) to R$ float.
    e.g. '1435821' -> 14358.21"""
    s = re.sub(r"[^\d]", "", s)
    if not s or len(s) < 3:
        return None
    try:
        return int(s) / 100
    except ValueError:
        return None


# Match a table row: starts with [ or contains |, has at least one numeric cell
_TABLE_ROW = re.compile(r"[\[|].{3,}")
# Numeric cell value: 4-8 consecutive digits (R$ 0,01 to R$ 999.999,99 in centavos)
_NUM_CELL = re.compile(r"\b(\d{4,8})\b")
# Skip patterns that are clearly not cargo rows
_SKIP = re.compile(
    r"PORTARIA|CÂMARA|ESTADO|PAULO|PRESIDENTE\s+[A-Z]|GERVINO|INSTRUÇÃO|"
    r"CONSTITUIÇÃO|Página|FONTE|CARGO|SUBSÍDIO|REMUNER|ADMINISTRATIVO|TOTAL",
    re.I,
)


def _extrair_nome_cargo(celula: str) -> str:
    """Clean up cargo name from OCR-noisy cell text."""
    # Remove leading/trailing brackets and pipes
    nome = re.sub(r"^[\[|F\s]+|[\]|)\s]+$", "", celula).strip()
    # Collapse multiple spaces
    nome = re.sub(r"\s{2,}", " ", nome)
    # Remove stray single chars at start/end
    nome = re.sub(r"^[A-Z]\s+", "", nome)
    return nome.strip()


def parsear_texto(texto: str, ano: int) -> list[dict]:
    rows: list[dict] = []

    # Extract portaria/decree reference
    portaria = ""
    m = re.search(r"PORTARIA\s+N[.º°o\s]*[\d][^\s,\n]*", texto, re.I)
    if m:
        portaria = re.sub(r"\s+", " ", m.group(0)).strip()

    for linha in texto.split("\n"):
        linha = linha.strip()
        if len(linha) < 8:
            continue
        if _SKIP.search(linha):
            continue
        if not _TABLE_ROW.match(linha) and "|" not in linha and "[" not in linha:
            continue

        # Find all numeric cells (4-8 digits)
        nums = _NUM_CELL.findall(linha)
        # Filter to plausible salary values (R$ 100 to R$ 99.999)
        valores = [centavos_para_real(n) for n in nums]
        valores = [v for v in valores if v is not None and 100 < v < 100_000]
        if not valores:
            continue

        # Cargo name: text before first |  or [ that precedes numbers
        partes = re.split(r"[\[|]", linha)
        nome_raw = partes[0] if partes else linha
        nome = _extrair_nome_cargo(nome_raw)
        # Fallback: try second segment if first is empty or very short
        if len(nome) < 4 and len(partes) > 1:
            nome = _extrair_nome_cargo(partes[1])
        if len(nome) < 4:
            continue

        # Largest value = total column (OCR may truncate last column digits)
        total = max(valores)
        rows.append({
            "ano": ano,
            "municipio": "sorocaba",
            "orgao": "camara",
            "cargo": nome[:100],
            "tipo_valor": "total",
            "valor": total,
            "portaria": portaria,
            "fonte": "Câmara Sorocaba - PDF escaneado (OCR)",
        })

    # Deduplicate by (cargo, valor)
    seen: set[tuple] = set()
    unique: list[dict] = []
    for r in rows:
        key = (r["cargo"], r["valor"])
        if key not in seen:
            seen.add(key)
            unique.append(r)
    return unique


def salvar_csv(rows: list[dict], dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    campos = ["ano", "municipio", "orgao", "cargo", "tipo_valor", "valor", "portaria", "fonte"]
    with dest.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"  Salvo: {dest} ({len(rows)} linhas)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--anos", nargs="+", type=int, default=ANOS)
    parser.add_argument("--salvar-txt", action="store_true", help="Salvar OCR bruto em TXT")
    parser.add_argument("--forcar", action="store_true")
    parser.add_argument(
        "--enhanced", action="store_true",
        help="Pré-processamento de imagem (contraste+binarização) para PDFs de baixa qualidade (2017/2019/2022)",
    )
    args = parser.parse_args()

    if not OCR_OK:
        print("ERRO: Instale os requisitos OCR antes de continuar:")
        print("  sudo apt-get install -y tesseract-ocr tesseract-ocr-por poppler-utils")
        print("  .venv/bin/pip install pdf2image pytesseract Pillow")
        sys.exit(1)

    todos_rows: list[dict] = []

    for ano in args.anos:
        pdf = RAW_DIR / f"subsidios_remuneracao_camara_sorocaba_{ano}.pdf"
        if not pdf.exists():
            print(f"\n=== {ano}: PDF não encontrado, pulando ===")
            continue

        dest_ext = EXTRACTED_DIR / f"subsidios_camara_sorocaba_{ano}.csv"
        dest_pub = PUBLIC_DIR / f"subsidios_camara_sorocaba_{ano}.csv"

        if dest_pub.exists() and not args.forcar:
            print(f"\n=== {ano}: já publicado, pulando (--forcar para reprocessar) ===")
            todos_rows.append({"ano": ano})  # count placeholder
            continue

        modo = "enhanced" if args.enhanced else "padrão"
        print(f"\n=== {ano}: OCR {pdf.name} ({pdf.stat().st_size // 1024}K) [modo {modo}] ===")
        texto = ocr_pdf(pdf, enhanced=args.enhanced)

        if args.salvar_txt and texto:
            TXT_DIR.mkdir(parents=True, exist_ok=True)
            txt_path = TXT_DIR / f"subsidios_camara_sorocaba_{ano}.txt"
            txt_path.write_text(texto, encoding="utf-8")
            print(f"  OCR TXT salvo: {txt_path.name}")

        rows = parsear_texto(texto, ano)
        print(f"  Extraídos: {len(rows)} registros")

        if not rows:
            print(f"  AVISO: nenhum registro extraído — verificar OCR TXT manualmente")

        salvar_csv(rows, dest_ext)
        salvar_csv(rows, dest_pub)
        todos_rows += rows

    real_rows = [r for r in todos_rows if "cargo" in r]
    print(f"\nTotal: {len(real_rows)} registros em {len(args.anos)} anos processados")


if __name__ == "__main__":
    main()
