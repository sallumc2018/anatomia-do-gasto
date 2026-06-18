"""
Coleta documentos da transparencia da Urbes/Sorocaba sem publicar dados.

Saidas:
  - PDFs brutos: ANATOMIA_RAW_ROOT/sorocaba/transporte/urbes/transparencia/<categoria>
  - inventario: data/extracted/sorocaba/urbes/inventario_urbes_transparencia.csv
  - resumo: data/extracted/sorocaba/urbes/resumo_urbes_transparencia.csv

Uso:
    py -3.14 pipelines\\baixar_urbes_transparencia.py --apenas-listar
    py -3.14 pipelines\\baixar_urbes_transparencia.py --categoria despesas --limite 3
    py -3.14 pipelines\\baixar_urbes_transparencia.py
"""

from __future__ import annotations

import argparse
import csv
import re
import time
from dataclasses import dataclass
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.parse import unquote, urljoin, urlparse

from paths import TRANSPORTE_RAW_DIR, ROOT

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    import sys

    print(
        "ERRO: Playwright nao instalado. Execute com py -3.14 "
        "ou instale: py -3.14 -m pip install playwright"
    )
    sys.exit(1)


BASE = "https://www.urbes.com.br"
AJAX_URL = f"{BASE}/transparencia/carregalink-transparencia"
RAW_DIR = TRANSPORTE_RAW_DIR / "urbes" / "transparencia"
EXTRACTED_DIR = ROOT / "data" / "extracted" / "sorocaba" / "urbes"
INVENTARIO_CSV = EXTRACTED_DIR / "inventario_urbes_transparencia.csv"
RESUMO_CSV = EXTRACTED_DIR / "resumo_urbes_transparencia.csv"
URLS_IGNORAR = (
    "Cartilha_maternidade",
    "mapa_zoneamento",
    "carta_governanca_",
    "carta_anual_politicas_governanca",
    "Relatorio_Anual_Integrado",
)

MESES = {
    "janeiro": "01",
    "fevereiro": "02",
    "marco": "03",
    "março": "03",
    "abril": "04",
    "maio": "05",
    "junho": "06",
    "julho": "07",
    "agosto": "08",
    "setembro": "09",
    "outubro": "10",
    "novembro": "11",
    "dezembro": "12",
}


@dataclass(frozen=True)
class Item:
    categoria: str
    subcategoria: str
    ano: str
    periodo: str
    titulo: str
    url_pagina: str
    url_arquivo: str


class LinkParser(HTMLParser):
    def __init__(self, base_url: str) -> None:
        super().__init__()
        self.base_url = base_url
        self.links: list[dict[str, str]] = []
        self._href: str | None = None
        self._text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        attrs_dict = {k.lower(): v for k, v in attrs}
        href = attrs_dict.get("href")
        if href:
            self._href = urljoin(self.base_url, href)
            self._text = []

    def handle_data(self, data: str) -> None:
        if self._href:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._href:
            text = " ".join(" ".join(self._text).split())
            self.links.append({"href": self._href, "texto": text})
            self._href = None
            self._text = []


def slug(texto: str, maxlen: int = 90) -> str:
    texto = unquote(texto)
    texto = texto.replace("ç", "c").replace("Ç", "C")
    texto = re.sub(r"[^A-Za-z0-9._-]+", "_", texto.strip())
    texto = re.sub(r"_+", "_", texto).strip("._-").lower()
    return (texto or "arquivo")[:maxlen]


def ano_de_texto(texto: str) -> str:
    m = re.search(r"(20\d{2}|19\d{2})", texto)
    return m.group(1) if m else ""


def periodo_de_texto(texto: str) -> str:
    texto_limpo = " ".join(texto.split())
    lower = texto_limpo.lower()
    ano = ano_de_texto(texto_limpo)
    for mes, numero in MESES.items():
        if mes in lower and ano:
            return f"{ano}-{numero}"
    return ano


def nome_destino(item: Item) -> str:
    parsed = urlparse(item.url_arquivo)
    nome = slug(Path(unquote(parsed.path)).name)
    if "." not in nome:
        nome = f"{nome}.pdf"
    prefixos = [slug(x, 35) for x in [item.subcategoria, item.periodo] if x]
    return "_".join(prefixos + [nome])


def extrair_links_html(html: str, base_url: str) -> list[dict[str, str]]:
    parser = LinkParser(base_url)
    parser.feed(html)
    return parser.links


def opcoes_selects(page, url: str) -> list[dict]:
    goto(page, url)
    return page.evaluate(
        r"""
        () => Array.from(document.querySelectorAll('select')).map((s, idx) => {
            const heading = (() => {
                let el = s;
                for (let i = 0; i < 8 && el; i++) {
                    el = el.previousElementSibling || el.parentElement?.previousElementSibling;
                    const text = (el?.innerText || '').trim().replace(/\s+/g, ' ');
                    if (text.includes('»')) return text;
                }
                return '';
            })();
            return {
                index: idx,
                id: s.id || '',
                onchange: s.getAttribute('onchange') || '',
                heading,
                options: Array.from(s.options)
                    .map(o => ({value: o.value, text: (o.text || '').trim()}))
                    .filter(o => o.value && o.value !== '-' && o.text && o.text !== '-')
            };
        })
        """
    )


