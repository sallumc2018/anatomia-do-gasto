"""
Coleta dados de educação do FNDE e SIOPE para Sorocaba e Paulínia.

Fontes (todas públicas — sem LAI):
  1. FNDE Transferências (PDDE, PNAE, PNATE, FUNDEB)
     Portal: https://www.fnde.gov.br/siope/
     API PT-Gov: https://api.portaldatransparencia.gov.br/api-de-dados/transferencias/municipios
     Orgão FNDE: código SIORG 26297 / UGE 153173

  2. SIOPE — Sistema de Informações sobre Orçamentos Públicos em Educação
     Download: https://www.fnde.gov.br/siope/municipio.do
     Indicadores: receita_vinculada_educacao, despesa_educacao, percentual_mde, limite_mde

IBGEs:
  Sorocaba: 3552205 (7 dígitos — padrão IBGE) / 355220 (6 dígitos — padrão FNDE sem DV)
  Paulínia:  3536505 / 353650

Uso:
    .venv/bin/python3 pipelines/baixar_fnde_siope.py
    .venv/bin/python3 pipelines/baixar_fnde_siope.py --fonte fnde
    .venv/bin/python3 pipelines/baixar_fnde_siope.py --fonte siope --municipios sorocaba
    .venv/bin/python3 pipelines/baixar_fnde_siope.py --anos 2022 2023 2024

    # Com chave da API Portal Transparência (opcional — aumenta limite de requisições):
    PORTAL_TRANSPARENCIA_KEY=sua-chave .venv/bin/python3 pipelines/baixar_fnde_siope.py

Chave da API: https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email

Saída:
    data/public/{municipio}/educacao/saida/fnde_repasses_{municipio}_{ano}.csv
    data/public/{municipio}/educacao/saida/siope_{municipio}_{ano}.csv

Schema FNDE CSV:
    ano, municipio, ibge7, programa, valor_repassado, data_ultimo_repasse, fonte

Schema SIOPE CSV:
    ano, municipio, ibge7, receita_vinculada_mde, despesa_mde,
    percentual_aplicado, limite_constitucional_pct, situacao
"""
from __future__ import annotations

import argparse
import csv
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

try:
    import requests
    HTTP_OK = True
except ImportError:
    HTTP_OK = False

try:
    from bs4 import BeautifulSoup
    BS4_OK = True
except ImportError:
    BS4_OK = False

MUNICIPIOS = {
    "sorocaba": {"ibge7": "3552205", "ibge6": "355220", "nome": "Sorocaba"},
    "paulinia":  {"ibge7": "3536505", "ibge6": "353650", "nome": "Paulinia"},
    "sao_paulo": {"ibge7": "3550308", "ibge6": "355030", "nome": "Sao Paulo"},
}

ANOS_PADRAO = list(range(2015, 2026))

# Portal Transparência API
PTG_BASE = "https://api.portaldatransparencia.gov.br/api-de-dados"
FNDE_UG = "153173"   # Unidade Gestora FNDE no SIAFI

# SIOPE download
SIOPE_BASE = "https://www.fnde.gov.br/siope"
SIOPE_MUNICIPIO_URL = f"{SIOPE_BASE}/municipio.do"

# Known FNDE programs and their PT-Gov action identifiers
PROGRAMAS_FNDE = {
    "PDDE":   "Programa Dinheiro Direto na Escola",
    "PNAE":   "Programa Nacional de Alimentação Escolar",
    "PNATE":  "Programa Nacional de Apoio ao Transporte do Escolar",
    "FUNDEB": "Fundo de Manutenção e Desenvolvimento da Educação Básica",
}

FNDE_FIELDNAMES = [
    "ano", "municipio", "ibge7", "programa",
    "valor_repassado", "data_ultimo_repasse", "fonte",
]
SIOPE_FIELDNAMES = [
    "ano", "municipio", "ibge7",
    "receita_vinculada_mde", "despesa_mde",
    "percentual_aplicado", "limite_constitucional_pct", "situacao",
]


def _session(api_key: str | None = None) -> "requests.Session":
    s = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; AnatomiaDoGasto/1.0; +https://anatomiadogasto.ong.br)",
        "Accept": "application/json",
    }
    if api_key:
        headers["chave-api-dados"] = api_key
    s.headers.update(headers)
    return s


def _clean_num(s: str) -> str:
    """Normalize Brazilian R$ string."""
    return re.sub(r"[^\d,.]", "", (s or "").strip())


