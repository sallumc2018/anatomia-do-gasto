"""
Extrai texto integral dos PDFs de alertas SDG do TCE-SP e filtra alertas analíticos
da base CSV para Sorocaba, anos 2020-2024.

Saída em data/extracted/sorocaba/controle_externo/:
  alertas_sdg_texto_2025_sorocaba.csv   — texto paginado dos 4 PDFs SDG 2025
  alertas_analitico_sorocaba_2020_2024.csv — recorte da base analítica pré-2025
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from paths import RAW_DIR, EXTRACTED_DIR

try:
    import pdfplumber
except ImportError:
    sys.exit("pdfplumber nao instalado: pip install pdfplumber")

SDG_RAW = RAW_DIR / "tce" / "2026-05-29" / "fontes" / "alertas_sdg"
ALERTAS_CSV_RAW = RAW_DIR / "tce" / "2026-05-29" / "alertas" / "alertas_analitico.csv"
OUT_DIR = EXTRACTED_DIR / "controle_externo"
OUT_DIR.mkdir(parents=True, exist_ok=True)


# ── 1. Extração de texto dos PDFs SDG 2025 ──────────────────────────────────

def extrair_pdfs_sdg() -> Path:
    saida = OUT_DIR / "alertas_sdg_texto_2025_sorocaba.csv"
    pdfs = sorted(SDG_RAW.glob("*.pdf"))
    print(f"\n=== SDG PDFs: {len(pdfs)} arquivos em {SDG_RAW} ===")

    rows: list[dict] = []
    for pdf_path in pdfs:
        print(f"  Processando: {pdf_path.name} ({pdf_path.stat().st_size // 1024} KB)")
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for i, page in enumerate(pdf.pages, 1):
                    texto = page.extract_text() or ""
                    rows.append({
                        "arquivo": pdf_path.name,
                        "pagina": i,
                        "total_paginas": len(pdf.pages),
                        "chars": len(texto),
                        "texto": texto.replace("\n", " ").strip(),
                    })
        except Exception as e:
            rows.append({
                "arquivo": pdf_path.name, "pagina": 0, "total_paginas": 0,
                "chars": 0, "texto": f"ERRO:{e}",
            })

    campos = ["arquivo", "pagina", "total_paginas", "chars", "texto"]
    with saida.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(rows)

    print(f"  -> {saida.name}: {len(rows)} páginas extraídas")
    return saida


# ── 2. Filtro alertas analíticos Sorocaba 2020-2024 ─────────────────────────

def _col_municipio(row: dict) -> str:
    return next((row[k] or "" for k in row if "munic" in k.lower()), "").strip().lower()


def _col_exercicio(row: dict) -> int | None:
    val = next((row[k] for k in row if "exerc" in k.lower() or k.lower() == "ano"), "")
    try:
        return int(str(val).strip())
    except (ValueError, TypeError):
        return None


def _e_sorocaba_2020_2024(row: dict) -> bool:
    ano = _col_exercicio(row)
    return ano is not None and 2020 <= ano <= 2024 and "sorocaba" in _col_municipio(row)


def _detectar_delim(path: Path) -> str:
    sample = path.read_bytes()[:2048].decode("latin-1", errors="replace")
    return ";" if sample.count(";") > sample.count(",") else ","


def filtrar_alertas_analitico() -> Path:
    saida = OUT_DIR / "alertas_analitico_sorocaba_2020_2024.csv"
    print(f"\n=== Alertas analítico: filtrando {ALERTAS_CSV_RAW.name} ===")

    if not ALERTAS_CSV_RAW.exists():
        print(f"  AVISO: {ALERTAS_CSV_RAW} não encontrado")
        return saida

    delim = _detectar_delim(ALERTAS_CSV_RAW)
    with ALERTAS_CSV_RAW.open(encoding="latin-1", errors="replace") as f:
        reader = csv.DictReader(f, delimiter=delim)
        campos = reader.fieldnames or []
        rows_filtradas = [r for r in reader if _e_sorocaba_2020_2024(r)]

    with saida.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(rows_filtradas)

    print(f"  -> {saida.name}: {len(rows_filtradas)} registros (2020-2024)")
    return saida


def main() -> None:
    extrair_pdfs_sdg()
    filtrar_alertas_analitico()
    print("\nExtração controle externo concluída.")


if __name__ == "__main__":
    main()