def goto(page, url: str) -> None:
    try:
        page.goto(url, wait_until="networkidle", timeout=45_000)
    except PlaywrightTimeout:
        page.goto(url, wait_until="domcontentloaded", timeout=45_000)
    page.wait_for_timeout(800)


def post_links(page, payload: dict[str, str]) -> list[dict[str, str]]:
    resp = page.request.post(AJAX_URL, form=payload, timeout=60_000)
    if resp.status != 200:
        print(f"  AVISO: POST {payload} retornou {resp.status}")
        return []
    return extrair_links_html(resp.text(), BASE)


def coletar_despesas(page) -> list[Item]:
    url = f"{BASE}/transparencia/relacao-despesas"
    itens: list[Item] = []
    for select in opcoes_selects(page, url):
        tid = select["id"] or "5"
        for opt in select["options"]:
            links = post_links(page, {"id": opt["value"], "tid": tid})
            for link in links:
                itens.append(
                    Item(
                        "despesas",
                        "relacao_mensal_despesas",
                        ano_de_texto(opt["text"]),
                        periodo_de_texto(opt["text"]),
                        link["texto"] or f"Relação Mensal de Despesas {opt['text']}",
                        url,
                        link["href"],
                    )
                )
    return itens


def coletar_balancetes(page) -> list[Item]:
    url = f"{BASE}/transparencia/informacoes-orcamentarias"
    tipos = {
        "36": "balancete_patrimonial",
        "37": "balancete_orcamentario",
        "38": "balancete_financeiro",
    }
    itens: list[Item] = []
    for select in opcoes_selects(page, url):
        m = re.search(r"bp\((\d+),", select["onchange"])
        tipo = m.group(1) if m else ""
        subcategoria = tipos.get(tipo, f"balancete_{select['index']}")
        for opt in select["options"]:
            links = post_links(page, {"id": tipo, "ano": opt["value"]})
            for link in links:
                titulo = link["texto"] or f"{subcategoria} {opt['text']}"
                periodo = periodo_de_texto(titulo) or periodo_de_texto(opt["text"])
                itens.append(
                    Item(
                        "orcamento",
                        subcategoria,
                        ano_de_texto(periodo) or ano_de_texto(opt["text"]),
                        periodo,
                        titulo,
                        url,
                        link["href"],
                    )
                )
    return itens


def coletar_contratos_antigos(page) -> list[Item]:
    url = f"{BASE}/transparencia/contratos"
    subcategorias = {
        0: "licitacoes",
        1: "termos_firmados",
        2: "compras_diretas",
    }
    itens: list[Item] = []
    for select in opcoes_selects(page, url):
        tid = select["id"] or "2"
        subcategoria = subcategorias.get(select["index"], f"contratos_select_{select['index']}")
        for opt in select["options"]:
            links = post_links(page, {"id": opt["value"], "tid": tid})
            for link in links:
                itens.append(
                    Item(
                        "contratos",
                        subcategoria,
                        ano_de_texto(opt["text"]),
                        periodo_de_texto(opt["text"]),
                        link["texto"] or f"{subcategoria} {opt['text']}",
                        url,
                        link["href"],
                    )
                )
    return itens


def coletar_links_diretos(page, categoria: str, subcategoria: str, url: str) -> list[Item]:
    goto(page, url)
    links = page.evaluate(
        r"""
        () => Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({
                href: a.href,
                texto: (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' ')
            }))
            .filter(a => a.href.includes('/uploads') || a.href.includes('/uploads2/'))
        """
    )
    itens = []
    for link in links:
        if any(ignorar.lower() in link["href"].lower() for ignorar in URLS_IGNORAR):
            continue
        titulo = link["texto"] or Path(urlparse(link["href"]).path).name
        itens.append(
            Item(
                categoria,
                subcategoria,
                ano_de_texto(titulo) or ano_de_texto(link["href"]),
                periodo_de_texto(titulo) or periodo_de_texto(link["href"]),
                titulo,
                url,
                link["href"],
            )
        )
    return itens


def coletar_contratos_transporte(page) -> list[Item]:
    return coletar_links_diretos(
        page,
        "contratos",
        "contratos_concessao_transporte",
        f"{BASE}/transparencia/contratos-transporte",
    )


def coletar_rh(page) -> list[Item]:
    itens = coletar_links_diretos(
        page,
        "rh",
        "recursos_humanos",
        f"{BASE}/transparencia/recursos-humanos",
    )
    return [
        item
        for item in itens
        if any(
            termo in item.url_arquivo.lower()
            for termo in ["cargos-e-salarios", "igualdade-salarial"]
        )
    ]


def coletar_remuneracao_transporte(page) -> list[Item]:
    itens = coletar_links_diretos(
        page,
        "remuneracao_transporte",
        "remuneracao_transporte_publico",
        f"{BASE}/transparencia/remuneracao-transporte-publico",
    )
    return [
        item
        for item in itens
        if any(
            termo in item.url_arquivo.lower()
            for termo in ["calculo_tarifario", "auxilio-idoso"]
        )
    ]


