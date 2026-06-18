"""
Scraper de votações nominais — Câmara Municipal de Sorocaba.

Sistema: CâmaraSemPapel (ASTEN Tecnologia) — ASP.NET WebForms com ViewState.
Portal:  https://camarasempapel.camarasorocaba.sp.gov.br/publico/sessao/index

Coleta:
  - Sessões plenárias (ordinárias, extraordinárias, solenes) por ano
  - Para cada sessão: matérias votadas e resultado nominal por vereador
  - Informações de cada PL: número, ementa, tipo, resultado final

Arquitetura:
  - Listagem de sessões: POST /publico/sessao/BuscarSessoes com ViewState
  - Pauta de cada sessão: GET /publico/sessao/VerPauta/{id}
  - Votação nominal: GET /publico/sessao/VerVotacao/{id_votacao}
  - Rate limit: 1 req/s mínimo entre requisições

Pré-requisitos:
    .venv/bin/pip install playwright beautifulsoup4 lxml
    .venv/bin/playwright install chromium

Uso:
    .venv/bin/python3 pipelines/baixar_camara_votacoes_sorocaba.py
    .venv/bin/python3 pipelines/baixar_camara_votacoes_sorocaba.py --anos 2024 2025
    .venv/bin/python3 pipelines/baixar_camara_votacoes_sorocaba.py --anos 2024 --apenas-listar
    .venv/bin/python3 pipelines/baixar_camara_votacoes_sorocaba.py --debug

Saída:
    data/public/sorocaba/camara/saida/camara_votacoes_sorocaba_{ano}.csv

Schema CSV:
    ano, data_sessao, numero_sessao, tipo_sessao,
    numero_pl, tipo_pl, ementa,
    resultado_geral, vereador, partido, voto
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
    PLAYWRIGHT_OK = True
except ImportError:
    PLAYWRIGHT_OK = False

try:
    from bs4 import BeautifulSoup
    BS4_OK = True
except ImportError:
    BS4_OK = False

BASE_URL   = "https://camarasempapel.camarasorocaba.sp.gov.br"
SESSOES_URL = f"{BASE_URL}/publico/sessao/index"
PUBLIC_DIR = ROOT / "data/public/sorocaba/camara/saida"
RAW_DIR    = ROOT / "data/raw/sorocaba/camara/votacoes"

ANOS_PADRAO = list(range(2020, 2027))

FIELDNAMES = [
    "ano", "data_sessao", "numero_sessao", "tipo_sessao",
    "numero_pl", "tipo_pl", "ementa",
    "resultado_geral", "vereador", "partido", "voto",
]


def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def _parse_sessoes_html(html: str) -> list[dict]:
    """Parse session list HTML → list of {id, data, numero, tipo}."""
    if not BS4_OK:
        return []
    soup = BeautifulSoup(html, "html.parser")
    sessoes = []

    # CâmaraSemPapel renders a <table> or <ul> with session entries
    for row in soup.select("table tbody tr, .sessao-item, .list-group-item"):
        cells = [_clean(td.get_text()) for td in row.find_all(["td", "span", "div"])]
        link  = row.find("a", href=re.compile(r"/publico/sessao/"))
        if not link:
            continue
        href   = link["href"]
        sid_m  = re.search(r"/(\d+)$", href)
        if not sid_m:
            continue
        sid = sid_m.group(1)

        # Extract date, number, type from cells (order varies by layout)
        data   = next((c for c in cells if re.match(r"\d{2}/\d{2}/\d{4}", c)), "")
        numero = next((c for c in cells if re.match(r"\d+ª?", c) and "sessão" not in c.lower()), "")
        tipo   = next((c for c in cells if any(t in c.lower() for t in ("ordinária","extraordinária","solene","especial"))), "")

        sessoes.append({"id": sid, "data": data, "numero": numero, "tipo": tipo})

    return sessoes


def _parse_pauta_html(html: str) -> list[dict]:
    """Parse session agenda HTML → list of {id_votacao, numero_pl, tipo_pl, ementa}."""
    if not BS4_OK:
        return []
    soup = BeautifulSoup(html, "html.parser")
    materias = []

    for row in soup.select("table tbody tr, .materia-item"):
        cells = [_clean(td.get_text()) for td in row.find_all(["td", "span"])]
        link  = row.find("a", href=re.compile(r"/publico/sessao/VerVotacao"))
        vid   = None
        if link:
            m = re.search(r"/(\d+)$", link["href"])
            if m:
                vid = m.group(1)

        numero = next((c for c in cells if re.match(r"(PL|PDL|REQ|IND|MOC|PPL)\s*\d+", c, re.I)), "")
        tipo   = ""
        if numero:
            tipo = re.match(r"[A-Z]+", numero, re.I).group(0).upper()

        ementa = ""
        for c in cells:
            if len(c) > 20 and c != numero:
                ementa = c[:300]
                break

        if numero or vid:
            materias.append({
                "id_votacao": vid,
                "numero_pl":  numero,
                "tipo_pl":    tipo,
                "ementa":     ementa,
            })

    return materias


def _parse_votacao_html(html: str) -> tuple[str, list[dict]]:
    """
    Parse nominal roll-call HTML.
    Returns (resultado_geral, [{vereador, partido, voto}])
    """
    if not BS4_OK:
        return ("", [])
    soup = BeautifulSoup(html, "html.parser")

    # Resultado geral (Aprovado / Rejeitado / Retirado de Pauta / etc.)
    resultado_tag = soup.find(string=re.compile(r"Aprovad|Rejeitad|Retirad|Arquivad", re.I))
    resultado = _clean(resultado_tag.strip() if resultado_tag else "")

    votos = []
    for row in soup.select("table tbody tr, .voto-item"):
        cells = [_clean(td.get_text()) for td in row.find_all(["td", "span"])]
        if len(cells) < 2:
            continue
        vereador = cells[0] if cells else ""
        partido  = next((c for c in cells if re.match(r"[A-Z]{2,10}$", c)), "")
        voto_val = ""
        for c in cells:
            cl = c.lower()
            if cl in ("sim", "não", "nao", "abstenção", "abstencao", "ausente",
                      "yes", "no", "favor", "contra"):
                voto_val = c
                break

        if vereador:
            votos.append({"vereador": vereador, "partido": partido, "voto": voto_val})

    return resultado, votos


def coletar_ano(ano: int, page: object, apenas_listar: bool, debug: bool) -> list[dict]:
    """Collect all roll-call votes for a given year. Returns list of CSV row dicts."""
    rows: list[dict] = []

    print(f"  Buscando sessões de {ano} …")
    try:
        page.goto(SESSOES_URL, wait_until="networkidle", timeout=30_000)
        time.sleep(1)

        # Fill year filter if present
        try:
            year_input = page.locator("input[name*='ano'], select[name*='ano']").first
            year_input.fill(str(ano))
            page.keyboard.press("Enter")
            time.sleep(1.5)
        except Exception:
            pass

        html = page.content()
        sessoes = _parse_sessoes_html(html)

        if debug:
            print(f"    {len(sessoes)} sessão(ões) encontrada(s) para {ano}")

        if apenas_listar:
            for s in sessoes:
                print(f"    [{s['data']}] sessão {s['numero']} — {s['tipo']} (id={s['id']})")
            return rows

        for s in sessoes:
            sid = s["id"]
            pauta_url = f"{BASE_URL}/publico/sessao/VerPauta/{sid}"
            try:
                page.goto(pauta_url, wait_until="networkidle", timeout=20_000)
                time.sleep(1)
                materias = _parse_pauta_html(page.content())
            except PlaywrightTimeout:
                print(f"    TIMEOUT: pauta sessão {sid}", file=sys.stderr)
                materias = []

            for mat in materias:
                vid = mat.get("id_votacao")
                resultado = ""
                votos: list[dict] = []

                if vid:
                    try:
                        page.goto(
                            f"{BASE_URL}/publico/sessao/VerVotacao/{vid}",
                            wait_until="networkidle", timeout=20_000,
                        )
                        time.sleep(1)
                        resultado, votos = _parse_votacao_html(page.content())
                    except PlaywrightTimeout:
                        print(f"      TIMEOUT: votação {vid}", file=sys.stderr)

                if votos:
                    for v in votos:
                        rows.append({
                            "ano":             ano,
                            "data_sessao":     s["data"],
                            "numero_sessao":   s["numero"],
                            "tipo_sessao":     s["tipo"],
                            "numero_pl":       mat["numero_pl"],
                            "tipo_pl":         mat["tipo_pl"],
                            "ementa":          mat["ementa"],
                            "resultado_geral": resultado,
                            "vereador":        v["vereador"],
                            "partido":         v["partido"],
                            "voto":            v["voto"],
                        })
                elif mat.get("numero_pl"):
                    # Record the materia even without individual votes
                    rows.append({
                        "ano":             ano,
                        "data_sessao":     s["data"],
                        "numero_sessao":   s["numero"],
                        "tipo_sessao":     s["tipo"],
                        "numero_pl":       mat["numero_pl"],
                        "tipo_pl":         mat["tipo_pl"],
                        "ementa":          mat["ementa"],
                        "resultado_geral": resultado,
                        "vereador":        "",
                        "partido":         "",
                        "voto":            "",
                    })

            time.sleep(0.8)

    except Exception as exc:
        print(f"  ERRO [{ano}]: {exc}", file=sys.stderr)

    return rows


def salvar_csv(rows: list[dict], ano: int) -> Path:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    dest = PUBLIC_DIR / f"camara_votacoes_sorocaba_{ano}.csv"
    with dest.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"  Salvo: {dest.name} ({len(rows)} linhas)")
    return dest


def main() -> int:
    parser = argparse.ArgumentParser(description="Scraper votações Câmara Sorocaba")
    parser.add_argument("--anos", nargs="+", type=int, default=ANOS_PADRAO)
    parser.add_argument("--apenas-listar", action="store_true")
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    if not PLAYWRIGHT_OK:
        print("ERRO: Playwright não instalado.")
        print("  .venv/bin/pip install playwright")
        print("  .venv/bin/playwright install chromium")
        return 1
    if not BS4_OK:
        print("ERRO: beautifulsoup4 não instalado.")
        print("  .venv/bin/pip install beautifulsoup4 lxml")
        return 1

    total = 0
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="pt-BR",
        )
        page = context.new_page()

        for ano in sorted(args.anos):
            print(f"\n── {ano} ──────────────────────────────")
            rows = coletar_ano(ano, page, args.apenas_listar, args.debug)
            if not args.apenas_listar:
                if rows:
                    salvar_csv(rows, ano)
                    total += len(rows)
                else:
                    print(f"  AVISO: nenhuma votação coletada para {ano}")
                    print(f"  Inspecionar: {SESSOES_URL}")

        context.close()
        browser.close()

    print(f"\nTotal: {total} registros coletados")
    if total == 0 and not args.apenas_listar:
        print("\nPossíveis causas:")
        print("  1. Portal CâmaraSemPapel mudou layout — inspecionar network tab")
        print("  2. Sessões de votação nominal não disponíveis no portal público")
        print(f"  3. Verificar URL: {SESSOES_URL}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
