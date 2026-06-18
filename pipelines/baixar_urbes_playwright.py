"""
Baixa PDFs da Urbes (Transito e Transporte de Sorocaba) via Playwright.

Documentos disponíveis (mapeados 2026-05-18):
  - Cartas de Governanca: 2018-2025 (uploads/*.pdf)
  - Cartas Anuais de Politicas Publicas e Governanca: 2023-2025
  - Relatorios Anuais Integrados: 2021-2025
  - Contratos Transporte Publico (Concessao): contratos + aditivos
  - Contratos Receitas: 2013-2025 (por ano)
  - Contratos Outros (Caixa Unico): 2022-2025

Uso:
    py -3.14 pipelines\\baixar_urbes_playwright.py
    py -3.14 pipelines\\baixar_urbes_playwright.py --apenas-listar
    py -3.14 pipelines\\baixar_urbes_playwright.py --categoria governanca
    py -3.14 pipelines\\baixar_urbes_playwright.py --categoria contratos_transporte
"""

import argparse
import time
from pathlib import Path

from paths import TRANSPORTE_RAW_DIR

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    import sys
    print("ERRO: Playwright nao instalado. Execute: py -3.14 -m pip install playwright && py -3.14 -m playwright install chromium")
    sys.exit(1)

URBES_RAW_DIR = TRANSPORTE_RAW_DIR / "urbes"
BASE = "https://www.urbes.com.br"

PAGINAS = {
    "governanca":           f"{BASE}/transparencia/index",
    "contratos_transporte": f"{BASE}/transparencia/contratos-transporte",
    "contratos_receitas":   f"{BASE}/transparencia/contratos-receitas",
    "contratos_outros":     f"{BASE}/transparencia/contratos-caixa-unico",
    "licitacoes":           f"{BASE}/licitacoes-contratos-firmados",
}

PREFIXO_SUBDIR = {
    "governanca":           "governanca",
    "contratos_transporte": "contratos_transporte",
    "contratos_receitas":   "contratos_receitas",
    "contratos_outros":     "contratos_outros",
    "licitacoes":           "licitacoes",
}

URLS_IGNORAR = {
    "Cartilha_maternidade", "mapa_zoneamento",
}

EXTS = [".pdf", ".csv", ".xls", ".xlsx", ".zip"]


def _e_ignorar(url: str) -> bool:
    return any(ignorar in url for ignorar in URLS_IGNORAR)


def _slug(texto: str, maxlen: int = 50) -> str:
    import re
    s = re.sub(r"[^a-z0-9]+", "_", texto.lower().strip())
    return s[:maxlen].strip("_")


def listar_arquivos(page, url_pagina: str) -> list[dict]:
    try:
        page.goto(url_pagina, wait_until="networkidle", timeout=40000)
    except PlaywrightTimeout:
        page.goto(url_pagina, wait_until="domcontentloaded", timeout=40000)
    page.wait_for_timeout(2000)

    links = page.evaluate("""
        () => Array.from(document.querySelectorAll('a[href]')).map(a => ({
            href: a.href || '',
            texto: (a.innerText || a.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 100)
        })).filter(l => l.href && !l.href.startsWith('javascript:') && l.texto.length > 1)
    """)

    return [l for l in links
            if any(ext in l["href"].lower() for ext in EXTS)
            and not _e_ignorar(l["href"])]


def validar_pdf(caminho: Path) -> bool:
    with caminho.open("rb") as f:
        return f.read(4) == b"%PDF"


def baixar(page, url: str, destino: Path) -> bool:
    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".part")

    try:
        resp = page.request.get(url, timeout=60_000)
        if resp.status == 200:
            conteudo = resp.body()
            if len(conteudo) > 500:
                parcial.write_bytes(conteudo)
                parcial.replace(destino)
                print(f"  OK: {destino.name} ({destino.stat().st_size // 1024} KB)")
                return True
        print(f"  AVISO: status {resp.status} para {url}")
    except Exception as exc:
        print(f"  ERRO ao baixar {url}: {exc}")
    return False


def main():
    parser = argparse.ArgumentParser(description="Baixa PDFs da Urbes de Sorocaba")
    parser.add_argument("--categoria", choices=sorted(PAGINAS), action="append",
                        help="Categoria (padrao: todas)")
    parser.add_argument("--apenas-listar", action="store_true")
    parser.add_argument("--forcar", action="store_true")
    args = parser.parse_args()

    categorias = args.categoria or sorted(PAGINAS)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900},
            locale="pt-BR",
            ignore_https_errors=True,
        )
        page = ctx.new_page()

        total_baixados = 0
        total_erros = 0

        for cat in categorias:
            url_pagina = PAGINAS[cat]
            subdir = PREFIXO_SUBDIR[cat]
            print(f"\n{'='*60}")
            print(f"Categoria: {cat}")
            print(f"URL: {url_pagina}")

            arquivos = listar_arquivos(page, url_pagina)
            # Remover duplicatas por href
            vistos = set()
            unicos = []
            for a in arquivos:
                if a["href"] not in vistos:
                    vistos.add(a["href"])
                    unicos.append(a)
            arquivos = unicos

            print(f"Arquivos encontrados: {len(arquivos)}")
            for a in arquivos:
                print(f"  [{a['texto'][:60]}] {a['href']}")

            if args.apenas_listar:
                continue

            for a in arquivos:
                href = a["href"]
                texto = a["texto"]
                # Construir nome do arquivo a partir do href (ultimo segmento)
                nome_original = href.rstrip("/").split("/")[-1]
                destino = URBES_RAW_DIR / subdir / nome_original

                if destino.exists() and not args.forcar:
                    if destino.stat().st_size > 10_000:
                        print(f"  Ja existe: {destino.name}")
                        continue

                ok = baixar(page, href, destino)
                if ok:
                    if destino.suffix.lower() == ".pdf" and not validar_pdf(destino):
                        print(f"    AVISO: header PDF invalido")
                        total_erros += 1
                    else:
                        total_baixados += 1
                else:
                    total_erros += 1

                time.sleep(0.5)

        browser.close()

    if not args.apenas_listar:
        print(f"\n{'='*60}")
        print(f"Baixados: {total_baixados} | Erros: {total_erros}")
        print(f"Destino: {URBES_RAW_DIR}")


if __name__ == "__main__":
    main()