COLETORES = {
    "despesas": coletar_despesas,
    "orcamento": coletar_balancetes,
    "rh": coletar_rh,
    "remuneracao_transporte": coletar_remuneracao_transporte,
    "contratos": lambda page: coletar_contratos_antigos(page) + coletar_contratos_transporte(page),
    "contratos_transporte": coletar_contratos_transporte,
}


def deduplicar(itens: Iterable[Item]) -> list[Item]:
    vistos: set[tuple[str, str, str]] = set()
    unicos: list[Item] = []
    for item in itens:
        chave = (item.categoria, item.subcategoria, item.url_arquivo)
        if chave in vistos:
            continue
        vistos.add(chave)
        unicos.append(item)
    return unicos


def validar_pdf(caminho: Path) -> bool:
    try:
        return caminho.read_bytes()[:4] == b"%PDF"
    except OSError:
        return False


def baixar(page, item: Item, forcar: bool = False) -> tuple[str, Path | None, int]:
    destino = RAW_DIR / item.categoria / item.subcategoria / nome_destino(item)
    if destino.exists() and destino.stat().st_size > 500 and not forcar:
        return "existente", destino, destino.stat().st_size

    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".part")
    try:
        resp = page.request.get(item.url_arquivo, timeout=90_000)
        if resp.status != 200:
            return f"http_{resp.status}", None, 0
        corpo = resp.body()
        if len(corpo) <= 500:
            return "vazio", None, len(corpo)
        parcial.write_bytes(corpo)
        parcial.replace(destino)
        if destino.suffix.lower() == ".pdf" and not validar_pdf(destino):
            return "pdf_invalido", destino, destino.stat().st_size
        return "baixado", destino, destino.stat().st_size
    except Exception as exc:
        return f"erro:{type(exc).__name__}", None, 0


def escrever_inventario(linhas: list[dict[str, str]]) -> None:
    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)
    campos = [
        "coletado_em",
        "categoria",
        "subcategoria",
        "ano",
        "periodo",
        "titulo",
        "url_pagina",
        "url_arquivo",
        "arquivo_raw",
        "tamanho_bytes",
        "status_download",
    ]
    with INVENTARIO_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(linhas)

    resumo: dict[tuple[str, str, str], int] = {}
    for linha in linhas:
        chave = (linha["categoria"], linha["subcategoria"], linha["status_download"])
        resumo[chave] = resumo.get(chave, 0) + 1
    with RESUMO_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["categoria", "subcategoria", "status_download", "quantidade"]
        )
        writer.writeheader()
        for (categoria, subcategoria, status), quantidade in sorted(resumo.items()):
            writer.writerow(
                {
                    "categoria": categoria,
                    "subcategoria": subcategoria,
                    "status_download": status,
                    "quantidade": quantidade,
                }
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Coleta transparencia da Urbes")
    parser.add_argument("--categoria", choices=sorted(COLETORES), action="append")
    parser.add_argument("--apenas-listar", action="store_true")
    parser.add_argument("--forcar", action="store_true")
    parser.add_argument("--limite", type=int, help="Limite por categoria para coleta amostral")
    args = parser.parse_args()

    categorias = args.categoria or [
        "despesas",
        "orcamento",
        "rh",
        "remuneracao_transporte",
        "contratos",
    ]
    coletado_em = datetime.now().isoformat(timespec="seconds")

    linhas: list[dict[str, str]] = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        ctx = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
            locale="pt-BR",
            ignore_https_errors=True,
        )
        page = ctx.new_page()

        for categoria in categorias:
            print(f"\nCategoria: {categoria}")
            itens = deduplicar(COLETORES[categoria](page))
            if args.limite:
                itens = itens[: args.limite]
            print(f"  Itens inventariados: {len(itens)}")

            for item in itens:
                status = "inventariado"
                destino: Path | None = None
                tamanho = 0
                if not args.apenas_listar:
                    status, destino, tamanho = baixar(page, item, args.forcar)
                    print(f"  {status}: {item.subcategoria} | {item.periodo or item.ano} | {item.titulo[:60]}")
                    time.sleep(0.15)
                linhas.append(
                    {
                        "coletado_em": coletado_em,
                        "categoria": item.categoria,
                        "subcategoria": item.subcategoria,
                        "ano": item.ano,
                        "periodo": item.periodo,
                        "titulo": item.titulo,
                        "url_pagina": item.url_pagina,
                        "url_arquivo": item.url_arquivo,
                        "arquivo_raw": str(destino) if destino else "",
                        "tamanho_bytes": str(tamanho) if tamanho else "",
                        "status_download": status,
                    }
                )

        browser.close()

    escrever_inventario(linhas)
    print(f"\nInventario: {INVENTARIO_CSV}")
    print(f"Resumo: {RESUMO_CSV}")
    print(f"Raw: {RAW_DIR}")


if __name__ == "__main__":
    main()
