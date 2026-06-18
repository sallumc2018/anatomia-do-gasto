"""
Scraper de votações nominais — Câmara Municipal de Paulínia.

Sistema: Siscam (Câmara Fácil / GOVIX ou similar) — ASP.NET WebForms com ViewState.
Portal:  https://www.paulinia.sp.leg.br (verificar URL atual do portal de votações)

Atenção: O portal Siscam de Paulínia requer inspeção da aba Network para confirmar
endpoints exatos antes da primeira execução. O script inclui descoberta automática
via crawl da página inicial.

Coleta:
  - Sessões plenárias por ano
  - Para cada sessão: matérias votadas + votação nominal por vereador

Pré-requisitos:
    .venv/bin/pip install playwright beautifulsoup4 lxml
    .venv/bin/playwright install chromium

Uso:
    .venv/bin/python3 pipelines/baixar_camara_votacoes_paulinia.py
    .venv/bin/python3 pipelines/baixar_camara_votacoes_paulinia.py --anos 2024 2025
    .venv/bin/python3 pipelines/baixar_camara_votacoes_paulinia.py --descobrir
    .venv/bin/python3 pipelines/baixar_camara_votacoes_paulinia.py --debug

Saída:
    data/public/paulinia/camara/saida/camara_votacoes_paulinia_{ano}.csv

Schema CSV:
    ano, data_sessao, numero_sessao, tipo_sessao,
    numero_pl, tipo_pl, ementa,
    resultado_geral, vereador, partido, voto
"""
from __future__ import annotations

import argparse
import csv
import json
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

# Paulínia Câmara — candidatos de URL (verificar qual está ativo)
PORTAL_CANDIDATES = [
    "https://www.paulinia.sp.leg.br",
    "https://camarapaulinia.sp.gov.br",
    "https://www.camarapaulinia.sp.gov.br",
    "https://paulinia.siscam.com.br",
]
# Caminhos comuns no Siscam para sessões
SISCAM_SESSAO_PATHS = [
    "/sessoes/",
    "/Sessoes/",
    "/publico/sessao/",
    "/transparencia/sessoes/",
    "/plenario/sessoes/",
]

PUBLIC_DIR = ROOT / "data/public/paulinia/camara/saida"
RAW_DIR    = ROOT / "data/raw/paulinia/camara/votacoes"

ANOS_PADRAO = list(range(2020, 2027))

FIELDNAMES = [
    "ano", "data_sessao", "numero_sessao", "tipo_sessao",
    "numero_pl", "tipo_pl", "ementa",
    "resultado_geral", "vereador", "partido", "voto",
]

# Persisted discovery result
DISCOVERY_CACHE = RAW_DIR / "_portal_discovery.json"


def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def descobrir_portal(page: object, debug: bool = False) -> dict | None:
    """
    Probe candidate URLs to find the live Siscam portal for Paulínia.
    Returns {base_url, sessao_url} or None.
    """
    for base in PORTAL_CANDIDATES:
        try:
            resp = page.goto(base, wait_until="domcontentloaded", timeout=15_000)
            if resp and resp.status < 400:
                html = page.content()
                # Look for Siscam signature
                if re.search(r"siscam|câmara fácil|govix|plenario|sessão plenária", html, re.I):
                    print(f"  Portal ativo: {base}")
                    # Try each session path
                    for path in SISCAM_SESSAO_PATHS:
                        url = base.rstrip("/") + path
                        try:
                            r2 = page.goto(url, wait_until="domcontentloaded", timeout=10_000)
                            if r2 and r2.status < 400:
                                print(f"  URL de sessões: {url}")
                                return {"base_url": base, "sessao_url": url}
                        except PlaywrightTimeout:
                            pass
                    # Return base even if session path not found
                    return {"base_url": base, "sessao_url": base}
        except PlaywrightTimeout:
            if debug:
                print(f"  TIMEOUT: {base}")
        except Exception as exc:
            if debug:
                print(f"  ERRO [{base}]: {exc}")
        time.sleep(0.5)

    return None


