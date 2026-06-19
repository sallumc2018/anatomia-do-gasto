"""
Baixa dados do SIOPS (DATASUS Tabnet) para Sorocaba e Paulínia.

Fonte: DATASUS Tabnet — SIOPS — Recursos Próprios Aplicados em Saúde
URL base: http://tabnet.datasus.gov.br/cgi/tabcgi.exe?siops/tabsiopmun.def

Indicadores coletados (Artigo 198, CF/1988 — regra 15%/15% ASPS):
  - Receita de impostos e transferências vinculadas
  - Despesas com ações e serviços públicos de saúde (ASPS)
  - Percentual aplicado em ASPS
  - Limite constitucional (15% para municípios)

IBGEs:
  - Sorocaba: 355220 (6 dígitos — padrão DATASUS sem o dígito verificador)
  - Paulínia:  353650

Uso:
    .venv/bin/python3 pipelines/baixar_siops_tabnet.py
    .venv/bin/python3 pipelines/baixar_siops_tabnet.py --municipios sorocaba
    .venv/bin/python3 pipelines/baixar_siops_tabnet.py --anos 2022 2023 2024
    .venv/bin/python3 pipelines/baixar_siops_tabnet.py --forcar

Saída:
    data/public/{municipio}/saude/saida/siops_{municipio}_{ano}.csv
    data/public/{municipio}/saude/saida/siops_{municipio}_consolidado.csv

Schema CSV:
    ano, municipio, ibge6, receita_impostos, despesa_saude_total,
    despesa_asps, percentual_asps, limite_constitucional_pct, situacao
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
import time
from pathlib import Path
from typing import NamedTuple

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

try:
    import requests
    import urllib3
    from bs4 import BeautifulSoup
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    HTTP_OK = True
except ImportError:
    HTTP_OK = False

# IBGE 6 dígitos (padrão DATASUS, sem dígito verificador)
MUNICIPIOS_SIOPS: dict[str, dict] = {
    "sorocaba": {"ibge6": "355220", "nome": "Sorocaba"},
    "paulinia":  {"ibge6": "353650", "nome": "Paulinia"},
    "sao_paulo": {"ibge6": "355030", "nome": "Sao Paulo"},
}

ANOS_PADRAO = list(range(2015, 2026))

# DATASUS SIOPS Tabnet
TABNET_URL = "http://tabnet.datasus.gov.br/cgi/tabcgi.exe"
SIOPS_DEF  = "siops/tabsiopmun.def"

FIELDNAMES = [
    "ano", "municipio", "ibge6",
    "receita_impostos",
    "despesa_saude_total",
    "despesa_asps",
    "percentual_asps",
    "limite_constitucional_pct",
    "situacao",
]

class RegistroSiops(NamedTuple):
    ano: int
    municipio: str
    ibge6: str
    receita_impostos: str
    despesa_saude_total: str
    despesa_asps: str
    percentual_asps: str
    limite_constitucional_pct: str
    situacao: str


def _clean_num(s: str) -> str:
    """Normalize Brazilian number string; keep as string to preserve precision."""
    s = s.strip().replace("\xa0", "").replace(" ", "")
    if not s or s in ("-", "...", "X"):
        return ""
    return s


def _fetch_tabnet(ibge6: str, ano: int, session: "requests.Session") -> dict | None:
    """
    Query DATASUS Tabnet for one municipality + year.
    Returns a dict with the SIOPS indicators or None on failure.

    The Tabnet CGI expects a POST with specific form fields that select:
    - Linha (rows): Município
    - Coluna: Indicador
    - Conteúdo: Valor
    - Seleções: UF=SP, Município=ibge6, Ano=ano
    """
    params = {
        "Linha":     "Munic%EDpio",
        "Coluna":    "N%E3o_ativa",
        "Incremento":"Recursos_pr%F3prios_aplicados_em_a%E7%F5es_e_serv%E7os_p%FAblicos_de_sa%FAde_%28ASPS%29_%25",
        "Pesqmes1":  "Digite_o_texto_e_selecione_abaixo",
        "SMunic%EDpio": ibge6,
        "pesqmes2":  "Digite_o_texto_e_selecione_abaixo",
        "SAno":      str(ano),
        "formato":   "table",
        "mostre":    "Mostra",
    }
    try:
        resp = session.post(
            TABNET_URL,
            data={"def": SIOPS_DEF, **params},
            timeout=30,
        )
        resp.raise_for_status()
        return _parse_tabnet_html(resp.text, ibge6, ano)
    except Exception as exc:
        print(f"    AVISO [{ibge6}/{ano}]: {exc}", file=sys.stderr)
        return None


def _parse_tabnet_html(html: str, ibge6: str, ano: int) -> dict | None:
    """Parse the HTML table returned by DATASUS Tabnet."""
    soup = BeautifulSoup(html, "html.parser")
    # Tabnet wraps data in a table with class "tabdados" or id "tabResult"
    table = soup.find("table", {"class": "tabdados"}) or soup.find("table", id="tabResult")
    if not table:
        # Try any table with numeric cells
        tables = soup.find_all("table")
        for t in tables:
            if t.find("td", string=re.compile(r"\d{2,}")):
                table = t
                break

    if not table:
        return None

    rows = table.find_all("tr")
    headers: list[str] = []
    data_rows: list[list[str]] = []

    for tr in rows:
        cells = [td.get_text(" ", strip=True) for td in tr.find_all(["th", "td"])]
        if not cells:
            continue
        if not headers:
            headers = cells
        else:
            data_rows.append(cells)

    if not data_rows:
        return None

    # Find the row matching our municipality (ibge6 code or name)
    target_row = None
    for row in data_rows:
        if row and (ibge6 in row[0] or re.search(ibge6, " ".join(row))):
            target_row = row
            break
    # Fallback: take first non-total row
    if target_row is None and data_rows:
        target_row = data_rows[0]

    if not target_row:
        return None

    # Map columns heuristically
    result: dict[str, str] = {}
    for i, h in enumerate(headers):
        if i >= len(target_row):
            break
        hl = h.lower()
        val = _clean_num(target_row[i])
        if "receita" in hl and "impost" in hl:
            result["receita_impostos"] = val
        elif "despesa" in hl and ("total" in hl or "saúde" in hl or "saude" in hl):
            result["despesa_saude_total"] = val
        elif "asps" in hl or ("ações" in hl and "saúde" in hl):
            result["despesa_asps"] = val
        elif "%" in h or "percentual" in hl or "aplicado" in hl:
            result["percentual_asps"] = val
        elif "limite" in hl:
            result["limite_constitucional_pct"] = val
        elif "situaç" in hl or "cumprimento" in hl:
            result["situacao"] = val

    if not result:
        return None
    return result


def _build_csv_row(
    municipio: str,
    ibge6: str,
    ano: int,
    dados: dict | None,
) -> dict:
    base = {
        "ano": ano,
        "municipio": municipio,
        "ibge6": ibge6,
        "receita_impostos": "",
        "despesa_saude_total": "",
        "despesa_asps": "",
        "percentual_asps": "",
        "limite_constitucional_pct": "15",
        "situacao": "nao_coletado" if dados is None else "",
    }
    if dados:
        base.update(dados)
        if not base["situacao"]:
            pct_raw = base.get("percentual_asps", "")
            try:
                pct = float(pct_raw.replace(",", "."))
                base["situacao"] = "cumprido" if pct >= 15.0 else "nao_cumprido"
            except ValueError:
                base["situacao"] = "coletado"
    return base


def baixar_municipio(
    municipio: str,
    anos: list[int],
    forcar: bool,
    session: "requests.Session",
) -> list[dict]:
    cfg = MUNICIPIOS_SIOPS[municipio]
    ibge6 = cfg["ibge6"]
    pub_dir = ROOT / "data" / "public" / municipio / "saude" / "saida"
    pub_dir.mkdir(parents=True, exist_ok=True)

    todos: list[dict] = []

    for ano in anos:
        dest = pub_dir / f"siops_{municipio}_{ano}.csv"
        if dest.exists() and not forcar:
            print(f"  [{municipio}/{ano}] já existe, pulando (--forcar para reprocessar)")
            # Load existing for consolidado
            with dest.open(encoding="utf-8") as f:
                reader = csv.DictReader(f)
                todos.extend(list(reader))
            continue

        print(f"  [{municipio}/{ano}] consultando DATASUS Tabnet …")
        dados = _fetch_tabnet(ibge6, ano, session)
        row = _build_csv_row(municipio, ibge6, ano, dados)

        with dest.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=FIELDNAMES)
            w.writeheader()
            w.writerow(row)

        status = row["situacao"] or "coletado"
        pct    = row.get("percentual_asps") or "?"
        print(f"    → {status}  ASPS={pct}%  [{dest.name}]")
        todos.append(row)
        time.sleep(1.2)  # polite crawl rate

    # Consolidado
    todos_consolidados = []
    p = re.compile(rf"^siops_{municipio}_(\d{{4}})\.csv$")
    for f in pub_dir.glob(f"siops_{municipio}_*.csv"):
        m = p.match(f.name)
        if m:
            with f.open(encoding="utf-8") as file_handle:
                reader = csv.DictReader(file_handle)
                todos_consolidados.extend(list(reader))

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
    parser = argparse.ArgumentParser(description="Baixa SIOPS do DATASUS Tabnet")
    parser.add_argument(
        "--municipios", nargs="+",
        choices=list(MUNICIPIOS_SIOPS), default=list(MUNICIPIOS_SIOPS),
    )
    parser.add_argument("--anos", nargs="+", type=int, default=ANOS_PADRAO)
    parser.add_argument("--forcar", action="store_true", help="Reprocessar mesmo que arquivo exista")
    args = parser.parse_args()

    if not HTTP_OK:
        print("ERRO: instale dependências:")
        print("  .venv/bin/pip install requests beautifulsoup4 lxml")
        return 1

    session = requests.Session()
    session.verify = False  # CA gov.br não está no store padrão; DATASUS redireciona HTTP→HTTPS
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (compatible; AnatomiaDoGasto/1.0; +https://anatomiadogasto.ong.br)",
    })

    total = 0
    for mun in args.municipios:
        print(f"\n── {mun.upper()} ──────────────────────────────")
        rows = baixar_municipio(mun, args.anos, args.forcar, session)
        coletados = sum(1 for r in rows if r.get("situacao") != "nao_coletado")
        total += coletados
        print(f"  {coletados}/{len(rows)} anos com dados")

    print(f"\nTotal: {total} registros coletados")
    if total == 0:
        print("\nAVISO: Nenhum dado coletado.")
        print("Possíveis causas:")
        print("  1. DATASUS Tabnet instável (tente novamente mais tarde)")
        print("  2. Endpoint ou parâmetros CGI mudaram — inspecionar rede em tabnet.datasus.gov.br")
        print("  3. IBGEs precisam de ajuste (ver MUNICIPIOS_SIOPS no topo do script)")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
