"""
Preenche meses faltantes na série Urbes despesas mensais (Lei 8890).

Gaps conhecidos com total_mensal vazio:
  - Dez/2012  (PDF: relacao_mensal_despesas_2012_20120215125240desp-2012.pdf)
  - Dez/2013  (PDF: relacao_mensal_despesas_2013_20130218120544desp-2013.pdf)
  - Dez/2024  (PDF: relacao_mensal_despesas_2024_lei8890_2024.pdf)

Estratégia:
  1. Para cada gap, tentar baixar o PDF do portal Urbes.
  2. Extrair o total do mês de Dezembro via pdfplumber.
  3. Se PDF não disponível ou não parseável, registrar como fonte_ausente.
  4. Atualizar o CSV preservando todas as outras linhas intactas.

Uso:
    .venv/bin/python3 pipelines/atualizar_urbes_gaps.py
    .venv/bin/python3 pipelines/atualizar_urbes_gaps.py --dry-run

Saída:
    data/public/sorocaba/transporte/urbes/saida/urbes_despesas_mensais_sorocaba.csv
    (atualização in-place com backup automático)
"""
from __future__ import annotations

import argparse
import csv
import re
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET_CSV = (
    ROOT
    / "data/public/sorocaba/transporte/urbes/saida"
    / "urbes_despesas_mensais_sorocaba.csv"
)
RAW_DIR = ROOT / "data/raw/sorocaba/urbes/relacoes_mensais"

try:
    import requests
    HTTP_OK = True
except ImportError:
    HTTP_OK = False

try:
    import pdfplumber
    PDF_OK = True
except ImportError:
    PDF_OK = False

# Known gaps: (ano, mes, filename)
GAPS = [
    (2012, 12, "relacao_mensal_despesas_2012_20120215125240desp-2012.pdf"),
    (2013, 12, "relacao_mensal_despesas_2013_20130218120544desp-2013.pdf"),
    (2024, 12, "relacao_mensal_despesas_2024_lei8890_2024.pdf"),
]

# Portal Urbes — transparência
URBES_BASE = "https://www.urbes.com.br/transparencia"
URBES_PDF_BASE = "https://www.urbes.com.br/uploads/transparencia"


def _download_pdf(filename: str, dest: Path, session: "requests.Session") -> bool:
    """Try downloading a Urbes PDF. Returns True on success."""
    if dest.exists() and dest.stat().st_size > 1024:
        return True

    # Try multiple URL patterns Urbes has used over the years
    candidates = [
        f"{URBES_PDF_BASE}/{filename}",
        f"{URBES_PDF_BASE}/lei8890/{filename}",
        f"{URBES_BASE}/{filename}",
    ]
    for url in candidates:
        try:
            resp = session.get(url, timeout=30, allow_redirects=True)
            if resp.status_code == 200 and len(resp.content) > 1024:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(resp.content)
                print(f"    Baixado: {dest.name} ({len(resp.content)//1024}K) de {url}")
                return True
        except Exception as exc:
            print(f"    AVISO [{url}]: {exc}", file=sys.stderr)
    return False


def _extract_dezembro_total(pdf_path: Path) -> float | None:
    """
    Extract December total from a Urbes monthly expenses PDF.
    These PDFs contain a table with monthly lines; December is usually the last row
    or labeled 'Dezembro'/'Dez'.
    """
    if not PDF_OK:
        return None

    meses_dez = re.compile(r"dez(embro)?", re.I)
    # Pattern for Brazilian R$ value: may be 1.234,56 or 1234,56 or 1.234.567,89
    _valor = re.compile(r"\d{1,3}(?:[.\s]\d{3})*[,]\d{2}")

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables() or []
            for table in tables:
                for row in (table or []):
                    if not row:
                        continue
                    row_text = " ".join(str(c or "") for c in row)
                    if meses_dez.search(row_text):
                        # Try to extract a monetary value from this row
                        nums = _valor.findall(row_text)
                        if nums:
                            # Take the last numeric value (likely the total column)
                            raw = nums[-1].replace(".", "").replace(",", ".")
                            try:
                                return float(raw)
                            except ValueError:
                                pass

            # Fallback: scan raw text for "Dez" + value on the same line
            text = page.extract_text() or ""
            for line in text.split("\n"):
                if meses_dez.search(line):
                    nums = _valor.findall(line)
                    if nums:
                        raw = nums[-1].replace(".", "").replace(",", ".")
                        try:
                            return float(raw)
                        except ValueError:
                            pass

    return None