def _load_discovery() -> dict | None:
    if DISCOVERY_CACHE.exists():
        try:
            return json.loads(DISCOVERY_CACHE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return None


def _save_discovery(info: dict) -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    DISCOVERY_CACHE.write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")


def _parse_sessoes_html(html: str, base_url: str) -> list[dict]:
    if not BS4_OK:
        return []
    soup = BeautifulSoup(html, "html.parser")
    sessoes = []

    for row in soup.select("table tbody tr, .sessao-item, li[data-id], .list-group-item"):
        link  = row.find("a", href=True)
        if not link:
            continue
        href = link["href"]
        if not re.search(r"sessao|sessões|plenario", href, re.I):
            continue

        # Normalize URL
        if href.startswith("http"):
            url = href
        elif href.startswith("/"):
            url = base_url.rstrip("/") + href
        else:
            url = base_url.rstrip("/") + "/" + href

        sid_m = re.search(r"/(\d+)/?$", href)
        sid = sid_m.group(1) if sid_m else href

        cells = [_clean(c.get_text()) for c in row.find_all(["td", "span", "li", "div"])]
        data  = next((c for c in cells if re.match(r"\d{2}/\d{2}/\d{4}", c)), "")
        tipo  = next(
            (c for c in cells if any(t in c.lower() for t in ("ordinária","extraordinária","solene","especial"))),
            "",
        )
        numero = next((c for c in cells if re.match(r"\d+ª?\.?\s*(sessão)?", c, re.I)), "")

        sessoes.append({"id": sid, "url": url, "data": data, "tipo": tipo, "numero": numero})

    return sessoes


def _parse_votacoes_generico(html: str) -> tuple[str, list[dict]]:
    """Generic roll-call parser — works for both CâmaraSemPapel and Siscam layouts."""
    if not BS4_OK:
        return ("", [])
    soup = BeautifulSoup(html, "html.parser")

    resultado_tag = soup.find(string=re.compile(r"Aprovad|Rejeitad|Retirad|Arquivad", re.I))
    resultado = _clean(resultado_tag.strip() if resultado_tag else "")

    votos = []
    for row in soup.select("table tbody tr, .voto-row, .vereador-voto"):
        cells = [_clean(td.get_text()) for td in row.find_all(["td", "span", "div"])]
        if not cells:
            continue
        vereador = cells[0]
        partido  = next((c for c in cells[1:] if re.match(r"[A-Z]{2,12}$", c)), "")
        voto_val = ""
        for c in cells:
            if c.lower() in ("sim","não","nao","abstenção","abstencao","ausente","favor","contra"):
                voto_val = c
                break

        if vereador and len(vereador) > 3:
            votos.append({"vereador": vereador, "partido": partido, "voto": voto_val})

    return resultado, votos


def coletar_ano(
    ano: int, page: object, portal: dict,
    apenas_listar: bool, debug: bool,
) -> list[dict]:
    rows: list[dict] = []
    sessao_url = portal["sessao_url"]
    base_url   = portal["base_url"]

    print(f"  Buscando sessões de {ano} em {sessao_url} …")
    try:
        page.goto(sessao_url, wait_until="networkidle", timeout=30_000)
        time.sleep(1)

        # Try to fill year filter
        for selector in ["input[name*='ano']", "input[placeholder*='ano']", "select[name*='ano']"]:
            try:
                el = page.locator(selector).first
                el.fill(str(ano))
                page.keyboard.press("Enter")
                time.sleep(1.5)
                break
            except Exception:
                pass

        html = page.content()
        sessoes = _parse_sessoes_html(html, base_url)

        if debug:
            print(f"    {len(sessoes)} sessão(ões) encontrada(s)")

        if apenas_listar:
            for s in sessoes:
                print(f"    [{s['data']}] sessão {s['numero']} — {s['tipo']} ({s['url']})")
            return rows

        for s in sessoes:
            # Get session details / agenda
            try:
                page.goto(s["url"], wait_until="networkidle", timeout=20_000)
                time.sleep(1)
                pauta_html = page.content()
            except PlaywrightTimeout:
                print(f"    TIMEOUT: sessão {s['id']}", file=sys.stderr)
                continue

            soup = BeautifulSoup(pauta_html, "html.parser") if BS4_OK else None
            if not soup:
                continue

            # Find voting links (VerVotacao, votar, votacao, resultado)
            vot_links = soup.find_all(
                "a",
                href=re.compile(r"votac|votar|resultado|VerVotacao", re.I),
            )

            if not vot_links:
                # No direct voting links — record session with placeholder
                rows.append({
                    "ano": ano,
                    "data_sessao": s["data"],
                    "numero_sessao": s["numero"],
                    "tipo_sessao": s["tipo"],
                    "numero_pl": "", "tipo_pl": "", "ementa": "",
                    "resultado_geral": "sem_votacao_nominal",
                    "vereador": "", "partido": "", "voto": "",
                })
                continue

            for vlink in vot_links:
                vhref = vlink["href"]
                if vhref.startswith("http"):
                    vurl = vhref
                elif vhref.startswith("/"):
                    vurl = base_url.rstrip("/") + vhref
                else:
                    vurl = base_url.rstrip("/") + "/" + vhref

                # Extract PL info from surrounding context
                parent = vlink.find_parent(["tr", "li", "div"])
                pl_text = _clean(parent.get_text() if parent else vlink.get_text())
                numero_pl = ""
                pl_m = re.search(r"(PL|PDL|REQ|IND|MOC|PPL)\s*[\d./\-]+", pl_text, re.I)
                if pl_m:
                    numero_pl = pl_m.group(0)
                tipo_pl = re.match(r"[A-Z]+", numero_pl, re.I).group(0).upper() if numero_pl else ""
                ementa = pl_text[:300] if len(pl_text) > len(numero_pl) + 5 else ""

                try:
                    page.goto(vurl, wait_until="networkidle", timeout=20_000)
                    time.sleep(1)
                    resultado, votos = _parse_votacoes_generico(page.content())
                except PlaywrightTimeout:
                    resultado, votos = "timeout", []

                if votos:
                    for v in votos:
                        rows.append({
                            "ano": ano,
                            "data_sessao": s["data"],
                            "numero_sessao": s["numero"],
                            "tipo_sessao": s["tipo"],
                            "numero_pl": numero_pl,
                            "tipo_pl": tipo_pl,
                            "ementa": ementa,
                            "resultado_geral": resultado,
                            "vereador": v["vereador"],
                            "partido": v["partido"],
                            "voto": v["voto"],
                        })
                else:
                    rows.append({
                        "ano": ano,
                        "data_sessao": s["data"],
                        "numero_sessao": s["numero"],
                        "tipo_sessao": s["tipo"],
                        "numero_pl": numero_pl,
                        "tipo_pl": tipo_pl,
                        "ementa": ementa,
                        "resultado_geral": resultado,
                        "vereador": "", "partido": "", "voto": "",
                    })

            time.sleep(0.8)

    except Exception as exc:
        print(f"  ERRO [{ano}]: {exc}", file=sys.stderr)

    return rows


def salvar_csv(rows: list[dict], ano: int) -> Path:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    dest = PUBLIC_DIR / f"camara_votacoes_paulinia_{ano}.csv"
    with dest.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"  Salvo: {dest.name} ({len(rows)} linhas)")
    return dest


