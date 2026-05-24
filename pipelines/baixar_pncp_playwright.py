"""
Extrai contratos, atas e editais (compras) do PNCP para Sorocaba via Playwright.

O endpoint REST /api/consulta/v1/ retorna 403. O endpoint /api/search/ (usado
pela interface web) funciona normalmente via browser headless com Chromium.

Achados do mapeamento (2026-05-24):
  - API search: https://pncp.gov.br/api/search/?tipos_documento=<tipo>&...
  - Tipos confirmados: contrato (639 total), ata (420 total), edital/compras (1276 total)
  - Filtro: q=<CNPJ> filtra por CNPJ do órgão; status=todos inclui vigente+encerrado
  - Paginacao maxima: 500 registros/pagina

Uso:
    py pipelines\\baixar_pncp_playwright.py
    py pipelines\\baixar_pncp_playwright.py --anos 2022 2023 2024 2025
    py pipelines\\baixar_pncp_playwright.py --tipo contrato --anos 2024
    py pipelines\\baixar_pncp_playwright.py --apenas-listar

CNPJ Sorocaba: 46634044000174
IBGE Sorocaba: 3552205
"""

import argparse
import csv
import io
import sys
import time
from pathlib import Path

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
        "Execute: py -m pip install playwright && py -m playwright install chromium",
        file=sys.stderr,
    )
    sys.exit(1)

from paths import EXTRACTED_DIR

CNPJ = "46634044000174"
PNCP_SAIDA = EXTRACTED_DIR / "pncp" / "saida"
BASE_URL = "https://pncp.gov.br"
SEARCH_API = f"{BASE_URL}/api/search/"

TIPOS = {
    "contrato": "contratos",
    "ata": "atas",
    "edital": "compras",
}

CAMPOS_CONTRATOS = [
    "numero_controle_pncp", "numero", "ano", "numero_sequencial",
    "orgao_cnpj", "orgao_nome", "unidade_nome",
    "modalidade_licitacao_nome", "tipo_contrato_nome", "tipo_nome",
    "situacao_nome", "cancelado",
    "data_publicacao_pncp", "data_atualizacao_pncp", "data_assinatura",
    "data_inicio_vigencia", "data_fim_vigencia",
    "valor_global", "fonte_orcamentaria_nome",
    "exigencia_conteudo_nacional", "permite_adesao", "possui_emenda_parlamentar",
    "municipio_nome", "uf", "esfera_nome", "poder_nome",
    "title", "description", "item_url",
]

CAMPOS_ATAS = [
    "numero_controle_pncp", "numero", "ano", "numero_sequencial",
    "numero_sequencial_compra_ata",
    "orgao_cnpj", "orgao_nome", "unidade_nome",
    "modalidade_licitacao_nome",
    "situacao_nome", "cancelado",
    "data_publicacao_pncp", "data_atualizacao_pncp",
    "data_inicio_vigencia", "data_fim_vigencia",
    "valor_global", "permite_adesao",
    "municipio_nome", "uf", "esfera_nome",
    "title", "description", "item_url",
]

CAMPOS_EDITAIS = [
    "numero_controle_pncp", "numero", "ano", "numero_sequencial",
    "orgao_cnpj", "orgao_nome", "unidade_nome",
    "modalidade_licitacao_nome", "tipo_nome",
    "situacao_nome", "cancelado",
    "data_publicacao_pncp", "data_atualizacao_pncp",
    "valor_global",
    "municipio_nome", "uf", "esfera_nome",
    "title", "description", "item_url",
]

CAMPOS_POR_TIPO = {
    "contrato": CAMPOS_CONTRATOS,
    "ata": CAMPOS_ATAS,
    "edital": CAMPOS_EDITAIS,
}


