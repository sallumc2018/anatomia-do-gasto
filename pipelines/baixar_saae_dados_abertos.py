"""
Inventaria e coleta recortes do TDAPortal do SAAE Sorocaba.

Nao publica dados. Brutos de navegacao ficam em RAW_DIR/saae/tdaportal e
recortes tecnicamente seguros ficam em data/extracted/sorocaba/saae.

Uso:
    py -3.14 pipelines\\baixar_saae_dados_abertos.py --apenas-inventario
    py -3.14 pipelines\\baixar_saae_dados_abertos.py --categorias receitas,despesas --ano 2025
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from paths import EXTRACTED_DIR, RAW_DIR

try:
    from playwright.sync_api import TimeoutError as PlaywrightTimeout
    from playwright.sync_api import sync_playwright
except ImportError as exc:  # pragma: no cover - erro de ambiente
    raise SystemExit("ERRO: Playwright nao instalado em py -3.14.") from exc


BASE_PORTAL = "https://transparencia.saaesorocaba.sp.gov.br"
LOGIN_URL = f"{BASE_PORTAL}/login.html?"
CLIENT_URL = f"{BASE_PORTAL}/tdaportalclient.aspx?418"
AWS_CONTENT_URL = f"{BASE_PORTAL}/awsgetcontentareas.aspx"

RAW_SAAE_DIR = RAW_DIR / "saae" / "tdaportal"
EXTRACTED_SAAE_DIR = EXTRACTED_DIR / "saae"


@dataclass(frozen=True)
class Categoria:
    slug: str
    titulo: str
    classe_card: str
    dsh: str
    descricao: str
    anos_observados: str


CATEGORIAS: dict[str, Categoria] = {
    "dados_abertos": Categoria(
        "dados_abertos",
        "Dados Abertos",
        "temp05_14_",
        "209",
        "Filtros de exercicio, mes, modulo e tipo de arquivo; download final ainda depende de acao JS.",
        "2011-2026",
    ),
    "receitas": Categoria(
        "receitas",
        "Receitas",
        "temp05_8_",
        "199",
        "Receita prevista/arrecadada por exercicio, mes, receita analitica, dia e conta.",
        "2011-2026",
    ),
    "despesas": Categoria(
        "despesas",
        "Despesas",
        "temp05_5_",
        "200",
        "Execucao de despesa no portal por exercicio; filtros por classificacoes do TDAPortal.",
        "2011-2026",
    ),
    "licitacoes": Categoria(
        "licitacoes",
        "Compras/Licitacoes",
        "temp05_12_",
        "252",
        "Processos de compras e licitacoes por ano, mes, modalidade, situacao e objeto.",
        "2009-2026",
    ),
    "contratos": Categoria(
        "contratos",
        "Contratos",
        "temp05_20_",
        "196",
        "Contratos por ano, tipo, fornecedor e situacao.",
        "2005-2026",
    ),
    "obras": Categoria(
        "obras",
        "Obras do SAAE",
        "temp05_26_",
        "208",
        "Obras por processo, ano e situacao.",
        "2017-2024",
    ),
    "pessoal": Categoria(
        "pessoal",
        "Recursos Humanos",
        "temp05_11_",
        "96",
        "Lotacao de servidores por exercicio, mes, secretaria, cargo e vinculo.",
        "2014-2026",
    ),
}


def agora_slug() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def limpar_linhas(linhas: list[list[str]], limite: int) -> list[list[str]]:
    saida: list[list[str]] = []
    for linha in linhas:
        celulas = [re.sub(r"\s+", " ", c).strip() for c in linha]
        celulas = [c for c in celulas if c]
        if len(celulas) >= 2:
            saida.append(celulas)
        if len(saida) >= limite:
            break
    return saida


def extrair_tabelas(page, limite_linhas: int) -> list[dict[str, Any]]:
    tabelas = page.evaluate(
        """
        () => Array.from(document.querySelectorAll('.dash.selected table')).map((table, idx) => {
          const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
            Array.from(tr.querySelectorAll('th,td')).map(td => td.innerText || td.textContent || '')
          );
          return {idx, rows};
        })
        """
    )
    extraidas: list[dict[str, Any]] = []
    for tabela in tabelas:
        linhas = limpar_linhas(tabela["rows"], limite_linhas)
        if linhas:
            extraidas.append({"idx": tabela["idx"], "rows": linhas})
    return extraidas


def extrair_metadados_area(page) -> dict[str, Any]:
    return page.evaluate(
        """
        () => {
          const clean = (text) => (text || '').replace(/\\s+/g, ' ').trim();
          const area = document.querySelector('.dash.selected') || document.body;
          return {
            titulo: clean(area.querySelector('h1,h2,h3,.title,.dashboardTitle')?.innerText || ''),
            filtros: Array.from(area.querySelectorAll('select,input')).map((el) => ({
              tag: el.tagName,
              id: el.id || '',
              name: el.name || '',
              type: el.type || '',
              value: el.value || '',
              label: clean(el.closest('td,tr,div')?.innerText || '').slice(0, 180),
              options: el.tagName === 'SELECT'
                ? Array.from(el.options).map((o) => ({value: o.value, text: clean(o.textContent)})).slice(0, 80)
                : []
            })).slice(0, 120),
            acoes: Array.from(area.querySelectorAll('button,input[type=button],a')).map((el) => ({
              tag: el.tagName,
              id: el.id || '',
              text: clean(el.innerText || el.value || el.title || ''),
              href: el.href || '',
              onclick: el.getAttribute('onclick') || ''
            })).filter((x) => x.text || x.href || x.onclick).slice(0, 160),
            links: Array.from(area.querySelectorAll('a[href]')).map((a) => ({
              text: clean(a.innerText || a.title || ''),
              href: a.href || ''
            })).filter((x) => x.href).slice(0, 160)
          };
        }
        """
    )


def extrair_html_area(page) -> str:
    area = page.locator(".dash.selected")
    if area.count():
        return area.first.evaluate("el => el.outerHTML")
    return page.locator("body").evaluate("el => el.outerHTML")


def salvar_csv(path: Path, linhas: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    largura = max(len(linha) for linha in linhas)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([f"coluna_{i + 1}" for i in range(largura)])
        for linha in linhas:
            writer.writerow(linha + [""] * (largura - len(linha)))


def abrir_portal(page) -> None:
    page.goto(LOGIN_URL, wait_until="networkidle", timeout=60_000)
    page.wait_for_selector("div[class^='temp05_14_']", timeout=30_000)


def clicar_categoria(page, categoria: Categoria) -> list[dict[str, str]]:
    eventos: list[dict[str, str]] = []

    def on_request(request) -> None:
        if request.resource_type in {"xhr", "fetch", "document"}:
            post = request.post_data or ""
            if "tdaportalclient.aspx" in request.url or "awsgetcontentareas.aspx" in request.url:
                eventos.append({"method": request.method, "url": request.url, "post_prefix": post[:2000]})

    page.on("request", on_request)
    try:
        seletor = f"div[class^='{categoria.classe_card}']"
        card = page.locator(seletor).first
        try:
            card.scroll_into_view_if_needed(timeout=5_000)
            card.click(timeout=15_000, force=True)
        except Exception:
            page.evaluate(
                """(selector) => document.querySelector(selector)?.click()""",
                seletor,
            )
        page.wait_for_timeout(5_000)
    finally:
        page.remove_listener("request", on_request)
    return eventos


def aplicar_ano_quando_possivel(page, ano: int) -> None:
    seletores = page.locator("select[id*='_exe']")
    for i in range(seletores.count()):
        try:
            seletores.nth(i).select_option(str(ano), timeout=1_000)
        except Exception:
            pass
    inputs = page.locator("input[id*='_exe']")
    for i in range(inputs.count()):
        try:
            inputs.nth(i).fill(str(ano), timeout=1_000)
            inputs.nth(i).evaluate("el => el.dispatchEvent(new Event('change', {bubbles: true}))")
        except Exception:
            pass


def status_extracao(tabelas: list[dict[str, Any]], metadados: dict[str, Any]) -> str:
    if tabelas:
        return "extraido"
    if metadados.get("filtros") or metadados.get("acoes") or metadados.get("links"):
        return "lacuna_declarada_sem_tabela_extraivel"
    return "lacuna_declarada_sem_conteudo_estruturado"


def inventario_base() -> list[dict[str, str]]:
    return [
        {
            "categoria": c.slug,
            "titulo": c.titulo,
            "portal_url": CLIENT_URL,
            "endpoint_spa": "tdaportalclient.aspx",
            "endpoint_conteudo": AWS_CONTENT_URL,
            "dsh": c.dsh,
            "acao": f"AREALINK#<layer>DSA2**##**DSH=sit[2]sus[143]dsh[{c.dsh}]",
            "anos_observados": c.anos_observados,
            "descricao": c.descricao,
        }
        for c in CATEGORIAS.values()
    ]


def escrever_inventario(inventario: list[dict[str, Any]], destino: Path) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    json_path = destino / "inventario_tdaportal_saae.json"
    csv_path = destino / "inventario_tdaportal_saae.csv"
    json_path.write_text(json.dumps(inventario, ensure_ascii=False, indent=2), encoding="utf-8")
    campos = sorted({k for item in inventario for k in item.keys()})
    with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(inventario)


def escrever_resumo_markdown(inventario: list[dict[str, Any]], run_id: str, destino: Path) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    linhas = [
        f"# SAAE Sorocaba - TDAPortal {run_id}",
        "",
        "Coleta exploratoria oficial sem publicar em data/public.",
        "",
        "| categoria | ano | status | tabelas | linhas | requests | dsh |",
        "|---|---:|---|---:|---:|---:|---:|",
    ]
    for item in inventario:
        if "run_id" not in item:
            continue
        linhas.append(
            "| {categoria} | {ano_amostra} | {status} | {tabelas_extraidas} | "
            "{linhas_extraidas} | {requests_relevantes} | {dsh_observado} |".format(
                categoria=item.get("categoria", ""),
                ano_amostra=item.get("ano_amostra", ""),
                status=item.get("status", ""),
                tabelas_extraidas=item.get("tabelas_extraidas", ""),
                linhas_extraidas=item.get("linhas_extraidas", ""),
                requests_relevantes=item.get("requests_relevantes", ""),
                dsh_observado=item.get("dsh_observado", ""),
            )
        )
    linhas.extend(
        [
            "",
            "## Endpoints observados",
            "",
            f"- SPA: `{CLIENT_URL}`",
            f"- Conteudo: `{AWS_CONTENT_URL}`",
            "- Acoes de navegacao capturadas via `tdaportalclient.aspx?...gx-no-cache=...` com `PortalActionHandle`.",
            "",
            "## Lacunas",
            "",
        ]
    )
    lacunas = [i for i in inventario if i.get("status", "").startswith("lacuna")]
    if lacunas:
        for item in lacunas:
            linhas.append(
                f"- {item['categoria']}: sem tabela extraivel na amostra; filtros/acoes foram salvos em `metadados.json` e HTML bruto em RAW."
            )
    else:
        linhas.append("- Nenhuma lacuna tabular na amostra executada; ainda exige validacao semantica antes de publicar.")
    destino.write_text("\n".join(linhas) + "\n", encoding="utf-8")


def coletar(args: argparse.Namespace) -> list[dict[str, Any]]:
    selecionadas = [s.strip() for s in args.categorias.split(",") if s.strip()]
    invalidas = [s for s in selecionadas if s not in CATEGORIAS]
    if invalidas:
        raise SystemExit(f"Categorias invalidas: {', '.join(invalidas)}")

    run_id = agora_slug()
    raw_run_dir = RAW_SAAE_DIR / run_id
    extracted_run_dir = EXTRACTED_SAAE_DIR / "tdaportal" / run_id
    inventario: list[dict[str, Any]] = inventario_base()

    if args.apenas_inventario:
        escrever_inventario(inventario, EXTRACTED_SAAE_DIR / "tdaportal")
        return inventario

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = browser.new_context(
            accept_downloads=True,
            ignore_https_errors=True,
            locale="pt-BR",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()

        for slug in selecionadas:
            categoria = CATEGORIAS[slug]
            print(f"[{slug}] abrindo DSH {categoria.dsh}")
            abrir_portal(page)
            eventos = clicar_categoria(page, categoria)
            aplicar_ano_quando_possivel(page, args.ano)
            page.wait_for_timeout(2_000)

            texto = page.locator("body").inner_text(timeout=15_000)
            html = extrair_html_area(page)
            tabelas = extrair_tabelas(page, args.limite_linhas)
            metadados = extrair_metadados_area(page)

            raw_cat_dir = raw_run_dir / slug
            raw_cat_dir.mkdir(parents=True, exist_ok=True)
            (raw_cat_dir / "pagina.html").write_text(html, encoding="utf-8")
            (raw_cat_dir / "pagina.txt").write_text(texto, encoding="utf-8")
            (raw_cat_dir / "requests.json").write_text(
                json.dumps(eventos, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            (raw_cat_dir / "metadados.json").write_text(
                json.dumps(metadados, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            total_linhas = 0
            for tabela in tabelas:
                linhas = tabela["rows"]
                total_linhas += len(linhas)
                salvar_csv(extracted_run_dir / slug / f"tabela_{tabela['idx']:02d}.csv", linhas)

            inventario.append(
                {
                    "categoria": slug,
                    "run_id": run_id,
                    "raw_dir": str(raw_cat_dir),
                    "extracted_dir": str(extracted_run_dir / slug),
                    "ano_amostra": args.ano,
                    "dsh_observado": categoria.dsh,
                    "requests_relevantes": len(eventos),
                    "tabelas_extraidas": len(tabelas),
                    "linhas_extraidas": total_linhas,
                    "filtros_detectados": len(metadados.get("filtros", [])),
                    "acoes_detectadas": len(metadados.get("acoes", [])),
                    "links_detectados": len(metadados.get("links", [])),
                    "status": status_extracao(tabelas, metadados),
                }
            )
            print(f"  tabelas={len(tabelas)} linhas={total_linhas}")

        context.close()
        browser.close()

    escrever_inventario(inventario, extracted_run_dir)
    escrever_inventario(inventario, EXTRACTED_SAAE_DIR / "tdaportal")
    escrever_resumo_markdown(inventario, run_id, Path("tmp/orquestrador-sorocaba-100/saae.md"))
    return inventario


def main() -> None:
    parser = argparse.ArgumentParser(description="Coleta SAAE Sorocaba no TDAPortal sem publicar dados.")
    parser.add_argument(
        "--categorias",
        default="dados_abertos,receitas,despesas,licitacoes,contratos,obras,pessoal",
        help="Lista separada por virgulas. Opcoes: " + ",".join(CATEGORIAS),
    )
    parser.add_argument("--ano", type=int, default=2026)
    parser.add_argument("--limite-linhas", type=int, default=200)
    parser.add_argument("--apenas-inventario", action="store_true")
    args = parser.parse_args()
    inventario = coletar(args)
    print(json.dumps(inventario[-10:], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
