"""
Baixa e extrai LOA (Lei Orçamentária Anual) de Sorocaba do portal LAI.

Fontes:
- 2020-2026: informacoeslai.sorocaba.sp.gov.br (lei + anexos CN-SIFPM)
- 2025-2026: Câmara (já baixados por baixar_camara_api.py)

Saída:
- data/raw/sorocaba/prefeitura/loa/{ano}/loa_{ano}.pdf
- data/extracted/sorocaba/loa/saida/loa_sorocaba_{ano}.csv  (totais + órgãos + funções)
- data/public/sorocaba/orcamento/loa/saida/loa_sorocaba_{ano}.csv

Uso:
    .venv/bin/python3 pipelines/baixar_loa_prefeitura.py
    .venv/bin/python3 pipelines/baixar_loa_prefeitura.py --anos 2022 2023
    .venv/bin/python3 pipelines/baixar_loa_prefeitura.py --so-baixar
    .venv/bin/python3 pipelines/baixar_loa_prefeitura.py --so-extrair
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
import time
from pathlib import Path

try:
    import requests as _requests
    def _get(url: str, headers: dict, timeout: int = 60) -> bytes:
        r = _requests.get(url, headers=headers, timeout=timeout)
        r.raise_for_status()
        return r.content
except ImportError:
    import urllib.request as _urllib
    def _get(url: str, headers: dict, timeout: int = 60) -> bytes:  # type: ignore[misc]
        req = _urllib.Request(url, headers=headers)
        with _urllib.urlopen(req, timeout=timeout) as resp:
            return resp.read()

try:
    import pdfplumber
except ImportError:
    pdfplumber = None  # type: ignore

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw" / "sorocaba" / "prefeitura" / "loa"
EXTRACTED_DIR = ROOT / "data" / "extracted" / "sorocaba" / "loa" / "saida"
PUBLIC_DIR = ROOT / "data" / "public" / "sorocaba" / "orcamento" / "loa" / "saida"

BASE_URL = "https://informacoeslai.sorocaba.sp.gov.br/wp-content/anexos/SEF/Transparencia/01%20-%20Informacoes%20de%20Prestacoes%20de%20Contas%20-%20Lei%20de%20Responsabilidade%20Fiscal/Lei%20Orcamentaria%20Anual%20-%20LOA"

ANOS_URLS: dict[int, list[str]] = {
    2020: [
        f"{BASE_URL}/2020%20-%20Lei%20Or%C3%A7ament%C3%A1ria%20Anual.pdf",
        f"{BASE_URL}/2020%20-%20Lei%20Or%C3%A7ament%C3%A1ria%20Anual%20-%20Anexos.pdf",
    ],
    2021: [
        f"{BASE_URL}/2021%20-%20Lei%20Or%C3%A7ament%C3%A1ria%20Anual.pdf",
        f"{BASE_URL}/2021%20-%20Lei%20Or%C3%A7ament%C3%A1ria%20Anual%20-%20Anexos.pdf",
    ],
    2022: [
        f"{BASE_URL}/2022%20-%20Lei%20Or%C3%A7ament%C3%A1ria%20Anual.pdf",
        f"{BASE_URL}/2022%20-%20Lei%20Or%C3%A7ament%C3%A1ria%20Anual%20-%20Anexos.pdf",
    ],
    2023: [
        f"{BASE_URL}/2023%20-%20Lei%20Or%C3%A7ament%C3%A1ria%20Anual.pdf",
        f"{BASE_URL}/2023%20-%20Lei%20Or%C3%A7ament%C3%A1ria%20Anual%20-%20Anexos.PDF",
    ],
    2024: [
        f"{BASE_URL}/2024%20-%20Lei%20Or%C3%A7ament%C3%A1ria%20Anual.pdf",
    ],
    2025: [
        f"{BASE_URL}/2025%20-%20Lei%20Or%C3%A7ament%C3%A1ria%20Anual.pdf",
    ],
    2026: [
        f"{BASE_URL}/2026%20-%20Lei%20Or%C3%A7ament%C3%A1ria%20Anual.pdf",
    ],
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    "Referer": "https://informacoeslai.sorocaba.sp.gov.br/",
}


def baixar(ano: int, forcar: bool = False) -> list[Path]:
    ano_dir = RAW_DIR / str(ano)
    ano_dir.mkdir(parents=True, exist_ok=True)
    baixados = []
    for url in ANOS_URLS.get(ano, []):
        Path(url.split("/")[-1].replace("%20", "_").replace("%C3%A7", "c").replace("%C3%A1", "a"))
        # Normalize filename
        slug = "loa" if "Anexos" not in url else "loa_anexos"
        dest = ano_dir / f"{slug}_{ano}.pdf"
        if dest.exists() and not forcar:
            print(f"  {dest.name} já existe, pulando")
            baixados.append(dest)
            continue
        try:
            dest.write_bytes(_get(url, HEADERS, timeout=60))
            size = dest.stat().st_size
            print(f"  {dest.name}: {size:,} bytes")
            baixados.append(dest)
            time.sleep(1)
        except Exception as e:
            print(f"  ERRO {url}: {e}", file=sys.stderr)
    return baixados


def parse_valor(s: str) -> float | None:
    s = re.sub(r"\s", "", s).replace("R$", "").replace(".", "").replace(",", ".")
    try:
        v = float(s)
        return v if v != 0 else None
    except ValueError:
        return None


# Clean BR monetary value: consecutive digits + dots (thousands) + comma + 2 decimals
_CLEAN_VAL = re.compile(r"\d{1,3}(?:\.\d{3})+,\d{2}|\d{4,},\d{2}")

_SKIP_LINES = re.compile(
    r"E\s+S\s+P\s+E|ESPECIFICAÇÃO|^FISCAL$|^SOCIAL$|ADMINISTRAÇÃO\s+DIRETA|"
    r"ADMINISTRAÇÃO\s+INDIRETA|RESERVA\s+DE|Total\s+da\s+Admin|Total\s+do\s+Munic|Fls\.",
    re.I,
)


def _ultimo_valor_limpo(linha: str) -> float | None:
    ms = _CLEAN_VAL.findall(linha)
    return parse_valor(ms[-1]) if ms else None


def extrair_totais(texto: str) -> dict:
    result: dict = {}
    # Lei número e data (year may have internal spaces: "2 021")
    m = re.search(r"LEI\s+N[ºo°\.]\s*([\d.]+)[,\s]+DE\s+(\d+\s+DE\s+\w+\s+DE\s+[\d\s]+)", texto, re.I)
    if m:
        result["lei_numero"] = m.group(1).strip().rstrip(".")
        data = re.sub(r"\s+", " ", m.group(2)).strip()
        data = re.sub(r"(\d)\s+(\d)", r"\1\2", data)  # collapse spaced year
        result["data_lei"] = data

    # Total: Art. 4 inline "em R$X.XXX,XX ("
    m = re.search(r"\bem\s+R\$([\d.]+,\d{2})\s*\(", texto, re.I)
    if m:
        result["total_orcamento"] = parse_valor(m.group(1))

    # Fiscal bullet: "R$ X... do orçamento fiscal"
    m = re.search(r"R\$\s*([\d.]+,\d{2})\s*\([^)]+\)\s*do\s+or[çc]amento\s+fiscal", texto, re.I)
    if m:
        result["total_fiscal"] = parse_valor(m.group(1))

    # Seguridade bullet: "R$ X... do orçamento da seguridade"
    m = re.search(r"R\$\s*([\d.]+,\d{2})\s*\([^)]+\)\s*do\s+or[çc]amento\s+da\s+seguridade", texto, re.I)
    if m:
        result["total_seguridade"] = parse_valor(m.group(1))

    # Fallback total from "Total do Município" row (last clean value)
    if not result.get("total_orcamento"):
        m = re.search(r"Total\s+do\s+Munic[íi]pio(.+)", texto, re.I)
        if m:
            result["total_orcamento"] = _ultimo_valor_limpo(m.group(1))

    # Fallback total = sum
    if not result.get("total_orcamento") and result.get("total_fiscal") and result.get("total_seguridade"):
        result["total_orcamento"] = (result["total_fiscal"] or 0) + (result["total_seguridade"] or 0)
    return result


def _juntar_linhas_orgaos(bloco: str) -> list[str]:
    """Join 2-line organ names (first line: no number; second line: has clean value)."""
    lines = [l.strip() for l in bloco.split("\n") if l.strip()]
    result: list[str] = []
    i = 0
    while i < len(lines):
        if (i + 1 < len(lines)
                and not _CLEAN_VAL.search(lines[i])
                and _CLEAN_VAL.search(lines[i + 1])):
            result.append(lines[i] + " " + lines[i + 1])
            i += 2
        else:
            result.append(lines[i])
            i += 1
    return result


def extrair_orgaos(texto: str, ano: int) -> list[dict]:
    rows = []
    sec = re.search(
        r"(?:II\s*[-–]\s*)?por\s+[oó]rg[aã]os\s+de\s+governo[:\s]*\n(.*?)(?:III\s*[-–]|\Z)",
        texto, re.I | re.DOTALL,
    )
    if not sec:
        return rows

    for linha in _juntar_linhas_orgaos(sec.group(1)):
        if _SKIP_LINES.search(linha):
            continue
        total = _ultimo_valor_limpo(linha)
        if not total or total < 100_000:
            continue
        # Name: split at first whitespace followed by a digit
        sem_cod = re.sub(r"^\d{2}-?\s*", "", linha)
        partes = re.split(r"\s+(?=\d)", sem_cod, maxsplit=1)
        nome = partes[0].strip()
        if len(nome) < 3:
            continue
        rows.append({
            "ano": ano, "municipio": "sorocaba", "tipo": "orgao",
            "especificacao": nome, "fiscal": None, "seguridade": None,
            "total": total, "fonte": "LAI Sorocaba",
        })
    return rows


def extrair_funcoes(texto: str, ano: int) -> list[dict]:
    rows = []
    sec = re.search(
        r"(?:III\s*[-–]\s*)?por\s+fun[çc][oõ]es[:\s]*\n(.*?)(?:\nCAP[ÍI]TULO|\nArt\.\s*\d|\nFls\.|\Z)",
        texto, re.I | re.DOTALL,
    )
    if not sec:
        return rows

    for linha in sec.group(1).split("\n"):
        linha = linha.strip()
        if not linha or _SKIP_LINES.search(linha):
            continue
        m_cod = re.match(r"^(\d{2})\s*[-–]\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+?)(?:\s{2,}|\s+\d)", linha)
        if not m_cod:
            continue
        cod = m_cod.group(1)
        nome = m_cod.group(2).strip()
        total = _ultimo_valor_limpo(linha)
        if not total or total < 10_000:
            continue
        rows.append({
            "ano": ano, "municipio": "sorocaba", "tipo": "funcao",
            "codigo": cod, "especificacao": nome,
            "fiscal": None, "seguridade": None, "total": total,
            "fonte": "LAI Sorocaba",
        })
    return rows


def extrair_pdf(pdf_path: Path, ano: int) -> list[dict]:
    if pdfplumber is None:
        print("  pdfplumber não instalado, pulando extração", file=sys.stderr)
        return []

    rows: list[dict] = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_chars = 0
            full_text = ""
            for p in pdf.pages[:20]:
                t = p.extract_text() or ""
                full_text += "\n" + t
                total_chars += len(t)

            if total_chars < 500:
                print(f"  PDF escaneado ou vazio ({total_chars} chars) — sem extração")
                return []

            totais = extrair_totais(full_text)
            if totais.get("total_orcamento"):
                rows.append({
                    "ano": ano,
                    "municipio": "sorocaba",
                    "tipo": "resumo",
                    "especificacao": "Total LOA",
                    "fiscal": totais.get("total_fiscal"),
                    "seguridade": totais.get("total_seguridade"),
                    "total": totais.get("total_orcamento"),
                    "lei_numero": totais.get("lei_numero", ""),
                    "data_lei": totais.get("data_lei", ""),
                    "fonte": "LAI Sorocaba",
                })

            rows += extrair_orgaos(full_text, ano)
            rows += extrair_funcoes(full_text, ano)
            print(f"  {pdf_path.name}: {total_chars} chars → {len(rows)} registros")
    except Exception as e:
        print(f"  ERRO ao ler {pdf_path}: {e}", file=sys.stderr)
    return rows


def salvar_csv(rows: list[dict], dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        return
    campos = ["ano", "municipio", "tipo", "codigo", "especificacao",
              "fiscal", "seguridade", "total", "lei_numero", "data_lei", "fonte"]
    with dest.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"  Salvo: {dest} ({len(rows)} linhas)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--anos", nargs="+", type=int, default=list(range(2020, 2027)))
    parser.add_argument("--forcar", action="store_true")
    parser.add_argument("--so-baixar", action="store_true")
    parser.add_argument("--so-extrair", action="store_true")
    args = parser.parse_args()

    todos_rows: list[dict] = []

    for ano in args.anos:
        print(f"\n=== LOA {ano} ===")

        if not args.so_extrair:
            pdfs = baixar(ano, forcar=args.forcar)
        else:
            pdfs = sorted((RAW_DIR / str(ano)).glob("*.pdf")) if (RAW_DIR / str(ano)).exists() else []

        if args.so_baixar:
            continue

        rows_ano: list[dict] = []
        for pdf_path in pdfs:
            rows_ano += extrair_pdf(pdf_path, ano)

        # Also check Câmara PDFs for 2025/2026
        if not rows_ano and ano in (2025, 2026):
            camara_dir = ROOT / "data" / "raw" / "sorocaba" / "camara" / "planejamento_municipal" / "loa" / str(ano)
            if camara_dir.exists():
                for pdf_path in sorted(camara_dir.glob("loa_lei-e-anexos*")):
                    rows_ano += extrair_pdf(pdf_path, ano)
                    if rows_ano:
                        break

        if rows_ano:
            dest_ext = EXTRACTED_DIR / f"loa_sorocaba_{ano}.csv"
            dest_pub = PUBLIC_DIR / f"loa_sorocaba_{ano}.csv"
            salvar_csv(rows_ano, dest_ext)
            salvar_csv(rows_ano, dest_pub)
            todos_rows += rows_ano

    print(f"\nTotal: {len(todos_rows)} registros em {len(set(r['ano'] for r in todos_rows))} anos")


if __name__ == "__main__":
    main()