def buscar_pagina(page, tipo: str, pagina: int, tam: int = 500) -> dict:
    url = (
        f"{SEARCH_API}?tipos_documento={tipo}"
        f"&pagina={pagina}&tam_pagina={tam}"
        f"&status=todos&q={CNPJ}"
    )
    try:
        resp = page.request.get(url, timeout=60_000)
    except PlaywrightTimeout:
        raise RuntimeError(f"Timeout ao acessar pagina {pagina} de {tipo}")
    if resp.status != 200:
        raise RuntimeError(f"HTTP {resp.status} para {url}: {resp.text()[:200]}")
    return resp.json()


def buscar_todos(page, tipo: str) -> list:
    items = []
    pagina = 1
    while True:
        data = buscar_pagina(page, tipo, pagina)
        batch = data.get("items", [])
        total = data.get("total", 0)
        items.extend(batch)
        print(f"  p.{pagina}: +{len(batch)} (acumulado {len(items)}/{total})")
        if len(items) >= total or not batch:
            break
        pagina += 1
        time.sleep(0.8)
    return items


def salvar_csv(items: list, campos: list, destino: Path) -> int:
    destino.parent.mkdir(parents=True, exist_ok=True)
    with destino.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        writer.writeheader()
        for item in items:
            writer.writerow({k: item.get(k, "") for k in campos})
    return len(items)


def main():
    parser = argparse.ArgumentParser(description="Extrai dados PNCP Sorocaba via Playwright")
    parser.add_argument(
        "--anos", nargs="+", type=int, default=[2022, 2023, 2024, 2025],
        help="Anos a extrair (default: 2022 2023 2024 2025)",
    )
    parser.add_argument(
        "--tipo", choices=list(TIPOS.keys()) + ["todos"], default="todos",
        help="Tipo de documento: contrato | ata | edital | todos",
    )
    parser.add_argument(
        "--apenas-listar", action="store_true",
        help="Apenas listar totais e anos disponíveis sem gravar CSVs",
    )
    args = parser.parse_args()

    tipos_selecionados = list(TIPOS.keys()) if args.tipo == "todos" else [args.tipo]
    anos = sorted(set(args.anos))

    PNCP_SAIDA.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
        )
        page = context.new_page()

        print("Abrindo sessao no PNCP...")
        page.goto(f"{BASE_URL}/app/contratos", wait_until="networkidle", timeout=60_000)
        print("Sessao ativa.\n")

        resumo = []

        for tipo in tipos_selecionados:
            label = TIPOS[tipo]
            campos = CAMPOS_POR_TIPO[tipo]

            print(f"=== {label.upper()} ===")
            try:
                items = buscar_todos(page, tipo)
            except RuntimeError as e:
                print(f"  ERRO: {e}\n")
                continue

            print(f"  Total bruto: {len(items)} registros")

            # q= faz busca full-text; filtrar por CNPJ exato para descartar falsos positivos
            total_bruto = len(items)
            items = [i for i in items if i.get("orgao_cnpj") == CNPJ]
            if len(items) < total_bruto:
                print(f"  Filtro CNPJ: descartados {total_bruto - len(items)} falsos positivos")

            if args.apenas_listar:
                anos_found = sorted(set(str(i.get("ano", "?")) for i in items))
                print(f"  Anos disponíveis: {anos_found}\n")
                continue

            for ano in anos:
                ano_items = [i for i in items if str(i.get("ano", "")) == str(ano)]
                if not ano_items:
                    print(f"  {ano}: 0 registros — pulando")
                    continue

                nome = f"pncp_sorocaba_{label}_{ano}.csv"
                destino = PNCP_SAIDA / nome
                n = salvar_csv(ano_items, campos, destino)
                tam = destino.stat().st_size
                status = "OK" if tam > 500 else "AVISO: arquivo pequeno"
                print(f"  {ano}: {n} registros -> {nome} ({tam:,} bytes) [{status}]")
                resumo.append((label, ano, n, tam, nome))

            print()

        browser.close()

    if resumo:
        print("=== RESUMO ===")
        for label, ano, n, tam, nome in resumo:
            print(f"  {label} {ano}: {n} registros, {tam:,} bytes -> {nome}")

    print("\nConcluido.")


if __name__ == "__main__":
    main()
