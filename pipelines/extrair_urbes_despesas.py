"""
Extrai Relações Mensais de Despesas da Urbes (Lei 8890) dos PDFs baixados.

Entrada : data/raw/sorocaba/transporte/urbes/transparencia/despesas/relacao_mensal_despesas/*.pdf
Saída   : data/public/sorocaba/transporte/urbes/saida/urbes_despesas_mensais_sorocaba.csv

Uso:
    python pipelines/extrair_urbes_despesas.py
    python pipelines/extrair_urbes_despesas.py --validar
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

import pdfplumber

sys.path.insert(0, str(Path(__file__).parent))
from paths import ROOT

RAW_DIR = ROOT / "data/raw/sorocaba/transporte/urbes/transparencia/despesas/relacao_mensal_despesas"
OUT_DIR = ROOT / "data/public/sorocaba/transporte/urbes/saida"
OUT_FILE = OUT_DIR / "urbes_despesas_mensais_sorocaba.csv"

MESES = ["jan", "fev", "mar", "abr", "mai", "jun",
         "jul", "ago", "set", "out", "nov", "dez"]

MES_MAP = {m: i + 1 for i, m in enumerate(MESES)}


_BR_NUM = r"\d{1,3}(?:\.\d{3})*,\d{2}"
# Artefato "D " só é válido se o dígito D não for precedido por outro dígito
_TOTAL_PATTERN = re.compile(
    r"(?:(?<!\d)(\d)\s+)?(" + _BR_NUM + r")\s*$"
)

# Meses por extenso (PDFs 2010-2017) e abreviados (2018+), case-insensitive
_MES_PATTERN = re.compile(
    r"^(jan(?:eiro)?|fev(?:ereiro)?|mar(?:[cç]o)?|abr(?:il)?"
    r"|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?"
    r"|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\b",
    re.IGNORECASE,
)
_RE_RS = re.compile(r"R\$\s*")                  # prefixo moeda (PDFs 2010)
_RE_DART = re.compile(r"(\d)\s+\.(\d{3},\d{2})")  # artefato "D .NNN,NN" (2011-2017)


def _parse_br(s: str) -> float | None:
    """'8.665,25' → 8665.25; '-' ou '' → None"""
    s = s.strip()
    if not s or s == "-":
        return None
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _extrair_total(line: str) -> float | None:
    """Extrai o total mensal (último valor) de uma linha de despesas."""
    line = _RE_RS.sub("", line)               # "R$ 9.223,84" → "9.223,84"
    line = _RE_DART.sub(r"\1.\2", line)       # "1 .477,00" → "1.477,00"
    m = _TOTAL_PATTERN.search(line)
    if not m:
        return None
    prefix, numero = m.group(1), m.group(2)
    if prefix:
        numero = prefix + numero.replace(".", "")  # '1' + '3348,28' → '13348,28'
    return _parse_br(numero)


def extrair_ano_do_pdf(path: Path) -> int | None:
    m = re.search(r"(\d{4})", path.stem)
    return int(m.group(1)) if m else None


def extrair_linhas(path: Path, ano: int) -> list[dict]:
    linhas = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for line in text.splitlines():
                mes_match = _MES_PATTERN.match(line.strip())
                if not mes_match:
                    continue
                # Normaliza para abreviação de 3 letras: 'Janeiro' → 'jan'
                mes_nome = mes_match.group(1).lower()[:3]
                total = _extrair_total(line)
                linhas.append((mes_nome, total, path.name))

    result = []
    for mes_nome, total, origem in linhas:
        mes_num = MES_MAP[mes_nome]
        result.append({
            "municipio": "sorocaba",
            "orgao": "Urbes",
            "ano": ano,
            "mes": mes_num,
            "mes_nome": mes_nome.capitalize(),
            "total_mensal": total,
            "arquivo_origem": origem,
            "fonte": "https://www.urbes.com.br/transparencia",
            "tipo": "relacao_mensal_despesas_lei8890",
        })
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validar", action="store_true",
                        help="Apenas valida os CSVs já gerados")
    parser.parse_args()

    pdfs = sorted(RAW_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"Nenhum PDF em {RAW_DIR}")
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    todas_linhas = []

    for pdf_path in pdfs:
        ano = extrair_ano_do_pdf(pdf_path)
        if not ano:
            print(f"[AVISO] Não foi possível detectar ano em {pdf_path.name}")
            continue
        linhas = extrair_linhas(pdf_path, ano)
        print(f"  {pdf_path.name}: {len(linhas)} meses extraídos")
        todas_linhas.extend(linhas)

    todas_linhas.sort(key=lambda r: (r["ano"], r["mes"]))

    with OUT_FILE.open("w", newline="", encoding="utf-8") as f:
        campos = ["municipio", "orgao", "ano", "mes", "mes_nome",
                  "total_mensal", "arquivo_origem", "fonte", "tipo"]
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(todas_linhas)

    print(f"\nSaída: {OUT_FILE}")
    print(f"Total: {len(todas_linhas)} registros")

    _validar(todas_linhas)


def _validar(linhas: list[dict]) -> None:
    anos = sorted({r["ano"] for r in linhas})
    print(f"\nCobertura: {anos[0]}–{anos[-1]} ({len(anos)} anos)")
    sem_total = [r for r in linhas if r["total_mensal"] is None]
    if sem_total:
        print(f"[AVISO] {len(sem_total)} linhas sem total_mensal:")
        for r in sem_total[:5]:
            print(f"  {r['ano']}/{r['mes_nome']}")
    else:
        print("OK: todos os registros têm total_mensal")

    totais_por_ano = {}
    for r in linhas:
        if r["total_mensal"]:
            totais_por_ano.setdefault(r["ano"], 0)
            totais_por_ano[r["ano"]] += r["total_mensal"]
    print("\nTotal anual (Lei 8890):")
    for ano in sorted(totais_por_ano):
        print(f"  {ano}: R$ {totais_por_ano[ano]:>14,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))


if __name__ == "__main__":
    main()