def main() -> int:
    parser = argparse.ArgumentParser(description="Scraper votações Câmara Paulínia (Siscam)")
    parser.add_argument("--anos", nargs="+", type=int, default=ANOS_PADRAO)
    parser.add_argument("--apenas-listar", action="store_true")
    parser.add_argument("--descobrir", action="store_true",
                        help="Forçar redescoberta do portal (ignora cache)")
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    if not PLAYWRIGHT_OK:
        print("ERRO: Playwright não instalado.")
        print("  .venv/bin/pip install playwright && .venv/bin/playwright install chromium")
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

        # Step 1: discover or load portal info
        portal = None
        if not args.descobrir:
            portal = _load_discovery()
            if portal and args.debug:
                print(f"  Usando portal em cache: {portal}")

        if not portal:
            print("  Descobrindo portal Siscam de Paulínia …")
            portal = descobrir_portal(page, debug=args.debug)
            if portal:
                _save_discovery(portal)
                print(f"  Portal encontrado e salvo em cache: {DISCOVERY_CACHE.name}")
            else:
                print("ERRO: Portal de Paulínia não encontrado nos candidatos:", file=sys.stderr)
                for c in PORTAL_CANDIDATES:
                    print(f"  {c}", file=sys.stderr)
                print("\nVerifique manualmente e atualize PORTAL_CANDIDATES no script.", file=sys.stderr)
                context.close()
                browser.close()
                return 1

        print(f"\nPortal: {portal['sessao_url']}")

        # Step 2: scrape by year
        for ano in sorted(args.anos):
            print(f"\n── {ano} ──────────────────────────────")
            rows = coletar_ano(ano, page, portal, args.apenas_listar, args.debug)
            if not args.apenas_listar:
                if rows:
                    salvar_csv(rows, ano)
                    total += len(rows)
                else:
                    print(f"  AVISO: nenhuma votação coletada para {ano}")

        context.close()
        browser.close()

    print(f"\nTotal: {total} registros coletados")
    if total == 0 and not args.apenas_listar:
        print("\nDicas:")
        print("  1. Rodar com --descobrir para redescobrir o portal")
        print("  2. Rodar com --apenas-listar para verificar as sessões disponíveis")
        print("  3. Inspecionar a aba Network no browser para confirmar endpoints")
    return 0


if __name__ == "__main__":
    sys.exit(main())
