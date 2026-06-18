"""
Baixa dados do SAAE Sorocaba via Playwright.

Portal de Transparencia: https://transparencia.saaesorocaba.sp.gov.br/
Sistema: TDAPortal (eTransparencia - Consenso Tecnologia)
Dados disponíveis: Receita, Despesa, RH, Contratos, Licitacoes (2011-2026)

Status em 2026-05-18:
- O portal usa JavaScript SPA com navegacao via doPortalAction()
- Downloads via secao "Dados Abertos" requerem interacao JS para selecao
  de ano/mes/formato antes do download
- PDFs estaticos da pagina principal (tabelas salariais, quadro de vagas)
  sao acessiveis via URL direta

Uso:
    py -3.14 pipelines\\baixar_saae_playwright.py --apenas-listar
    py -3.14 pipelines\\baixar_saae_playwright.py --categoria estaticos
    py -3.14 pipelines\\baixar_saae_playwright.py --categoria dados_abertos --ano 2025

Proximos passos para dados_abertos:
    Inspecionar rede enquanto usuario navega no portal para capturar
    o endpoint exato de download do TDAPortal.
"""

import argparse
import time
from pathlib import Path

from paths import RAW_DIR

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    import sys
    print("ERRO: Playwright nao instalado.")
    sys.exit(1)

SAAE_RAW_DIR = RAW_DIR / "saae"
BASE_SITE = "https://www.saaesorocaba.com.br"
BASE_PORTAL = "https://transparencia.saaesorocaba.sp.gov.br"

# PDFs acessiveis diretamente no site institucional
URLS_ESTATICAS = [
    {"url": f"{BASE_SITE}/wp-content/uploads/2026/05/quadro-de-cargos-06052026.pdf",
     "nome": "quadro_cargos_2026.pdf", "subdir": "rh"},
    {"url": f"{BASE_SITE}/wp-content/uploads/2026/04/tabela-salarial-012026.pdf",
     "nome": "tabela_salarial_2026_01.pdf", "subdir": "rh"},
    {"url": f"{BASE_SITE}/wp-content/uploads/2026/04/tabela-salarial-comissionados-janeiro-2026.pdf",
     "nome": "tabela_salarial_comissionados_2026_01.pdf", "subdir": "rh"},
    {"url": f"{BASE_SITE}/wp-content/uploads/2024/04/tabela-salarial-01032024.pdf",
     "nome": "tabela_salarial_2024_03.pdf", "subdir": "rh"},
    {"url": f"{BASE_SITE}/wp-content/uploads/2025/01/quadrovagas.pdf",
     "nome": "quadro_vagas_2025.pdf", "subdir": "rh"},
    {"url": f"{BASE_SITE}/wp-content/uploads/2022/01/contrato-prestacosaae-sorocaba.pdf",
     "nome": "contrato_prestacao_servico_saae.pdf", "subdir": "contratos"},
    {"url": f"{BASE_SITE}/downloads/estudo-tarifacao-minima.pdf",
     "nome": "parecer_juridico_tarifa_minima.pdf", "subdir": "juridico"},
]

ANOS = list(range(2020, 2027))


def validar_pdf(caminho: Path) -> bool:
    with caminho.open("rb") as f:
        return f.read(4) == b"%PDF"


def baixar_direto(page, url: str, destino: Path) -> bool:
    destino.parent.mkdir(parents=True, exist_ok=True)
    try:
        resp = page.request.get(url, timeout=60_000)
        if resp.status == 200:
            conteudo = resp.body()
            if len(conteudo) > 500:
                destino.write_bytes(conteudo)
                print(f"  OK: {destino.name} ({destino.stat().st_size // 1024} KB)")
                return True
        print(f"  AVISO: status {resp.status} para {url}")
    except Exception as exc:
        print(f"  ERRO: {exc}")
    return False


def baixar_dados_abertos(page, ano: int) -> None:
    """
    Tenta navegar no TDAPortal e baixar dados em CSV para o ano especificado.
    Estrategia: interceptar requests de rede durante navegacao.
    """
    print(f"\n[dados_abertos] Ano {ano} — navegando no portal...")
    downloads_capturados = []

    def on_response(resp):
        ct = resp.headers.get("content-type", "")
        cd = resp.headers.get("content-disposition", "")
        if "attachment" in cd or any(e in ct for e in ["spreadsheet", "csv", "excel", "octet"]):
            downloads_capturados.append({"url": resp.url, "ct": ct, "cd": cd})

    page.on("response", on_response)

    try:
        page.goto(f"{BASE_PORTAL}/tdaportalclient.aspx?418", wait_until="networkidle", timeout=45000)
        page.wait_for_timeout(3000)

        # Tentar clicar no ano desejado
        try:
            page.get_by_text(str(ano), exact=True).first.click(timeout=5000)
            page.wait_for_timeout(2000)
        except Exception:
            pass

        # Tentar selecionar CSV no select
        try:
            page.select_option("select", label="CSV", timeout=3000)
            page.wait_for_timeout(1000)
        except Exception:
            try:
                page.select_option("select", value="2_6_0", timeout=3000)
                page.wait_for_timeout(1000)
            except Exception:
                pass

        # Aguardar 5s para ver se ha downloads automaticos
        page.wait_for_timeout(5000)

    except Exception as exc:
        print(f"  Erro na navegacao: {exc}")
    finally:
        page.remove_listener("response", on_response)

    if downloads_capturados:
        print(f"  Downloads capturados: {len(downloads_capturados)}")
        for d in downloads_capturados:
            print(f"    {d['url']}")
    else:
        print(f"  Nenhum download capturado para {ano}.")
        print(f"  Portal requer interacao manual ou inspecao de rede para mapear endpoint.")
        print(f"  Sugestao: abrir {BASE_PORTAL}/tdaportalclient.aspx?418 no browser,")
        print(f"  selecionar ano {ano} > CSV > Dados Abertos e capturar a URL da requisicao.")


def main():
    parser = argparse.ArgumentParser(description="Baixa dados do SAAE Sorocaba")
    parser.add_argument("--categoria", choices=["estaticos", "dados_abertos"],
                        default="estaticos")
    parser.add_argument("--ano", type=int, default=2025)
    parser.add_argument("--apenas-listar", action="store_true")
    parser.add_argument("--forcar", action="store_true")
    args = parser.parse_args()

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            locale="pt-BR",
            ignore_https_errors=True,
            accept_downloads=True,
        )
        page = ctx.new_page()

        if args.categoria == "estaticos":
            print(f"Categoria: PDFs estaticos ({len(URLS_ESTATICAS)} arquivos)")
            for item in URLS_ESTATICAS:
                destino = SAAE_RAW_DIR / item["subdir"] / item["nome"]
                print(f"\n  {item['nome']}")
                if args.apenas_listar:
                    print(f"    URL: {item['url']}")
                    continue
                if destino.exists() and not args.forcar and destino.stat().st_size > 1000:
                    print(f"    Ja existe ({destino.stat().st_size // 1024} KB)")
                    continue
                baixar_direto(page, item["url"], destino)
                time.sleep(0.3)

        elif args.categoria == "dados_abertos":
            if args.apenas_listar:
                print(f"Portal: {BASE_PORTAL}/tdaportalclient.aspx?418")
                print("Dados disponiveis (2011-2026): Receita, Despesa, RH, Contratos, Licitacoes")
                print("Download requer navegacao interativa no TDAPortal.")
            else:
                baixar_dados_abertos(page, args.ano)

        browser.close()


if __name__ == "__main__":
    main()
