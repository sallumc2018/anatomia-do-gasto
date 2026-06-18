"""
Baixa PDFs da Camara Municipal de Sorocaba via Playwright (contorna WAF/403).

O portal retorna 403 para requests HTTP normais. Playwright com Chromium headless
resolve isso pois emula um browser real com sessao e cookies.

Arquitetura do portal (mapeada 2026-05-17):
  - Main: arquivos_publicos.html (lista categorias)
  - Categoria: arquivos_publicos.html?id=... (lista sub-pastas/anos)
  - Sub-pasta: arquivos_publicos.html?id=... (lista arquivos ou meses)
  - Arquivo: https://www.camarasorocaba.sp.gov.br:3115/publicFiles/file/{id}

Pre-requisitos:
    py -3.14 -m pip install playwright
    py -3.14 -m playwright install chromium

Uso:
    py -3.14 pipelines\\baixar_camara_playwright.py --apenas-listar
    py -3.14 pipelines\\baixar_camara_playwright.py --documento loa
    py -3.14 pipelines\\baixar_camara_playwright.py --documento gabinete --ano 2024
    py -3.14 pipelines\\baixar_camara_playwright.py --documento ldo --ano 2025 2026
    py -3.14 pipelines\\baixar_camara_playwright.py --documento loa --apenas-listar

Documentos suportados (mapeados pelo portal real):
    loa         - Lei Orcamentaria Anual da Camara (so 2025/2026 disponiveis)
    ldo         - Lei de Diretrizes Orcamentarias
    ppa         - Plano Plurianual
    gabinete    - Despesas de Gabinete por mes (2020-2025)
    prestacao   - Prestacao de Contas Anual (balancetes da Camara)
    metas       - Metas Fiscais
    lrf         - Lei de Responsabilidade Fiscal
"""

import argparse
import io
import re
import sys
import time
from pathlib import Path

# Forcar UTF-8 no terminal do Windows (evita falha ao imprimir caracteres unicode no CP1252)
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print(
        "ERRO: Playwright nao instalado.\n"
        "Execute: py -3.14 -m pip install playwright && py -3.14 -m playwright install chromium",
        file=sys.stderr,
    )
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
CAMARA_RAW_DIR = ROOT / "data" / "raw" / "sorocaba" / "camara"
BASE_URL = "https://camarasorocaba.sp.gov.br"
FILE_HOST = "https://www.camarasorocaba.sp.gov.br:3115"
PORTAL_URL = f"{BASE_URL}/arquivos_publicos.html"

# IDs das categorias raiz no portal (mapeados manualmente)
CATEGORIAS = {
    "loa":       f"{BASE_URL}/arquivos_publicos.html?id=67f6bfc6f4079ed59efc3030",
    "ldo":       f"{BASE_URL}/arquivos_publicos.html?id=67f6bf08f4079ed59efbfb83",
    "ppa":       f"{BASE_URL}/arquivos_publicos.html?id=67f6bebbf4079ed59efbe59e",
    "metas":     f"{BASE_URL}/arquivos_publicos.html?id=67f6c070f4079ed59efc5f51",
    "lrf":       f"{BASE_URL}/arquivos_publicos.html?id=5e3f0d0205d7040f28b4476d",
    "gabinete":  f"http://www.camarasorocaba.sp.gov.br/arquivos_publicos.html?id=5e3f0dc905d7040f28b44e0e",
    "prestacao": f"{BASE_URL}/arquivos_publicos.html?id=5fbe56f8e35da368a5726e0e",
}

NOME_ARQUIVO = {
    "loa":       "loa_{ano}",
    "ldo":       "ldo_{ano}",
    "ppa":       "ppa_{ano}",
    "metas":     "metas_fiscais_{ano}",
    "lrf":       "lrf_{ano}",
    "gabinete":  "gabinete_{ano}_{mes}",
    "prestacao": "prestacao_contas_{ano}",
}

# IDs das pastas de navegacao que devem ser ignoradas (navbar sempre presente)
_NAV_IDS = {
    "5e3f0d0305d7040f28b4477d",  # Atas das Sessoes
    "5e3f0d0305d7040f28b4477e",  # Requerimentos Verbais
    "63bf133fa102594a668e6361",  # Acordos/Convenios
    "63bf137fa102594a668e6466",  # PAC
    "67f6bebbf4079ed59efbe59e",  # PPA (exceto quando e a categoria alvo)
    "67f6bf08f4079ed59efbfb83",  # LDO (exceto quando e a categoria alvo)
    "67f6bfc6f4079ed59efc3030",  # LOA (exceto quando e a categoria alvo)
    "67f6c070f4079ed59efc5f51",  # Metas (exceto quando e a categoria alvo)
    "5e3f0dc905d7040f28b44e0e",  # Gabinete (exceto quando e a categoria alvo)
    "5e3f0d0205d7040f28b4476d",  # LRF (exceto quando e a categoria alvo)
    "5e3f0d0205d7040f28b4476e",  # Lei 9755
    "5e3f0d0305d7040f28b44773",  # Prestacao de Contas
    "5e3f0d0305d7040f28b4477b",  # Subsidio
    "68dbeb9f0bba2f95a1bb11a9",  # Credenciamento passagens
    "5fbe56f8e35da368a5726e0e",  # Camara (prestacao)
    "5fbe5789e35da368a5726e0f",  # Prefeitura (prestacao)
}


