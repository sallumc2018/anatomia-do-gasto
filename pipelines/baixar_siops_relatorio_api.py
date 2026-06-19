"""
Baixa dados do SIOPS via API siops-relatorio-api.saude.gov.br (sem autenticação).

Fonte: siops-relatorio-api.saude.gov.br — endpoint /indicadores/municipal/consultar
Retorna PDF de 8 páginas com indicadores SIOPS por município/ano/bimestre.

O dado extraído é o indicador 3.2 "Participação da receita própria aplicada em Saúde
conforme a EC 29/2000" na Fase - Previsto, que é o proxy do ASPS (EC-29 / Art. 198 CF).

Limite constitucional: 15% para municípios (LC 141/2012, art. 7º).

IBGEs (6 dígitos — padrão DATASUS):
  Sorocaba:  355220
  Paulínia:  353650
  São Paulo: 355030

Uso:
    .venv/bin/python3 pipelines/baixar_siops_relatorio_api.py
    .venv/bin/python3 pipelines/baixar_siops_relatorio_api.py --municipios sorocaba
    .venv/bin/python3 pipelines/baixar_siops_relatorio_api.py --anos 2022 2023 2024
    .venv/bin/python3 pipelines/baixar_siops_relatorio_api.py --forcar

Saída:
    data/public/{municipio}/saude/saida/siops_{municipio}_{ano}.csv
    data/public/{municipio}/saude/saida/siops_{municipio}_consolidado.csv
"""
from __future__ import annotations

import argparse
import csv
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import NamedTuple

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

try:
    import requests
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    HTTP_OK = True
except ImportError:
    HTTP_OK = False

MUNICIPIOS: dict[str, dict] = {
    "sorocaba": {"ibge6": "355220", "nome": "Sorocaba", "uf": "SP"},
    "paulinia":  {"ibge6": "353650", "nome": "Paulinia", "uf": "SP"},
    "sao_paulo": {"ibge6": "355030", "nome": "Sao Paulo", "uf": "SP"},
}

ANOS_PADRAO = list(range(2015, 2026))
BIMESTRE_ANUAL = 6  # 6º bimestre = referência do ano completo

API_BASE = "https://siops-relatorio-api.saude.gov.br"

FIELDNAMES = [
    "ano", "municipio", "ibge6",
    "percentual_asps",       # 3.2 — receita própria em saúde / receita total impostos (%)
    "despesa_saude_total",   # numerador 3.2 (R$)
    "receita_impostos",      # denominador 3.2 (R$)
    "despesa_saude_por_hab", # 2.1 (R$/hab)
    "pct_transferencias_sus",# 3.1 — transferências SUS / despesa saúde (%)
    "limite_constitucional_pct",
    "situacao",
    "fase",
]


class RegistroSiops(NamedTuple):
    ano: int
    municipio: str
    ibge6: str
    percentual_asps: str
    despesa_saude_total: str
    receita_impostos: str
    despesa_saude_por_hab: str
    pct_transferencias_sus: str
    limite_constitucional_pct: str
    situacao: str
    fase: str


def _fetch_pdf(ibge6: str, ano: int, session: "requests.Session") -> bytes | None:
    url = f"{API_BASE}/indicadores/municipal/consultar"
    params = {"coMunicipio": ibge6, "anoBase": ano, "bimestre": BIMESTRE_ANUAL}
    try:
        resp = session.get(url, params=params, timeout=30)
        if resp.status_code == 200 and resp.content[:4] == b"%PDF":
            return resp.content
        print(f"    AVISO [{ibge6}/{ano}]: HTTP {resp.status_code}", file=sys.stderr)
        return None
    except Exception as exc:
        print(f"    ERRO [{ibge6}/{ano}]: {exc}", file=sys.stderr)
        return None