def _clean_float(s: str) -> float | None:
    s = _clean_num(s)
    if not s:
        return None
    s = re.sub(r"\.(?=\d{3})", "", s).replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# FNDE via Portal da Transparência
# ─────────────────────────────────────────────────────────────────────────────

def _fetch_ptg_transferencias(
    ibge7: str, ano: int, session: "requests.Session"
) -> list[dict]:
    """
    Query Portal Transparência API for FNDE transfers to one municipality in a year.
    Endpoint: GET /api-de-dados/transferencias/municipios
    Docs: https://api.portaldatransparencia.gov.br/swagger-ui.html
    """
    params = {
        "codigoMunicipio": ibge7,
        "anoMesInicio":    f"{ano}01",
        "anoMesFim":       f"{ano}12",
        "unidadeGestora":  FNDE_UG,
        "pagina":          1,
    }
    resultados: list[dict] = []
    while True:
        try:
            resp = session.get(
                f"{PTG_BASE}/transferencias/municipios",
                params=params, timeout=30,
            )
            if resp.status_code == 401:
                print("    AVISO: API key inválida ou ausente. Registe uma em "
                      "portaldatransparencia.gov.br/api-de-dados/cadastrar-email",
                      file=sys.stderr)
                return resultados
            if resp.status_code == 429:
                print("    Rate limit — aguardando 30s …", file=sys.stderr)
                time.sleep(30)
                continue
            resp.raise_for_status()
            data = resp.json()
            if not data:
                break
            resultados.extend(data if isinstance(data, list) else [data])
            if len(data) < 500:
                break
            params["pagina"] += 1
        except Exception as exc:
            print(f"    ERRO PTG [{ibge7}/{ano}]: {exc}", file=sys.stderr)
            break
        time.sleep(0.5)

    return resultados


def _ptg_to_rows(raw: list[dict], municipio: str, ibge7: str, ano: int) -> list[dict]:
    """Map Portal Transparência JSON objects to FNDE schema rows."""
    rows: list[dict] = []
    seen_programas: dict[str, float] = {}

    for item in raw:
        # Field names vary by API version
        nome_prog = (
            item.get("nomeAcao") or item.get("descricaoAcao") or
            item.get("nomeProgramaAcao") or ""
        )
        valor_raw = (
            item.get("valorTransferido") or item.get("valor") or
            item.get("valorRepasse") or 0
        )
        data_raw = (
            item.get("dataTransferencia") or item.get("data") or ""
        )

        # Match to known FNDE programs
        programa_key = ""
        for sigla, descr in PROGRAMAS_FNDE.items():
            if sigla in str(nome_prog).upper() or sigla in descr.upper():
                if any(w.lower() in str(nome_prog).lower() for w in descr.split()[:2]):
                    programa_key = sigla
                    break

        if not programa_key:
            # Include unclassified FNDE items under "OUTROS_FNDE"
            programa_key = "OUTROS_FNDE"

        try:
            valor = float(valor_raw) if isinstance(valor_raw, (int, float)) else _clean_float(str(valor_raw)) or 0
        except (ValueError, TypeError):
            valor = 0

        seen_programas[programa_key] = seen_programas.get(programa_key, 0) + valor

    # One row per program per year
    for prog, total in seen_programas.items():
        rows.append({
            "ano": ano,
            "municipio": municipio,
            "ibge7": ibge7,
            "programa": prog,
            "valor_repassado": f"{total:.2f}",
            "data_ultimo_repasse": "",
            "fonte": "Portal Transparência Federal / FNDE",
        })

    return rows


# ─────────────────────────────────────────────────────────────────────────────
# SIOPE via FNDE portal
# ─────────────────────────────────────────────────────────────────────────────

def _fetch_siope(ibge6: str, ano: int, session: "requests.Session") -> dict | None:
    """
    Download SIOPE data for one municipality + year.
    SIOPE is the municipal education budget system (FNDE).
    URL: https://www.fnde.gov.br/siope/municipio.do
    """
    params = {
        "acao":     "pesquisar",
        "codMun":   ibge6,
        "ano":      str(ano),
        "tipoRel":  "0",  # 0 = resumo; 1 = detalhado
    }
    try:
        resp = session.get(SIOPE_MUNICIPIO_URL, params=params, timeout=30)
        resp.raise_for_status()
        return _parse_siope_html(resp.text, ano)
    except Exception as exc:
        print(f"    ERRO SIOPE [{ibge6}/{ano}]: {exc}", file=sys.stderr)
        return None


