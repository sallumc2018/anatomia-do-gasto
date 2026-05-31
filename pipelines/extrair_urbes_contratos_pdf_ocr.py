"""
Extrator OCR de contratos PDF da Urbes de Sorocaba.

PDFs sao escaneados (0 chars via pdfplumber). Usa Tesseract 5.4 via pytesseract
com Poppler para conversao de pagina em imagem.

Aprovado por Catao em 2026-05-29 (requirements-audit.txt):
  pytesseract==0.3.13, pdf2image==1.17.0, Pillow==12.2.0

Uso:
    python pipelines/extrair_urbes_contratos_pdf_ocr.py --subpasta all
    python pipelines/extrair_urbes_contratos_pdf_ocr.py --subpasta contratos_outros --lote 10
    python pipelines/extrair_urbes_contratos_pdf_ocr.py --subpasta all --forcar
"""
from __future__ import annotations
import argparse, csv, os, re
from pathlib import Path
import sys

try:
    import pytesseract
    from pdf2image import convert_from_path
except ImportError as e:
    sys.exit(f"Dependencia ausente: {e}. Instalar: python -m pip install pytesseract pdf2image")

# caminhos fixos — nao interpolar de input externo
TESSERACT_CMD   = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
TESSDATA_PREFIX = str(Path.home() / "tessdata")
_POPPLER_HINTS  = [
    Path(os.environ.get("LOCALAPPDATA","")) / "Microsoft/WinGet/Packages",
    Path("C:/Users/user/AppData/Local/Microsoft/WinGet/Packages"),
]

def _find_poppler() -> str | None:
    for hint in _POPPLER_HINTS:
        matches = list(hint.glob("*Poppler*/**/pdftoppm.exe")) if hint.exists() else []
        if matches:
            return str(matches[0].parent)
    return None

POPPLER_PATH = _find_poppler()

sys.path.insert(0, str(Path(__file__).parent))
from paths import RAW_DIR, EXTRACTED_DIR

SUBPASTAS = ["contratos_outros", "contratos_receitas", "contratos_transporte"]
RAW_URBES = RAW_DIR / "transporte" / "urbes"
EXT_URBES = EXTRACTED_DIR / "urbes"

CAMPOS = [
    "subpasta", "arquivo", "paginas_ocr", "chars", "status_ocr",
    "numero_contrato", "cnpj", "valor", "data_assinatura",
    "texto_bruto_p1p2",
]

_RE_CONTRATO = re.compile(r"(?:CONTRATO|Contrato)[^\n]*?[Nn][ºo°]\s*(\d[\d/.\-]+)")
_RE_CNPJ     = re.compile(r"\d{2}[\s.]?\d{3}[\s.]?\d{3}[/\s]?\d{4}[-\s]?\d{2}")
_RE_VALOR    = re.compile(r"R\$\s*([\d.,]+)")
_RE_DATA     = re.compile(r"\d{1,2}\s+de\s+\w+\s+de\s+20\d{2}")


def _extrai_campos(texto: str) -> dict:
    c  = _RE_CONTRATO.search(texto)
    cn = _RE_CNPJ.search(texto)
    v  = _RE_VALOR.search(texto)
    d  = _RE_DATA.search(texto)
    return {
        "numero_contrato": c.group(1).strip() if c else "",
        "cnpj":            cn.group(0).replace(" ", "") if cn else "",
        "valor":           v.group(1) if v else "",
        "data_assinatura": d.group(0) if d else "",
    }


def processar_pdf(pdf: Path, subpasta: str, dpi: int = 180) -> dict:
    base = {"subpasta": subpasta, "arquivo": pdf.name,
            "paginas_ocr": 0, "chars": 0, "status_ocr": "",
            "numero_contrato": "", "cnpj": "", "valor": "",
            "data_assinatura": "", "texto_bruto_p1p2": ""}
    try:
        imgs = convert_from_path(
            str(pdf), first_page=1, last_page=3, dpi=dpi,
            poppler_path=POPPLER_PATH,
        )
        textos = [pytesseract.image_to_string(img, lang="por") for img in imgs]
        texto  = "\n".join(textos)
        campos = _extrai_campos(texto)
        base.update({
            "paginas_ocr": len(imgs), "chars": len(texto),
            "status_ocr":  "ok" if len(texto) > 50 else "texto_curto",
            "texto_bruto_p1p2": texto[:3000],
            **campos,
        })
    except Exception as e:
        base["status_ocr"] = f"erro:{type(e).__name__}:{str(e)[:80]}"
    return base


def processar_subpasta(subpasta: str, lote: int, forcar: bool, dpi: int) -> Path:
    pasta = RAW_URBES / subpasta
    saida = EXT_URBES / f"contratos_{subpasta}_ocr.csv"
    EXT_URBES.mkdir(parents=True, exist_ok=True)

    pdfs = sorted(pasta.glob("*.pdf"))
    print(f"\n=== {subpasta}: {len(pdfs)} PDFs ===")

    if saida.exists() and not forcar:
        existentes = sum(1 for _ in csv.DictReader(saida.open(encoding="utf-8")))
        print(f"  cache: {saida.name} ({existentes} linhas) — use --forcar para reprocessar")
        return saida

    with saida.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CAMPOS)
        writer.writeheader()
        for i in range(0, len(pdfs), lote):
            for pdf in pdfs[i:i + lote]:
                row = processar_pdf(pdf, subpasta, dpi=dpi)
                writer.writerow({k: row.get(k, "") for k in CAMPOS})
                marker = "ok" if row["status_ocr"] == "ok" else "!"
                print(f"  {marker} {pdf.name[:55]} chars={row['chars']}")
            f.flush()
    return saida


def main() -> None:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
    os.environ["TESSDATA_PREFIX"] = TESSDATA_PREFIX

    if not Path(TESSERACT_CMD).exists():
        sys.exit(f"Tesseract nao encontrado em {TESSERACT_CMD}")
    if not POPPLER_PATH:
        sys.exit("Poppler nao encontrado. Instalar: winget install oschwartz10612.Poppler")

    ap = argparse.ArgumentParser(description="OCR de contratos PDF da Urbes")
    ap.add_argument("--subpasta", default="all", choices=SUBPASTAS + ["all"])
    ap.add_argument("--lote",   type=int, default=15)
    ap.add_argument("--dpi",    type=int, default=180)
    ap.add_argument("--forcar", action="store_true")
    args = ap.parse_args()

    alvos = SUBPASTAS if args.subpasta == "all" else [args.subpasta]
    for sub in alvos:
        saida = processar_subpasta(sub, args.lote, args.forcar, args.dpi)
        rows  = list(csv.DictReader(saida.open(encoding="utf-8")))
        ok    = sum(1 for r in rows if r["status_ocr"] == "ok")
        erros = sum(1 for r in rows if r["status_ocr"].startswith("erro"))
        print(f"  -> {saida.name}: {len(rows)} reg  ok={ok}  erros={erros}")

    print("\nOCR Urbes concluido.")


if __name__ == "__main__":
    main()