def _is_nav_link(url: str) -> bool:
    for nav_id in _NAV_IDS:
        if nav_id in url:
            return True
    return False


def _extrair_ano(texto: str, url: str) -> int | None:
    anos = re.findall(r"\b(20\d{2})\b", texto + " " + url)
    return int(anos[0]) if anos else None


def _e_arquivo_direto(url: str) -> bool:
    return ":3115/publicFiles/file/" in url or ".pdf" in url.lower()


def navegar(page, url: str, timeout: int = 45_000) -> list[dict]:
    """
    Navega para a URL e retorna lista de links encontrados na pagina.
    Cada item: {href, texto, ano, e_arquivo}
    """
    try:
        page.goto(url, wait_until="networkidle", timeout=timeout)
    except PlaywrightTimeout:
        page.goto(url, wait_until="domcontentloaded", timeout=timeout)
    page.wait_for_timeout(1000)

    raw = page.evaluate("""
        () => Array.from(document.querySelectorAll('a[href]')).map(a => ({
            href: a.href || '',
            texto: (a.innerText || a.textContent || '').trim().replace(/\\s+/g, ' ')
        }))
    """)

    seen = set()
    resultado = []
    for item in raw:
        href = item["href"].strip()
        texto = item["texto"].strip()
        if not href or "javascript:" in href or href in seen:
            continue
        seen.add(href)
        ano = _extrair_ano(texto, href)
        e_arquivo = _e_arquivo_direto(href)
        resultado.append({
            "href": href,
            "texto": texto,
            "ano": ano,
            "e_arquivo": e_arquivo,
        })
    return resultado


def coletar_arquivos_pasta(page, url_pasta: str, categoria: str, ano_alvo: int | None = None) -> list[dict]:
    """
    Navega em uma pasta e retorna todos os arquivos diretos (links :3115).
    Segue sub-pastas de ano se ano_alvo for especificado.
    Retorna lista de {href, texto, ano, label} sem duplicatas.
    """
    links = navegar(page, url_pasta)
    arquivos = []
    sub_pastas = []
    vistos = set()

    def add_arquivo(lnk: dict, ano_override=None, mes=None):
        href = lnk["href"]
        if href in vistos:
            return
        vistos.add(href)
        item = dict(lnk)
        if ano_override is not None:
            item["ano"] = item["ano"] or ano_override
        if mes:
            item["mes_pasta"] = mes
        arquivos.append(item)

    for lnk in links:
        href = lnk["href"]
        if _is_nav_link(href):
            continue
        if lnk["e_arquivo"]:
            if ano_alvo is None or lnk["ano"] == ano_alvo or lnk["ano"] is None:
                add_arquivo(lnk)
        elif "arquivos_publicos" in href and href != url_pasta and href != url_pasta + "#":
            sub_pastas.append(lnk)

    # Se nao encontrou arquivos diretos, navega sub-pastas de ano
    if not arquivos:
        for sp in sub_pastas:
            if ano_alvo is not None and sp["ano"] is not None and sp["ano"] != ano_alvo:
                continue
            sub_links = navegar(page, sp["href"])
            for lnk in sub_links:
                href = lnk["href"]
                if _is_nav_link(href):
                    continue
                if lnk["e_arquivo"]:
                    add_arquivo(lnk, ano_override=sp["ano"])
                elif "arquivos_publicos" in href and href != sp["href"] and not _is_nav_link(href):
                    # Terceiro nivel (ex: meses do gabinete)
                    sub2_links = navegar(page, href)
                    for lnk2 in sub2_links:
                        if _is_nav_link(lnk2["href"]):
                            continue
                        if lnk2["e_arquivo"]:
                            add_arquivo(lnk2, ano_override=sp["ano"], mes=lnk["texto"])
                    time.sleep(0.5)
            time.sleep(0.5)

    return arquivos


def validar_pdf(caminho: Path) -> bool:
    with caminho.open("rb") as f:
        return f.read(4) == b"%PDF"