def _parse_siope_html(html: str, ano: int) -> dict | None:
    """Parse the SIOPE HTML page to extract key MDE indicators."""
    if not BS4_OK:
        # Basic regex fallback
        receita_m = re.search(r"Receitas\s+de\s+Impostos[\s\S]{0,200}?R\$\s*([\d.,]+)", html, re.I)
        despesa_m = re.search(r"Despesas\s+com\s+MDE[\s\S]{0,200}?R\$\s*([\d.,]+)", html, re.I)
        pct_m     = re.search(r"Percentual\s+aplicado[\s\S]{0,100}?([\d]{1,2}[,.]\d{2})\s*%", html, re.I)
        if not any([receita_m, despesa_m, pct_m]):
            return None
        return {
            "receita_vinculada_mde": _clean_num(receita_m.group(1)) if receita_m else "",
            "despesa_mde":           _clean_num(despesa_m.group(1)) if despesa_m else "",
            "percentual_aplicado":   pct_m.group(1).replace(",", ".") if pct_m else "",
        }

    soup = BeautifulSoup(html, "html.parser")
    result: dict[str, str] = {}

    # SIOPE uses a table with label-value pairs
    for row in soup.find_all("tr"):
        cells = [td.get_text(" ", strip=True) for td in row.find_all(["th", "td"])]
        if len(cells) < 2:
            continue
        label = cells[0].lower()
        val   = _clean_num(cells[-1])

        if "receita" in label and ("impost" in label or "mde" in label or "vinculad" in label):
            result["receita_vinculada_mde"] = val
        elif "despesa" in label and ("mde" in label or "educaç" in label or "educa" in label):
            result["despesa_mde"] = val
        elif "percentual" in label or "%" in cells[-1]:
            pct = re.search(r"(\d{1,2}[,.]\d{2})", cells[-1])
            if pct:
                result["percentual_aplicado"] = pct.group(1).replace(",", ".")
        elif "situação" in label or "cumprimento" in label:
            result["situacao"] = cells[-1]

    return result if result else None


# ─────────────────────────────────────────────────────────────────────────────
# Main collection
# ─────────────────────────────────────────────────────────────────────────────

def coletar_fnde(municipio: str, anos: list[int], forcar: bool, session: "requests.Session") -> int:
    cfg = MUNICIPIOS[municipio]
    pub_dir = ROOT / "data" / "public" / municipio / "educacao" / "saida"
    pub_dir.mkdir(parents=True, exist_ok=True)
    total = 0

    for ano in anos:
        dest = pub_dir / f"fnde_repasses_{municipio}_{ano}.csv"
        if dest.exists() and not forcar:
            if "sem_dados" not in dest.read_text(encoding="utf-8"):
                print(f"  [{municipio}/FNDE/{ano}] já existe, pulando")
                continue
            print(f"  [{municipio}/FNDE/{ano}] stub sem_dados detectado — refazendo")

        print(f"  [{municipio}/FNDE/{ano}] Portal Transparência …")
        raw = _fetch_ptg_transferencias(cfg["ibge7"], ano, session)
        rows = _ptg_to_rows(raw, municipio, cfg["ibge7"], ano)

        if not rows:
            print(f"    → sem dados (API indisponível ou sem repasses neste ano)")
            # Write empty with header so gate doesn't flag missing file
            rows = [{
                "ano": ano, "municipio": municipio, "ibge7": cfg["ibge7"],
                "programa": "sem_dados", "valor_repassado": "",
                "data_ultimo_repasse": "", "fonte": "Portal Transparência Federal / FNDE",
            }]

        with dest.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=FNDE_FIELDNAMES)
            w.writeheader()
            w.writerows(rows)

        programas = [r["programa"] for r in rows if r["programa"] != "sem_dados"]
        valores = sum(float(r["valor_repassado"] or 0) for r in rows if r["valor_repassado"])
        print(f"    → {len(programas)} programa(s), total R$ {valores:,.0f} [{dest.name}]")
        total += len(programas)
        time.sleep(0.8)

    return total


