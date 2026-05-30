"""
Spider TDAPortal para o portal de transparência da Prefeitura de Sorocaba.

Mesmo padrão do SAAE (baixar_saae_dados_abertos.py), adaptado para o portal
municipal (tdaportalclient.aspx?418).

Seções disponíveis (descobertas em 2026-05-29):
  rh              - Recursos Humanos / lotação de servidores (temp05_16_)
  tabelas_sal     - Tabelas Salariais (temp05_17_)
  despesas        - Despesas municipais (temp05_11_)
  receitas        - Receitas municipais (temp05_12_)
  diarias         - Despesas com diárias e viagens (temp05_13_)
  transferencias  - Transferências recebidas (temp05_14_)
  contas_pub      - Contas Públicas / LRF (temp05_15_)
  licitacoes      - Licitações e Contratos (temp05_18_)
  restos          - Restos a pagar (temp05_21_)
  obras           - Obras Municipais (temp05_37_)
  cargos          - Quadro de Cargos e Funções (temp05_43_)
  fundeb          - Aplicação no FUNDEB (temp05_50_)
  dados_abertos   - Extração de Dados em Formato Aberto (temp05_33_)

Uso:
    python pipelines/baixar_sorocaba_prefeitura.py --secao rh --ano 2024
    python pipelines/baixar_sorocaba_prefeitura.py --secao rh --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025
    python pipelines/baixar_sorocoba_prefeitura.py --secao dados_abertos
    python pipelines/baixar_sorocoba_prefeitura.py --secao tabelas_sal
    python pipelines/baixar_sorocoba_prefeitura.py --listar
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
except ImportError:
    sys.exit("playwright nao instalado. Verificar requirements-audit.txt.")

sys.path.insert(0, str(Path(__file__).parent))
from paths import EXTRACTED_DIR

PORTAL_URL    = "https://transparencia.sorocaba.sp.gov.br/tdaportalclient.aspx?418"
EXTRACTED_DIR_PREF = EXTRACTED_DIR / "execucao" / "tdaportal_prefeitura"

SECOES: dict[str, dict] = {
    "rh":           {"num": 16, "label": "Recursos Humanos", "tem_ano": True,  "tem_mes": True,  "tem_secr": True},
    "tabelas_sal":  {"num": 17, "label": "Tabelas Salariais","tem_ano": False, "tem_mes": False, "tem_secr": False},
    "despesas":     {"num": 11, "label": "Despesas",          "tem_ano": True,  "tem_mes": False, "tem_secr": False},
    "receitas":     {"num": 12, "label": "Receitas",          "tem_ano": True,  "tem_mes": False, "tem_secr": False},
    "diarias":      {"num": 13, "label": "Diárias e Viagens", "tem_ano": True,  "tem_mes": False, "tem_secr": False},
    "transferencias":{"num":14, "label": "Transferências",    "tem_ano": True,  "tem_mes": False, "tem_secr": False},
    "contas_pub":   {"num": 15, "label": "Contas Públicas",   "tem_ano": False, "tem_mes": False, "tem_secr": False},
    "licitacoes":   {"num": 18, "label": "Licitações/Contratos","tem_ano": True,"tem_mes": False, "tem_secr": False},
    "restos":       {"num": 21, "label": "Restos a pagar",    "tem_ano": True,  "tem_mes": False, "tem_secr": False},
    "obras":        {"num": 37, "label": "Obras Municipais",  "tem_ano": True,  "tem_mes": False, "tem_secr": False},
    "cargos":       {"num": 43, "label": "Quadro de Cargos",  "tem_ano": False, "tem_mes": False, "tem_secr": False},
    "fundeb":       {"num": 50, "label": "FUNDEB",            "tem_ano": True,  "tem_mes": False, "tem_secr": False},
    "dados_abertos":{"num": 33, "label": "Extração Dados Abertos","tem_ano":False,"tem_mes":False,"tem_secr":False},
}


def agora_slug() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def limpar(linhas: list[list[str]], limite: int = 2000) -> list[list[str]]:
    saida = []
    for linha in linhas:
        celulas = [re.sub(r"\s+", " ", c).strip() for c in linha]
        celulas = [c for c in celulas if c]
        if len(celulas) >= 2:
            saida.append(celulas)
        if len(saida) >= limite:
            break
    return saida


def extrair_tabelas(page) -> list[dict]:
    tabelas = page.evaluate("""() =>
        Array.from(document.querySelectorAll('.dash.selected table')).map((t, idx) => ({
            idx,
            rows: Array.from(t.querySelectorAll('tr')).map(tr =>
                Array.from(tr.querySelectorAll('th,td')).map(td => (td.innerText||td.textContent||'').trim())
            )
        }))
    """)
    return [{"idx": t["idx"], "rows": limpar(t["rows"])} for t in tabelas if limpar(t["rows"])]


def extrair_svg_labels(page) -> list[str]:
    """O portal renderiza dados via FusionCharts (SVG). Os rotulos (categorias e
    valores) ficam em elementos <text> do SVG apos o render. Provado funcional em
    2026-05-29 para a serie temporal de RH."""
    return page.evaluate("""() => {
        var out = [];
        document.querySelectorAll('.dash.selected svg text').forEach(function(t){
            var s = (t.textContent||'').trim();
            if (s) out.push(s);
        });
        return out;
    }""")


def extrair_downloads(page) -> list[dict]:
    """Captura links de download reais (CSV, XLS, PDF) na área selecionada."""
    return page.evaluate("""() =>
        Array.from(document.querySelectorAll('.dash.selected a[href]'))
            .filter(a => a.href && !a.href.endsWith('#') && !a.href.includes('javascript'))
            .map(a => ({href: a.href, text: (a.innerText||a.textContent||'').trim()}))
    """)


def navegar_secao(page, num: int, timeout: int = 30_000) -> bool:
    seletor = f"[class^='temp05_{num}_']"
    try:
        el = page.wait_for_selector(seletor, timeout=timeout)
        el.click()
        page.wait_for_selector(".dash.selected", timeout=timeout)
        page.wait_for_timeout(3000)
        return True
    except PWTimeout:
        print(f"  TIMEOUT ao navegar para temp05_{num}_", file=sys.stderr)
        return False


def definir_ano(page, ano: int) -> bool:
    seletores = page.locator("select[id*='_exe']")
    count = seletores.count()
    if count == 0:
        return False
    for i in range(count):
        try:
            seletores.nth(i).select_option(str(ano), timeout=3000)
        except Exception:
            pass
    page.wait_for_timeout(2000)
    return True


def definir_mes(page, mes: str) -> bool:
    seletores = page.locator("select[id*='_mes'],select[id*='_month']")
    if seletores.count() == 0:
        return False
    try:
        seletores.first.select_option(mes, timeout=2000)
        page.wait_for_timeout(1500)
        return True
    except Exception:
        return False


def coletar_secao(page, secao: str, ano: int | None, run_dir: Path) -> dict:
    cfg = SECOES[secao]
    print(f"  Coletando '{secao}' ({cfg['label']})" + (f" ano={ano}" if ano else ""))

    if not navegar_secao(page, cfg["num"]):
        return {"secao": secao, "ano": ano, "tabelas": 0, "downloads": 0, "status": "timeout"}

    if ano and cfg["tem_ano"]:
        definir_ano(page, ano)

    # espera FusionCharts renderizar antes de coletar
    page.wait_for_timeout(4000)

    tabelas = extrair_tabelas(page)
    downloads = extrair_downloads(page)
    svg_labels = extrair_svg_labels(page)

    # salva tabelas
    slug = f"{secao}_{ano}" if ano else secao
    dest_dir = run_dir / slug
    dest_dir.mkdir(parents=True, exist_ok=True)

    for tabela in tabelas:
        dest = dest_dir / f"tabela_{tabela['idx']:02d}.csv"
        with dest.open("w", encoding="utf-8", newline="") as f:
            csv.writer(f).writerows(tabela["rows"])

    # salva rotulos SVG (FusionCharts) — fonte principal de dados deste portal
    if svg_labels:
        svg_dest = dest_dir / "svg_labels.csv"
        with svg_dest.open("w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["texto_svg"])
            for s in svg_labels:
                w.writerow([s])

    # salva lista de downloads
    if downloads:
        dl_dest = dest_dir / "downloads.json"
        dl_dest.write_text(json.dumps(downloads, ensure_ascii=False, indent=2), encoding="utf-8")

    total_linhas = sum(len(t["rows"]) for t in tabelas)
    print(f"    -> {len(tabelas)} tabelas, {total_linhas} linhas, {len(svg_labels)} svg_labels, {len(downloads)} downloads")
    return {"secao": secao, "ano": ano, "tabelas": len(tabelas), "linhas": total_linhas,
            "svg_labels": len(svg_labels), "downloads": len(downloads), "status": "ok"}


def main() -> None:
    ap = argparse.ArgumentParser(description="Spider TDAPortal Prefeitura Sorocaba")
    ap.add_argument("--secao", choices=list(SECOES), default="rh")
    ap.add_argument("--ano", type=int, action="append")
    ap.add_argument("--listar", action="store_true")
    ap.add_argument("--todas", action="store_true", help="Coleta todas as seções")
    args = ap.parse_args()

    if args.listar:
        print("Seções disponíveis:")
        for k, v in SECOES.items():
            print(f"  {k:<15} temp05_{v['num']}_  {v['label']}")
        return

    secoes_alvo = list(SECOES.keys()) if args.todas else [args.secao]
    anos = args.ano or ([2024] if SECOES[args.secao]["tem_ano"] else [None])

    run_id   = agora_slug()
    run_dir  = EXTRACTED_DIR_PREF / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    resultados = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context()
        page    = context.new_page()

        print(f"Abrindo portal: {PORTAL_URL}")
        page.goto(PORTAL_URL, timeout=60_000, wait_until="load")
        page.wait_for_timeout(8000)

        for secao in secoes_alvo:
            cfg = SECOES[secao]
            anos_secao = anos if cfg["tem_ano"] else [None]
            for ano in anos_secao:
                r = coletar_secao(page, secao, ano, run_dir)
                resultados.append(r)

        browser.close()

    # salva resumo
    resumo = run_dir / "resumo.json"
    resumo.write_text(json.dumps({"run_id": run_id, "resultados": resultados}, ensure_ascii=False, indent=2),
                      encoding="utf-8")

    total_tab = sum(r.get("tabelas", 0) for r in resultados)
    total_lin = sum(r.get("linhas",  0) for r in resultados)
    print(f"\nConcluído: {len(resultados)} coletas, {total_tab} tabelas, {total_lin} linhas")
    print(f"Output: {run_dir}")


if __name__ == "__main__":
    main()