def processar_gaps(dry_run: bool) -> dict[tuple[int, int], str]:
    """
    For each gap, attempt download + parse.
    Returns dict: {(ano, mes): valor_str_or_status}
    """
    resultados: dict[tuple[int, int], str] = {}

    session = None
    if HTTP_OK:
        import requests as req
        session = req.Session()
        session.headers["User-Agent"] = (
            "Mozilla/5.0 (compatible; AnatomiaDoGasto/1.0; +https://anatomiadogasto.ong.br)"
        )

    for ano, mes, filename in GAPS:
        print(f"\n── Gap {ano}-{mes:02d} ({filename}) ──")
        pdf_dest = RAW_DIR / filename

        # Step 1: try to get PDF from raw dir or download
        got_pdf = pdf_dest.exists() and pdf_dest.stat().st_size > 1024
        if not got_pdf and session:
            got_pdf = _download_pdf(filename, pdf_dest, session)

        if not got_pdf:
            print(f"  PDF não encontrado e não disponível para download — marcando fonte_ausente")
            resultados[(ano, mes)] = "fonte_ausente"
            continue

        # Step 2: extract December total
        print(f"  Extraindo Dezembro de {pdf_dest.name} …")
        total = _extract_dezembro_total(pdf_dest)

        if total is None:
            print(f"  Não foi possível extrair valor — marcando fonte_ausente")
            resultados[(ano, mes)] = "fonte_ausente"
        else:
            print(f"  Total Dez/{ano}: R$ {total:,.2f}")
            resultados[(ano, mes)] = f"{total:.2f}"

    return resultados


def atualizar_csv(resultados: dict[tuple[int, int], str], dry_run: bool) -> int:
    """Update TARGET_CSV with the resolved gap values. Returns count of rows updated."""
    if not TARGET_CSV.exists():
        print(f"ERRO: CSV não encontrado: {TARGET_CSV}", file=sys.stderr)
        return 0

    # Read all rows
    with TARGET_CSV.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        rows = list(reader)

    updated = 0
    for row in rows:
        key = (int(row["ano"]), int(row["mes"]))
        if key in resultados:
            new_val = resultados[key]
            if new_val == "fonte_ausente":
                if not row["total_mensal"]:
                    row["arquivo_origem"] = row["arquivo_origem"] + " [fonte_ausente]"
                    updated += 1
            else:
                if row["total_mensal"] != new_val:
                    print(f"  Atualizando {row['ano']}-{row['mes']:>2}: '' → {new_val}")
                    row["total_mensal"] = new_val
                    updated += 1

    if dry_run:
        print(f"\n[dry-run] {updated} linha(s) seriam atualizadas — nenhuma alteração no disco")
        return updated

    if updated == 0:
        print("Nenhuma linha precisou de atualização.")
        return 0

    # Backup before writing
    backup = TARGET_CSV.with_suffix(".csv.bak")
    shutil.copy2(TARGET_CSV, backup)
    print(f"  Backup: {backup.name}")

    with TARGET_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"  CSV atualizado: {TARGET_CSV.name} ({updated} linha(s) modificada(s))")
    return updated


def main() -> int:
    parser = argparse.ArgumentParser(description="Preenche gaps Urbes despesas mensais")
    parser.add_argument("--dry-run", action="store_true", help="Não alterar arquivos")
    args = parser.parse_args()

    if not PDF_OK:
        print("AVISO: pdfplumber não instalado — extração de PDFs indisponível")
        print("  .venv/bin/pip install pdfplumber")

    if not HTTP_OK:
        print("AVISO: requests não instalado — download automático indisponível")
        print("  .venv/bin/pip install requests")

    resultados = processar_gaps(dry_run=args.dry_run)

    print(f"\n── Resultados ──")
    for (ano, mes), val in sorted(resultados.items()):
        status = val if val == "fonte_ausente" else f"R$ {float(val):,.2f}"
        print(f"  {ano}-{mes:02d}: {status}")

    n = atualizar_csv(resultados, dry_run=args.dry_run)

    # Summary
    resolvidos = sum(1 for v in resultados.values() if v != "fonte_ausente")
    ausentes   = sum(1 for v in resultados.values() if v == "fonte_ausente")
    print(f"\nTotal: {resolvidos} resolvidos, {ausentes} marcados como fonte_ausente")

    if ausentes > 0:
        print("\nPara os meses marcados como fonte_ausente:")
        print("  1. Verificar portal: https://www.urbes.com.br/transparencia")
        print("  2. Se PDF disponível offline, colocar em:")
        print(f"     {RAW_DIR}/")
        print("  3. Executar novamente: python3 pipelines/atualizar_urbes_gaps.py")

    return 0 if n >= 0 else 1


if __name__ == "__main__":
    sys.exit(main())
