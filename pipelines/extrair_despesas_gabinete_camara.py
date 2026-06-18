"""
Extrai CSVs mensais de despesas de gabinete dos PDFs da Câmara Municipal de Sorocaba.

Entrada:  data/raw/sorocaba/camara/gabinete/{ano}/gabinete_sorocaba_{ano}_{mm}_{mes}.pdf
Saida:    data/extracted/sorocaba/camara/gabinete/saida/despesas_gabinete_camara_sorocaba_{ano}.csv

Colunas: ano, mes, vereador, aluguel_maquina, combustivel, material_escritorio,
          postagem, total, reembolso
"""

import re
import csv
import sys
import pathlib

import pypdfium2 as pdfium

ROOT = pathlib.Path(__file__).parent.parent
RAW_DIR  = ROOT / "data" / "raw"  / "sorocaba" / "camara" / "gabinete"
OUT_DIR  = ROOT / "data" / "extracted" / "sorocaba" / "camara" / "gabinete" / "saida"

COLS = ["ano", "mes", "vereador",
        "aluguel_maquina", "combustivel", "material_escritorio",
        "postagem", "total", "reembolso"]

NUM_OR_DASH = r"[\d\.]+,\d+|-"

# Padrão de linha de vereador: nome + 5 valores obrigatórios + reembolso opcional
# (algumas versões do PDF omitem o "-" quando reembolso = zero)
ROW_RE = re.compile(
    r"^(.+?)\s+"
    r"(" + NUM_OR_DASH + r")\s+"
    r"(" + NUM_OR_DASH + r")\s+"
    r"(" + NUM_OR_DASH + r")\s+"
    r"(" + NUM_OR_DASH + r")\s+"
    r"(" + NUM_OR_DASH + r")"
    r"(?:\s+(" + NUM_OR_DASH + r"))?"
    r"\s*$"
)

MESES_PT = {
    "JANEIRO": 1, "FEVEREIRO": 2, "MARCO": 3, "MARCO": 3, "MARÇO": 3,
    "ABRIL": 4, "MAIO": 5, "JUNHO": 6, "JULHO": 7, "AGOSTO": 8,
    "SETEMBRO": 9, "OUTUBRO": 10, "NOVEMBRO": 11, "DEZEMBRO": 12,
}

# Nomes de arquivos -> número do mês
MES_FILENAME_MAP = {
    "janeiro": 1, "fevereiro": 2, "marco": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8,
    "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12,
}


def normalize_num(s: str) -> str:
    """Converte '1.234,56' -> '1234.56'; '-' -> ''."""
    s = s.strip()
    if s == "-" or s == "":
        return ""
    return s.replace(".", "").replace(",", ".")


def parse_pdf(pdf_path: pathlib.Path) -> list[dict]:
    """Extrai linhas de dados do PDF. Retorna lista de dicts."""
    doc = pdfium.PdfDocument(str(pdf_path))
    page = doc[0]
    textpage = page.get_textpage()
    text = textpage.get_text_range()

    # Encontrar MÊS e ANO no rodapé do texto (vem após os dados)
    header_match = re.search(r"(JANEIRO|FEVEREIRO|MAR[CÇ]O|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\s+(\d{4})", text, re.IGNORECASE)
    if header_match:
        mes_str = header_match.group(1).upper().replace("Ç", "C")
        ano_pdf = int(header_match.group(2))
        mes_num = MESES_PT.get(mes_str, 0)
    else:
        # Fallback: usar nome do arquivo
        parts = pdf_path.stem.split("_")
        ano_pdf = int(parts[3]) if len(parts) > 3 else 0
        mes_nome = parts[5] if len(parts) > 5 else ""
        mes_num = MES_FILENAME_MAP.get(mes_nome.lower(), 0)

    rows = []
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.upper().startswith("TOTAL"):
            break
        if line.upper().startswith("VEREADORES"):
            continue
        if "RESOLUCAO" in line.upper() or "RESOLUÇÃO" in line.upper():
            continue
        if re.match(r"^(JANEIRO|FEVEREIRO|MAR[CÇ]O|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\s+\d{4}$", line, re.IGNORECASE):
            continue
        # Pular linhas de cabeçalho de coluna multi-linha
        if line.upper() in {"ALUGUEL DE", "MAQUINA", "MÁQUINA", "REPROGRAFICA", "REPROGRÁFICA",
                             "COMBUSTIVEL", "COMBUSTÍVEL", "MATERIAL DE", "ESCRITORIO", "ESCRITÓRIO",
                             "POSTAGEM", "REEMBOLSO"}:
            continue
        # Pular notas de rodapé (* ou **)
        if line.startswith("*"):
            continue
        # Pular linha só com " -"
        if line == "-" or line == " -":
            continue

        m = ROW_RE.match(line)
        if m:
            nome, aluguel, combust, material, postagem, total, reembolso = m.groups()
            # reembolso pode ser None quando a coluna está ausente no PDF
            if reembolso is None:
                reembolso = "-"
            rows.append({
                "ano": ano_pdf,
                "mes": mes_num,
                "vereador": nome.strip(),
                "aluguel_maquina": normalize_num(aluguel),
                "combustivel": normalize_num(combust),
                "material_escritorio": normalize_num(material),
                "postagem": normalize_num(postagem),
                "total": normalize_num(total),
                "reembolso": normalize_num(reembolso),
            })

    return rows


def process_year(year: int) -> tuple[int, int]:
    """Processa todos os PDFs de um ano. Retorna (registros, erros)."""
    year_dir = RAW_DIR / str(year)
    if not year_dir.exists():
        return 0, 0

    all_rows = []
    errors = 0

    pdf_files = sorted(year_dir.glob("gabinete_sorocaba_*.pdf"))
    for pdf_path in pdf_files:
        try:
            rows = parse_pdf(pdf_path)
            if rows:
                all_rows.extend(rows)
            else:
                print(f"  AVISO: sem linhas em {pdf_path.name}", file=sys.stderr)
        except Exception as e:
            print(f"  ERRO {pdf_path.name}: {e}", file=sys.stderr)
            errors += 1

    if all_rows:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        out_path = OUT_DIR / f"despesas_gabinete_camara_sorocaba_{year}.csv"
        all_rows.sort(key=lambda r: (r["mes"], r["vereador"]))
        with open(out_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=COLS)
            writer.writeheader()
            writer.writerows(all_rows)
        print(f"  Escrito: {out_path.name} ({len(all_rows)} linhas)")

    return len(all_rows), errors


def main():
    anos = sorted(d.name for d in RAW_DIR.iterdir() if d.is_dir() and d.name.isdigit())
    print(f"Anos encontrados: {anos}")

    total_rows = 0
    for ano in anos:
        print(f"\n[{ano}]")
        rows, erros = process_year(int(ano))
        total_rows += rows
        if erros:
            print(f"  {erros} erros")

    print(f"\nTotal: {total_rows} registros extraidos")


if __name__ == "__main__":
    main()
