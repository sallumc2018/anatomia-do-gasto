"""Descobre todas as categorias raiz do portal da Câmara via Playwright."""
import sys, io, json
from pathlib import Path

if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("ERRO: playwright nao instalado.")

BASE_URL = "http://www.camarasorocaba.sp.gov.br"
PORTAL_URL = f"{BASE_URL}/arquivos_publicos.html"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(PORTAL_URL, timeout=30000, wait_until="networkidle")
        page.wait_for_timeout(3000)
        # Tenta esperar por algum link de categoria aparecer
        try:
            page.wait_for_selector("a[href*='arquivos_publicos']", timeout=10000)
        except Exception:
            pass
        # Dump HTML para debug
        html = page.content()
        print(f"HTML length: {len(html)} chars")
        print("Sample:", html[:500])
        # Coleta todos os links que apontam para categorias
        links = page.eval_on_selector_all(
            "a[href*='arquivos_publicos.html?id=']",
            "els => els.map(e => ({texto: e.innerText.trim(), href: e.href}))"
        )
        browser.close()

    print(f"Total de categorias encontradas: {len(links)}")
    for lnk in links:
        print(f"  {lnk['texto']!r:50s} -> {lnk['href']}")

    out = Path(__file__).parents[1] / "data" / "raw" / "sorocaba" / "camara" / "categorias_portal.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(links, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSalvo em: {out}")

if __name__ == "__main__":
    main()
