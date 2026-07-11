"""
Extrator de LOA / PPA / LDO de Paulínia a partir dos PDFs locais (SMARAPD).

Requisito: pdfplumber (já em requirements.txt)

Uso:
    MUNICIPIO=paulinia .venv/bin/python3 pipelines/extrator_loa_paulinia.py
    MUNICIPIO=paulinia .venv/bin/python3 pipelines/extrator_loa_paulinia.py --tipo loa
    MUNICIPIO=paulinia .venv/bin/python3 pipelines/extrator_loa_paulinia.py --tipo ldo --debug

Saída:
    data/public/paulinia/orcamento/saida/loa_totais_paulinia_{ano}.csv
    data/public/paulinia/orcamento/saida/ppa_totais_paulinia_{ano}.csv
    data/public/paulinia/orcamento/saida/ldo_totais_paulinia_{ano}.csv
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from pipelines.paths import RAW_BASE_DIR  # noqa: E402

RAW_LOA = RAW_BASE_DIR / "paulinia" / "smarapd" / "pecas_planejamento" / "loa"
RAW_PPA = RAW_BASE_DIR / "paulinia" / "smarapd" / "pecas_planejamento" / "ppa"
RAW_LDO = RAW_BASE_DIR / "paulinia" / "smarapd" / "pecas_planejamento" / "ldo"
PUBLIC_DIR = ROOT / "data" / "public" / "paulinia" / "orcamento" / "saida"

try:
    import pdfplumber
    PDF_OK = True
except ImportError:
    PDF_OK = False

# Patterns for filtering valid table rows with budget data
_VALOR_PATTERN = re.compile(r"\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})")
_ANO_FROM_FILENAME = re.compile(r"20\d{2}")

# Column names that indicate a budget table (case-insensitive)
_BUDGET_HEADERS = {
    "dotacao", "dotação", "inicial", "atualiz", "empenhado", "empenhada",
    "funcao", "função", "subfuncao", "subfunção", "orgao", "órgão", "total",
}


def _ano_from_path(p: Path) -> int | None:
    """Infer the budget year from filename."""
    matches = _ANO_FROM_FILENAME.findall(p.name)
    if not matches:
        return None
    # Prefer years >= 2020
    valid = [int(y) for y in matches if 2020 <= int(y) <= 2030]
    return max(valid) if valid else int(matches[-1])


def _clean_value(s: str) -> float | None:
    """Parse Brazilian number format: 1.234.567,89 → 1234567.89"""
    if not s:
        return None
    s = s.strip().replace(" ", "")
    # Remove thousand separators and convert decimal comma
    s = re.sub(r"\.(?=\d{3})", "", s)
    s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _is_budget_table(headers: list[str]) -> bool:
    if not headers:
        return False
    joined = " ".join(h.lower() for h in headers if h)
    return any(kw in joined for kw in _BUDGET_HEADERS)


def _extract_tables_from_pdf(pdf_path: Path, debug: bool = False) -> list[dict]:
    """Extract all budget rows from a PDF using pdfplumber table extraction."""
    if not PDF_OK:
        print("  ERRO: pdfplumber não instalado — instale com pip install pdfplumber", file=sys.stderr)
        return []

    rows: list[dict] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables(
                table_settings={
                    "vertical_strategy": "lines_strict",
                    "horizontal_strategy": "lines_strict",
                    "snap_tolerance": 4,
                }
            )
            if not tables:
                # Fallback: try with text strategy
                tables = page.extract_tables(
                    table_settings={
                        "vertical_strategy": "text",
                        "horizontal_strategy": "text",
                        "snap_tolerance": 3,
                    }
                )

            for table in (tables or []):
                if not table or len(table) < 2:
                    continue
                headers = [str(c or "").strip() for c in table[0]]
                if not _is_budget_table(headers):
                    continue
                if debug:
                    print(f"  página {page_num} — headers: {headers}")
                for row in table[1:]:
                    if not row:
                        continue
                    cells = [str(c or "").strip() for c in row]
                    # Skip empty rows or totals rows
                    if not any(cells):
                        continue
                    row_dict = dict(zip(headers, cells))
                    rows.append(row_dict)

    return rows


def _normalize_rows(raw_rows: list[dict], ano: int, tipo: str) -> list[dict]:
    """Normalize raw table rows to the output schema."""
    out: list[dict] = []
    for r in raw_rows:
        # Try to find columns by keyword matching
        orgao = descricao = funcao = subfuncao = ""
        dotacao_inicial = dotacao_atualizada = empenhado = None

        for k, v in r.items():
            kl = k.lower()
            if any(w in kl for w in ("orgao", "órgão", "unidade", "secretaria")):
                orgao = v
            elif any(w in kl for w in ("descricao", "descrição", "nome", "acao", "ação")):
                descricao = v
            elif "subfun" in kl:
                subfuncao = v
            elif "fun" in kl and "subfun" not in kl:
                funcao = v
            elif any(w in kl for w in ("inicial",)):
                dotacao_inicial = _clean_value(v)
            elif any(w in kl for w in ("atualiz", "atual")):
                dotacao_atualizada = _clean_value(v)
            elif any(w in kl for w in ("empenh",)):
                empenhado = _clean_value(v)

        # Only include rows that have at least one numeric value
        if all(v is None for v in (dotacao_inicial, dotacao_atualizada, empenhado)):
            continue

        out.append({
            "ano": ano,
            "tipo_peca": tipo,
            "orgao": orgao,
            "descricao": descricao,
            "funcao": funcao,
            "subfuncao": subfuncao,
            "dotacao_inicial": dotacao_inicial if dotacao_inicial is not None else "",
            "dotacao_atualizada": dotacao_atualizada if dotacao_atualizada is not None else "",
            "empenhado": empenhado if empenhado is not None else "",
        })
    return out


def processar_tipo(raw_dir: Path, tipo: str, debug: bool = False) -> dict[int, list[dict]]:
    """Process all PDFs of a given type (loa/ppa/ldo) and return rows by year."""
    if not raw_dir.exists():
        print(f"  Diretório não encontrado: {raw_dir}", file=sys.stderr)
        return {}

    pdfs = sorted(raw_dir.glob("*.pdf"))
    # Prefer files with "LEI" in name (actual law vs. presentations/atas)
    lei_pdfs = [p for p in pdfs if re.search(r"LEI|ORCA|LOA|LDO|PPA", p.name, re.I)]
    if lei_pdfs:
        pdfs = lei_pdfs

    por_ano: dict[int, list[dict]] = {}
    for pdf in pdfs:
        ano = _ano_from_path(pdf)
        if ano is None:
            if debug:
                print(f"  IGNORADO (sem ano): {pdf.name}")
            continue
        print(f"  [{tipo.upper()} {ano}] {pdf.name}")
        raw_rows = _extract_tables_from_pdf(pdf, debug=debug)
        normalized = _normalize_rows(raw_rows, ano, tipo)
        if normalized:
            por_ano.setdefault(ano, []).extend(normalized)
            print(f"    → {len(normalized)} linhas extraídas")
        else:
            print("    → nenhuma linha com dados numéricos (verifique manualmente)")

    return por_ano


def salvar(por_ano: dict[int, list[dict]], tipo: str) -> list[Path]:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    FIELDNAMES = ["ano", "tipo_peca", "orgao", "descricao", "funcao", "subfuncao",
                  "dotacao_inicial", "dotacao_atualizada", "empenhado"]
    saved: list[Path] = []
    for ano, rows in sorted(por_ano.items()):
        path = PUBLIC_DIR / f"{tipo}_totais_paulinia_{ano}.csv"
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=FIELDNAMES)
            w.writeheader()
            w.writerows(rows)
        print(f"  ✅ {path.name} — {len(rows)} linhas")
        saved.append(path)
    return saved


def main() -> int:
    parser = argparse.ArgumentParser(description="Extrator LOA/PPA/LDO Paulínia")
    parser.add_argument("--tipo", choices=["loa", "ppa", "ldo", "todos"], default="todos")
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    tipos = ["loa", "ppa", "ldo"] if args.tipo == "todos" else [args.tipo]
    raw_dirs = {"loa": RAW_LOA, "ppa": RAW_PPA, "ldo": RAW_LDO}

    total_arquivos = 0
    for tipo in tipos:
        print(f"\n── {tipo.upper()} ──────────────────────────────")
        por_ano = processar_tipo(raw_dirs[tipo], tipo, debug=args.debug)
        if por_ano:
            saved = salvar(por_ano, tipo)
            total_arquivos += len(saved)
        else:
            print(f"  Nenhum dado extraído para {tipo.upper()}")

    print(f"\nTotal: {total_arquivos} arquivo(s) publicado(s) em {PUBLIC_DIR}")
    if total_arquivos == 0:
        print("\n⚠️  Nenhum dado extraído.")
        print("   Possíveis causas:")
        print("   1. PDFs têm tabelas sem bordas (tente --debug para ver headers)")
        print("   2. pdfplumber não consegue extrair tabelas (PDFs escaneados sem OCR)")
        print("   3. Colunas com nomes não reconhecidos (adicione em _BUDGET_HEADERS)")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
