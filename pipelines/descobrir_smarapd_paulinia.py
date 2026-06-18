"""
Intercepta chamadas de rede do portal SMARAPD de Paulínia para descobrir
os endpoints de API e estrutura de dados disponíveis.

Uso:
    python3 pipelines/descobrir_smarapd_paulinia.py
    python3 pipelines/descobrir_smarapd_paulinia.py --url "https://transparencia-paulinia.smarapd.com.br/#/dinamico/7/Licitacoes"
"""
import argparse
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "raw" / "paulinia" / "smarapd"
OUT_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = "https://transparencia-paulinia.smarapd.com.br"

def interceptar_api(url: str, max_wait: int = 15) -> list[dict]:
    captured = []

    def on_request(request):
        if "json" in request.headers.get("accept", "").lower() or \
           request.resource_type in ("xhr", "fetch"):
            captured.append({
                "url": request.url,
                "method": request.method,
                "headers": dict(request.headers),
                "post_data": request.post_data,
                "resource_type": request.resource_type,
            })

    def on_response(response):
        req_url = response.url
        if req_url.startswith(BASE_URL) and response.status == 200:
            try:
                ct = response.headers.get("content-type", "")
                if "json" in ct:
                    body = response.json()
                    for c in captured:
                        if c["url"] == req_url:
                            c["response_status"] = response.status
                            c["response_sample"] = str(body)[:500]
                            c["content_type"] = ct
            except Exception:
                pass

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        )
        page = ctx.new_page()
        page.on("request", on_request)
        page.on("response", on_response)

        print(f"Navegando para: {url}")
        try:
            page.goto(url, wait_until="networkidle", timeout=max_wait * 1000)
        except Exception as e:
            print(f"Timeout ou erro ao carregar (esperado para SPA): {e}")

        # Scroll para disparar lazy loads
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(3)
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(2)

        browser.close()

    return captured


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=BASE_URL + "/#/")
    parser.add_argument("--pagina", choices=[
        "licitacoes", "orcamento", "receitas", "despesas",
        "empenhos", "contratos", "documentos", "home"
    ], default=None)
    args = parser.parse_args()

    PAGINAS = {
        "licitacoes": f"{BASE_URL}/#/dinamico/7/Licitacoes",
        "orcamento":  f"{BASE_URL}/#/dinamico/1/Orcamento",
        "receitas":   f"{BASE_URL}/#/dinamico/2/Receitas",
        "despesas":   f"{BASE_URL}/#/dinamico/3/Despesas",
        "empenhos":   f"{BASE_URL}/#/dinamico/4/Empenhos",
        "contratos":  f"{BASE_URL}/#/dinamico/5/Contratos",
        "documentos": f"{BASE_URL}/#/dinamico/6/Documentos",
        "home":       f"{BASE_URL}/#/",
    }

    urls_to_check = [args.url]
    if args.pagina:
        urls_to_check = [PAGINAS.get(args.pagina, args.url)]
    elif args.url == BASE_URL + "/#/":
        # Check all known pages
        urls_to_check = list(PAGINAS.values())

    all_calls = []
    for url in urls_to_check:
        print(f"\n{'='*60}")
        calls = interceptar_api(url, max_wait=20)
        print(f"Chamadas capturadas de {url}: {len(calls)}")
        for c in calls:
            print(f"  [{c['resource_type']}] {c['method']} {c['url']}")
            if c.get("response_sample"):
                print(f"    → {c['response_sample'][:200]}")
        all_calls.extend(calls)

    # Save all calls
    out_file = OUT_DIR / "smarapd_api_discovery.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_calls, f, ensure_ascii=False, indent=2)
    print(f"\nSalvo em: {out_file}")

    # Summary of unique API URLs
    api_urls = sorted(set(c["url"] for c in all_calls if c["url"].startswith(BASE_URL)))
    print(f"\nEndpoints únicos encontrados ({len(api_urls)}):")
    for u in api_urls:
        print(f"  {u}")


if __name__ == "__main__":
    main()