def _extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using pdftotext subprocess."""
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(pdf_bytes)
        tmp_path = f.name
    try:
        result = subprocess.run(
            ["pdftotext", tmp_path, "-"],
            capture_output=True, timeout=15
        )
        return result.stdout.decode("utf-8", errors="replace")
    except Exception:
        return ""
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def _parse_fase_previsto(text: str) -> dict | None:
    """
    Parse the 'Fase - Previsto' section from SIOPS PDF text.

    The PDF has multiple phases (Liquidado, Previsto, Orçado, Empenhado).
    Only 'Previsto' has actual data values (Liquidado shows all 0.00%).
    Returns None if parsing fails.
    """
    # Split by phase headers
    sections = re.split(r"Fase\s+-\s+(\w+)", text)
    # sections = ['pre-content', 'Liquidado', 'liquidado_content', 'Previsto', 'previsto_content', ...]
    previsto_content = None
    for i, s in enumerate(sections):
        if s.strip() == "Previsto" and i + 1 < len(sections):
            previsto_content = sections[i + 1]
            break
    if not previsto_content:
        return None

    result: dict[str, str] = {}

    def _extract_pct_after(label_re: str, content: str) -> str:
        m = re.search(label_re + r"[^%]*?([\d,.]+)\s*%", content, re.IGNORECASE | re.DOTALL)
        return m.group(1).replace(",", ".") if m else ""

    def _extract_numerator_after(label_re: str, content: str) -> str:
        m = re.search(
            label_re + r"[^%]*?[\d,.]+\s*%\s*R\$\s*([\d,. ]+)",
            content, re.IGNORECASE | re.DOTALL
        )
        if m:
            return m.group(1).strip().replace(" ", "").replace(",", "")
        return ""

    def _extract_denominator_after(label_re: str, content: str) -> str:
        m = re.search(
            label_re + r"[^%]*?[\d,.]+\s*%\s*R\$\s*[\d,. ]+\s*R\$\s*([\d,. ]+)",
            content, re.IGNORECASE | re.DOTALL
        )
        if m:
            return m.group(1).strip().replace(" ", "").replace(",", "")
        return ""

    # 3.2 — ASPS percentage (EC 29/2000) — KEY indicator
    label_32 = r"3\.2\s+Participa[çc][aã]o da receita pr[oó]pria aplicada em Sa[uú]de"
    result["percentual_asps"] = _extract_pct_after(label_32, previsto_content)
    result["despesa_saude_total"] = _extract_numerator_after(label_32, previsto_content)
    result["receita_impostos"] = _extract_denominator_after(label_32, previsto_content)

    # 2.1 — Despesa por habitante (R$/hab appears as huge %)
    label_21 = r"2\.1\s+Despesa total com Sa[uú]de"
    # For 2.1, numerator = total health spending, denominator = population
    m21 = re.search(
        label_21 + r".*?(\d[\d,.]+)\s*%\s*R\$\s*([\d,. ]+)\s*R\$\s*([\d,. ]+)",
        previsto_content, re.IGNORECASE | re.DOTALL
    )
    if m21:
        result["despesa_saude_por_hab"] = m21.group(2).strip().replace(" ", "").replace(",", "")

    # 3.1 — Transferências SUS / despesa total saúde
    label_31 = r"3\.1\s+Participa[çc][aã]o das transfer[eê]ncias para a Sa[uú]de"
    result["pct_transferencias_sus"] = _extract_pct_after(label_31, previsto_content)

    if not result.get("percentual_asps"):
        return None
    return result


def _build_row(municipio: str, ibge6: str, ano: int, dados: dict | None) -> dict:
    base = {
        "ano": ano,
        "municipio": municipio,
        "ibge6": ibge6,
        "percentual_asps": "",
        "despesa_saude_total": "",
        "receita_impostos": "",
        "despesa_saude_por_hab": "",
        "pct_transferencias_sus": "",
        "limite_constitucional_pct": "15",
        "situacao": "nao_coletado" if dados is None else "",
        "fase": "previsto" if dados else "",
    }
    if dados:
        base.update({k: v for k, v in dados.items() if k in FIELDNAMES})
        pct_raw = base.get("percentual_asps", "")
        if pct_raw:
            try:
                pct = float(pct_raw)
                base["situacao"] = "cumprido" if pct >= 15.0 else "nao_cumprido"
            except ValueError:
                base["situacao"] = "coletado"
        else:
            base["situacao"] = "coletado_sem_pct"
    return base


def baixar_municipio(
    municipio: str,
    anos: list[int],
    forcar: bool,
    session: "requests.Session",
) -> list[dict]:
    cfg = MUNICIPIOS[municipio]
    ibge6 = cfg["ibge6"]
    pub_dir = ROOT / "data" / "public" / municipio / "saude" / "saida"
    pub_dir.mkdir(parents=True, exist_ok=True)

    todos: list[dict] = []

    for ano in anos:
        dest = pub_dir / f"siops_{municipio}_{ano}.csv"
        if dest.exists() and not forcar:
            print(f"  [{municipio}/{ano}] já existe, pulando (--forcar para reprocessar)")
            with dest.open(encoding="utf-8") as f:
                todos.extend(list(csv.DictReader(f)))
            continue

        print(f"  [{municipio}/{ano}] baixando PDF SIOPS …")
        pdf_bytes = _fetch_pdf(ibge6, ano, session)

        dados: dict | None = None
        if pdf_bytes:
            text = _extract_text_from_pdf(pdf_bytes)
            if text:
                dados = _parse_fase_previsto(text)
            if dados is None:
                print(f"    AVISO [{municipio}/{ano}]: PDF obtido mas parse falhou", file=sys.stderr)

        row = _build_row(municipio, ibge6, ano, dados)

        with dest.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=FIELDNAMES)
            w.writeheader()
            w.writerow(row)

        pct = row.get("percentual_asps") or "?"
        status = row["situacao"]
        print(f"    → {status}  ASPS={pct}%  [{dest.name}]")
        todos.append(row)
        time.sleep(1.0)

    # Consolidado
    p = re.compile(rf"^siops_{municipio}_(\d{{4}})\.csv$")
    todos_consolidados: list[dict] = []
    for f in pub_dir.glob(f"siops_{municipio}_*.csv"):
        if p.match(f.name):
            with f.open(encoding="utf-8") as file_handle:
                todos_consolidados.extend(list(csv.DictReader(file_handle)))

    if todos_consolidados:
        todos_consolidados.sort(key=lambda x: int(x["ano"]))
        cons = pub_dir / f"siops_{municipio}_consolidado.csv"
        with cons.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
            w.writeheader()
            w.writerows(todos_consolidados)
        print(f"  → consolidado: {cons.name} ({len(todos_consolidados)} linhas)")

    return todos_consolidados


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Baixa indicadores SIOPS via siops-relatorio-api.saude.gov.br"
    )
    parser.add_argument(
        "--municipios", nargs="+",
        choices=list(MUNICIPIOS), default=list(MUNICIPIOS),
    )
    parser.add_argument("--anos", nargs="+", type=int, default=ANOS_PADRAO)
    parser.add_argument("--forcar", action="store_true",
                        help="Reprocessar mesmo que arquivo exista")
    args = parser.parse_args()

    if not HTTP_OK:
        print("ERRO: instale dependências: .venv/bin/pip install requests")
        return 1

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (compatible; AnatomiaDoGasto/1.0; +https://anatomiadogasto.ong.br)",
    })

    total = 0
    for mun in args.municipios:
        print(f"\n── {mun.upper()} ──────────────────────────────")
        rows = baixar_municipio(mun, args.anos, args.forcar, session)
        coletados = sum(1 for r in rows if r.get("situacao") not in ("nao_coletado", ""))
        total += coletados
        print(f"  {coletados}/{len(rows)} anos com dados")

    print(f"\nTotal: {total} registros coletados")
    if total == 0:
        print("\nAVISO: Nenhum dado coletado. Verificar conectividade com siops-relatorio-api.saude.gov.br")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