def baixar_arquivo(page, url: str, destino: Path) -> bool:
    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".part")

    # Metodo 1: request direto (herda sessao do browser)
    try:
        resp = page.request.get(url, timeout=120_000)
        if resp.status == 200:
            conteudo = resp.body()
            if len(conteudo) > 100:
                parcial.write_bytes(conteudo)
                parcial.replace(destino)
                kb = destino.stat().st_size // 1024
                print(f"  Baixado: {destino.name} ({kb} KB)")
                return True
            else:
                print(f"  AVISO: resposta muito pequena ({len(conteudo)} bytes)")
        else:
            print(f"  AVISO: status {resp.status} para {url}")
    except Exception as exc:
        print(f"  AVISO: request falhou: {exc}")

    # Metodo 2: navegar para a URL e capturar response
    capturado = []

    def on_response(resp):
        if resp.status == 200 and url in resp.url:
            try:
                body = resp.body()
                if len(body) > 100:
                    capturado.append(body)
            except Exception:
                pass

    page.on("response", on_response)
    try:
        page.goto(url, wait_until="networkidle", timeout=60_000)
        page.wait_for_timeout(2000)
    except PlaywrightTimeout:
        pass
    finally:
        page.remove_listener("response", on_response)

    if capturado:
        parcial.write_bytes(capturado[0])
        parcial.replace(destino)
        kb = destino.stat().st_size // 1024
        print(f"  Baixado (nav): {destino.name} ({kb} KB)")
        return True

    print(f"  ERRO: nao foi possivel baixar {url}")
    return False


def main():
    parser = argparse.ArgumentParser(
        description="Baixa documentos da Camara Municipal de Sorocaba via Playwright"
    )
    parser.add_argument(
        "--documento",
        choices=sorted(CATEGORIAS),
        action="append",
        help="Categoria de documento (pode repetir). Padrao: todas",
    )
    parser.add_argument(
        "--ano",
        type=int,
        action="append",
        help="Ano (pode repetir). Padrao: todos encontrados",
    )
    parser.add_argument(
        "--apenas-listar",
        action="store_true",
        help="Lista os arquivos encontrados sem baixar",
    )
    parser.add_argument(
        "--forcar",
        action="store_true",
        help="Rebaixa mesmo se o arquivo ja existir",
    )
    parser.add_argument(
        "--no-headless",
        action="store_true",
        help="Abre janela do browser (util para depuracao)",
    )
    args = parser.parse_args()

    documentos = args.documento or sorted(CATEGORIAS)
    anos_alvo = set(args.ano) if args.ano else None
    headless = not args.no_headless

    print(f"Documentos: {documentos}")
    print(f"Anos: {sorted(anos_alvo) if anos_alvo else 'todos'}")
    print(f"Headless: {headless}")
    print()

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=headless,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
            locale="pt-BR",
            accept_downloads=True,
            ignore_https_errors=True,  # porta 3115 usa certificado nao verificado
        )
        page = context.new_page()

        baixados = 0
        erros = 0

        for doc in documentos:
            url_cat = CATEGORIAS[doc]
            print(f"\n{'='*60}")
            print(f"Categoria: {doc}")
            print(f"URL: {url_cat}")

            for ano in (sorted(anos_alvo) if anos_alvo else [None]):
                arquivos = coletar_arquivos_pasta(page, url_cat, doc, ano_alvo=ano)

                if not arquivos:
                    print(f"  [{ano or 'todos'}] Nenhum arquivo encontrado.")
                    continue

                print(f"\n  [{ano or 'todos'}] {len(arquivos)} arquivo(s) encontrado(s):")
                for arq in arquivos:
                    ano_arq = arq["ano"]
                    mes = arq.get("mes_pasta", "")
                    label = arq["texto"][:60]
                    print(f"    ({ano_arq}) {label}")
                    print(f"      {arq['href']}")

                if args.apenas_listar:
                    continue

                for arq in arquivos:
                    href = arq["href"]
                    ano_arq = arq["ano"] or (ano or 0)
                    mes = arq.get("mes_pasta", "")
                    texto = arq["texto"]

                    # Construir nome do arquivo
                    nome_padrao = NOME_ARQUIVO.get(doc, f"{doc}_{{ano}}")
                    if mes:
                        nome = nome_padrao.format(ano=ano_arq, mes=mes.lower().replace(" ", "_")) + ".pdf"
                    else:
                        # Sanitizar texto para usar no nome
                        sufixo = re.sub(r"[^a-z0-9_]", "_", texto.lower())[:40].strip("_")
                        nome = nome_padrao.format(ano=ano_arq) + f"_{sufixo}.pdf"

                    destino = CAMARA_RAW_DIR / str(ano_arq) / doc / nome

                    if destino.exists() and not args.forcar:
                        print(f"  Ja existe: {destino.name} — use --forcar para rebaixar")
                        continue

                    ok = baixar_arquivo(page, href, destino)
                    if ok:
                        if validar_pdf(destino):
                            print(f"    Validado: header %PDF ok")
                            baixados += 1
                        else:
                            kb = destino.stat().st_size
                            print(f"    AVISO: header invalido ({kb} bytes) — pode nao ser PDF")
                            erros += 1
                    else:
                        erros += 1

                    time.sleep(1)

        browser.close()

    if not args.apenas_listar:
        print(f"\n{'='*60}")
        print(f"Baixados: {baixados} | Erros: {erros}")
        print(f"Destino: {CAMARA_RAW_DIR}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrompido.", file=sys.stderr)
        sys.exit(130)
    except Exception as exc:
        print(f"Erro fatal: {exc}", file=sys.stderr)
        raise