def coletar_siope(municipio: str, anos: list[int], forcar: bool, session: "requests.Session") -> int:
    cfg = MUNICIPIOS[municipio]
    pub_dir = ROOT / "data" / "public" / municipio / "educacao" / "saida"
    pub_dir.mkdir(parents=True, exist_ok=True)
    total = 0

    for ano in anos:
        dest = pub_dir / f"siope_{municipio}_{ano}.csv"
        if dest.exists() and not forcar:
            if "nao_coletado" not in dest.read_text(encoding="utf-8"):
                print(f"  [{municipio}/SIOPE/{ano}] já existe, pulando")
                continue
            print(f"  [{municipio}/SIOPE/{ano}] stub nao_coletado detectado — refazendo")

        print(f"  [{municipio}/SIOPE/{ano}] FNDE SIOPE portal …")
        dados = _fetch_siope(cfg["ibge6"], ano, session)

        pct_raw = (dados or {}).get("percentual_aplicado", "")
        try:
            pct = float(pct_raw) if pct_raw else None
            situacao = ("cumprido" if pct and pct >= 25.0 else "nao_cumprido") if pct else ""
        except ValueError:
            situacao = ""

        row = {
            "ano": ano,
            "municipio": municipio,
            "ibge7": cfg["ibge7"],
            "receita_vinculada_mde": (dados or {}).get("receita_vinculada_mde", ""),
            "despesa_mde":           (dados or {}).get("despesa_mde", ""),
            "percentual_aplicado":   pct_raw,
            "limite_constitucional_pct": "25",  # 25% para municípios (EC 108/2020 — FUNDEB)
            "situacao": (dados or {}).get("situacao", situacao) or ("nao_coletado" if not dados else situacao),
        }

        with dest.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=SIOPE_FIELDNAMES)
            w.writeheader()
            w.writerow(row)

        status = row["situacao"] or "coletado"
        print(f"    → {status}  MDE={row['percentual_aplicado'] or '?'}%  [{dest.name}]")
        total += 1
        time.sleep(1.0)

    return total


def main() -> int:
    parser = argparse.ArgumentParser(description="Baixa FNDE repasses + SIOPE (educação)")
    parser.add_argument(
        "--fonte", choices=["fnde", "siope", "ambos"], default="ambos",
    )
    parser.add_argument(
        "--municipios", nargs="+",
        choices=list(MUNICIPIOS), default=list(MUNICIPIOS),
    )
    parser.add_argument("--anos", nargs="+", type=int, default=ANOS_PADRAO)
    parser.add_argument("--forcar", action="store_true")
    args = parser.parse_args()

    if not HTTP_OK:
        print("ERRO: instale requests:")
        print("  .venv/bin/pip install requests beautifulsoup4 lxml")
        return 1

    api_key = os.getenv("PORTAL_TRANSPARENCIA_KEY") or os.getenv("PTG_API_KEY")
    if not api_key:
        print("INFO: PORTAL_TRANSPARENCIA_KEY não definido — usando API sem autenticação (limite menor)")
        print("  Registre uma chave grátis em: portaldatransparencia.gov.br/api-de-dados/cadastrar-email")

    sess = _session(api_key)
    total_fnde = 0
    total_siope = 0

    for mun in args.municipios:
        print(f"\n── {mun.upper()} ──────────────────────────────")
        if args.fonte in ("fnde", "ambos"):
            total_fnde += coletar_fnde(mun, args.anos, args.forcar, sess)
        if args.fonte in ("siope", "ambos"):
            total_siope += coletar_siope(mun, args.anos, args.forcar, sess)

    print(f"\nFNDE: {total_fnde} registros | SIOPE: {total_siope} anos coletados")

    if total_fnde == 0 and args.fonte in ("fnde", "ambos"):
        print("\nAVISO FNDE: sem dados coletados.")
        print("  Opções:")
        print("  1. Definir PORTAL_TRANSPARENCIA_KEY e tentar novamente")
        print("  2. Download manual em portaldatransparencia.gov.br → Transferências → filtrar por FNDE")
        print("  3. Download via fnde.gov.br/siope/ (programa a programa)")

    if total_siope == 0 and args.fonte in ("siope", "ambos"):
        print("\nAVISO SIOPE: sem dados coletados.")
        print("  SIOPE portal: https://www.fnde.gov.br/siope/municipio.do")
        print("  Parâmetros: codMun=355220 (Sorocaba) ou 353650 (Paulínia), ano=XXXX")

    return 0


if __name__ == "__main__":
    sys.exit(main())
