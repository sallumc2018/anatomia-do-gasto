"""
Extração de texto de PDFs: digital (pdfplumber) com fallback OCR (pytesseract).

Uso:
    from tools.pipeline.ocr_utils import extrair_texto_pdf

    texto = extrair_texto_pdf("caminho/para/arquivo.pdf")
    # Retorna string vazia se falhar silenciosamente em ambas as camadas.

Dependências:
    pdfplumber  — já em requirements.txt
    pytesseract — já instalado
    pdf2image   — já instalado
    Tesseract 5 — binário em C:/Program Files/Tesseract-OCR/tesseract.exe
    Poppler     — detectado via _find_poppler() (já instalado via winget)

Política de fallback:
    1. pdfplumber extrai texto nativo
    2. Se resultado < MIN_CHARS, assume PDF escaneado → OCR pytesseract (lang=por+eng)
    3. Se OCR falhar (Tesseract não encontrado), loga aviso e retorna ''
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pdfplumber

MIN_CHARS = 100
TESSERACT_DEFAULT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def _poppler_path() -> str | None:
    """Retorna o path do Poppler instalado via winget (ou None se não encontrado)."""
    winget_base = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Packages"
    if winget_base.exists():
        for d in winget_base.iterdir():
            candidate = d / "poppler-25.07.0" / "Library" / "bin"
            if candidate.exists():
                return str(candidate)
            # busca genérica dentro do pacote
            for sub in d.rglob("pdftoppm.exe"):
                return str(sub.parent)
    return None


def _configurar_tesseract() -> bool:
    """Configura o path do Tesseract para pytesseract. Retorna True se ok."""
    try:
        import pytesseract
        if os.path.exists(TESSERACT_DEFAULT):
            pytesseract.pytesseract.tesseract_cmd = TESSERACT_DEFAULT
        return True
    except ImportError:
        return False


def extrair_texto_pdf(arquivo: str | Path, paginas: list[int] | None = None, dpi: int = 300) -> str:
    """
    Extrai texto de um PDF — digital ou escaneado.

    Args:
        arquivo: Caminho para o arquivo PDF.
        paginas: Lista de índices 0-based das páginas. None = todas.

    Returns:
        Texto extraído (pode ser '' em caso de falha total).
    """
    arquivo = Path(arquivo)
    if not arquivo.exists():
        print(f"[ocr_utils] AVISO: arquivo não encontrado: {arquivo}", file=sys.stderr)
        return ""

    # Camada 1: pdfplumber (texto digital)
    try:
        with pdfplumber.open(str(arquivo)) as pdf:
            paginas_alvo = [pdf.pages[i] for i in paginas] if paginas else pdf.pages
            texto = " ".join(p.extract_text() or "" for p in paginas_alvo)
        if len(texto.strip()) >= MIN_CHARS:
            return texto
    except Exception as e:
        print(f"[ocr_utils] pdfplumber falhou em {arquivo.name}: {e}", file=sys.stderr)

    # Camada 2: OCR via pytesseract
    if not _configurar_tesseract():
        print("[ocr_utils] pytesseract não disponível — retornando texto parcial.", file=sys.stderr)
        return texto if texto else ""

    try:
        from pdf2image import convert_from_path

        poppler = _poppler_path()
        kwargs: dict = {"dpi": dpi}
        if poppler:
            kwargs["poppler_path"] = poppler
        if paginas:
            # pdf2image usa first_page/last_page 1-based
            kwargs["first_page"] = min(paginas) + 1
            kwargs["last_page"] = max(paginas) + 1

        imagens = convert_from_path(str(arquivo), **kwargs)
        import pytesseract
        ocr_texto = " ".join(
            pytesseract.image_to_string(img, lang="por+eng") for img in imagens
        )
        return ocr_texto.strip()

    except Exception as e:
        print(f"[ocr_utils] OCR falhou em {arquivo.name}: {e}", file=sys.stderr)
        return texto if texto else ""


def eh_pdf_escaneado(arquivo: str | Path) -> bool:
    """Retorna True se o PDF parece escaneado (texto nativo abaixo do limiar)."""
    try:
        with pdfplumber.open(str(arquivo)) as pdf:
            texto = " ".join(p.extract_text() or "" for p in pdf.pages[:3])
        return len(texto.strip()) < MIN_CHARS
    except Exception:
        return True
